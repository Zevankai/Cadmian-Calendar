import { useEffect, useState, useRef } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import { v4 as uuidv4 } from 'uuid';
import {
  METADATA_KEY_CONFIG,
  METADATA_PREFIX_LOGS // <--- Legacy, for migration only
} from '../types';

import type {
  CalendarConfig,
  CalendarLogs,
  CalendarLog,
  DateTimeState,
  EventCategory
} from '../types';

import { DEFAULT_CONFIG } from '../defaultData';
import { calculateAdvancedDate } from '../utils/calendarMath';
import { generateWeather } from '../utils/weatherLogic';
import {
  readConfig,
  writeConfig,
  readAllLogs,
  writeLogs,
  readLogs,
  CALENDAR_ITEM_PREFIX,
  extractConfigFromItems,
  extractLogsFromItems
} from '../utils/itemStorage';

// Retry configuration for player sync
const PLAYER_SYNC_MAX_RETRIES = 5;
const PLAYER_SYNC_BASE_DELAY_MS = 500;

// Retry configuration for player waiting state
const PLAYER_WAITING_RETRY_INTERVAL_MS = 2500;

export const useCalendar = () => {
  const [config, setConfig] = useState<CalendarConfig | null>(null);
  const [logs, setLogs] = useState<CalendarLogs>([]);
  const [role, setRole] = useState<'GM' | 'PLAYER'>('PLAYER');
  const [ready, setReady] = useState(false);
  const [waitingForGM, setWaitingForGM] = useState(false);

  // Track previous config/logs JSON strings to detect actual changes
  const prevConfigJsonRef = useRef<string | null>(null);
  const prevLogsJsonRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribeItems: (() => void) | undefined;
    let playerRole: 'GM' | 'PLAYER' = 'PLAYER';

    const setup = async () => {
      try {
        await new Promise<void>(resolve => OBR.onReady(() => resolve()));
        if (!active) return;

        playerRole = await OBR.player.getRole();
        if (active) setRole(playerRole);

        console.log('[Calendar] Starting setup...');

        // Wait for scene to be ready
        console.log('[Calendar] Waiting for scene to be ready...');
        await OBR.scene.isReady();
        console.log('[Calendar] Scene is ready!');

        // 1. Set up the listener FIRST - this ensures we catch any changes during setup
        // and also provides initial sync when subscription fires immediately
        unsubscribeItems = OBR.scene.items.onChange((items) => {
          if (!active) return;

          // Check if any calendar items exist in the scene
          const calendarItems = items.filter(item =>
            item.id.startsWith(CALENDAR_ITEM_PREFIX)
          );

          // Only process if calendar items exist
          if (calendarItems.length === 0) {
            return;
          }

          // Extract config and logs directly from the items passed to the callback
          // This avoids race conditions from making separate API calls
          const newConfig = extractConfigFromItems(items);
          const newLogs = extractLogsFromItems(items);

          // Only update if we have valid config. Config is required, but logs can be empty.
          // extractLogsFromItems returns [] if no log items exist, which is valid.
          if (!newConfig) {
            return;
          }

          // Use JSON comparison to detect actual changes.
          // Note: JSON.stringify is called on every onChange event but is acceptable
          // for typical calendar data sizes. For very large datasets, consider
          // implementing a hash-based approach.
          const newConfigJson = JSON.stringify(newConfig);
          const newLogsJson = JSON.stringify(newLogs);

          const configChanged = newConfigJson !== prevConfigJsonRef.current;
          const logsChanged = newLogsJson !== prevLogsJsonRef.current;

          // Only update state if something actually changed
          if (configChanged || logsChanged) {
            console.log('[Calendar] Calendar data changed, syncing...', {
              configChanged,
              logsChanged
            });

            // Update refs to track current state
            prevConfigJsonRef.current = newConfigJson;
            prevLogsJsonRef.current = newLogsJson;

            if (active) {
              if (configChanged) {
                setConfig(newConfig);
              }
              if (logsChanged) {
                setLogs(newLogs);
              }
              // Mark as ready if not already (for initial sync)
              setReady(true);
              // Clear waiting state if we receive config
              setWaitingForGM(false);
            }
          }
        });

        // 2. Try reading from item metadata
        console.log('[Calendar] Reading config from items...');
        let loadedConfig = await readConfig();
        console.log('[Calendar] Config loaded:', loadedConfig ? 'Found' : 'Not found');

        console.log('[Calendar] Reading logs from items...');
        let allLogs = await readAllLogs();
        console.log('[Calendar] Logs loaded:', allLogs.length, 'events');

        // 3. Migration: If no item config found and GM, check room metadata
        if (!loadedConfig && playerRole === 'GM') {
          console.log('[Calendar] No config found, checking room metadata for migration...');
          const roomMetadata = await OBR.room.getMetadata();
          const roomConfig = roomMetadata[METADATA_KEY_CONFIG] as CalendarConfig | undefined;

          if (roomConfig) {
            // Migrate config from room to item
            console.log('[Calendar] Migrating config from room metadata to item metadata...');
            await writeConfig(roomConfig);
            loadedConfig = roomConfig;

            // Migrate logs from room to items
            console.log('[Calendar] Migrating logs from room metadata to item metadata...');
            const roomLogs: CalendarLogs = [];
            Object.keys(roomMetadata).forEach(key => {
              if (key.startsWith(METADATA_PREFIX_LOGS)) {
                const bucketLogs = roomMetadata[key] as CalendarLogs;
                if (Array.isArray(bucketLogs)) {
                  roomLogs.push(...bucketLogs);
                }
              }
            });

            // Group logs by year/month and write to separate items
            const buckets = new Map<string, CalendarLogs>();
            roomLogs.forEach(log => {
              const key = `${log.date.year}-${log.date.monthIndex}`;
              if (!buckets.has(key)) {
                buckets.set(key, []);
              }
              buckets.get(key)!.push(log);
            });

            for (const [key, bucketLogs] of buckets.entries()) {
              const [yearStr, monthStr] = key.split('-');
              const year = parseInt(yearStr);
              const monthIndex = parseInt(monthStr);
              await writeLogs(year, monthIndex, bucketLogs);
            }

            allLogs = roomLogs;
            console.log('[Calendar] Migration complete!');
          } else {
            // No existing data, GM creates new default config
            console.log('[Calendar] No existing data, creating default config...');
            loadedConfig = DEFAULT_CONFIG;
            await writeConfig(DEFAULT_CONFIG);
          }
        }

        // 4. For players, if config not found, wait longer for GM's config to sync
        if (!loadedConfig && playerRole === 'PLAYER') {
          console.log('[Calendar] Player mode: config not found, waiting for GM config...');

          // Retry with increasing delay for better sync reliability
          for (let attempt = 1; attempt <= PLAYER_SYNC_MAX_RETRIES && !loadedConfig; attempt++) {
            const delay = attempt * PLAYER_SYNC_BASE_DELAY_MS;
            console.log(`[Calendar] Retry attempt ${attempt}/${PLAYER_SYNC_MAX_RETRIES} (waiting ${delay}ms)...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            loadedConfig = await readConfig();
            if (loadedConfig) {
              console.log('[Calendar] Config found on retry!');
              allLogs = await readAllLogs();
            }
          }

          if (!loadedConfig) {
            // Instead of using default, enter waiting state and continue retrying
            console.log('[Calendar] No config found after retries, entering waiting state for GM');
            if (active) {
              setWaitingForGM(true);
              setReady(true);
            }

            // Start background retry loop for players waiting for GM
            const retryForGMConfig = async () => {
              while (active) {
                await new Promise(resolve => setTimeout(resolve, PLAYER_WAITING_RETRY_INTERVAL_MS));
                if (!active) return;

                console.log('[Calendar] Retrying to fetch GM config...');
                const gmConfig = await readConfig();
                if (gmConfig) {
                  console.log('[Calendar] GM config found!');
                  const gmLogs = await readAllLogs();
                  if (active) {
                    setConfig(gmConfig);
                    setLogs(gmLogs);
                    setWaitingForGM(false);
                    // Update refs for change detection
                    prevConfigJsonRef.current = JSON.stringify(gmConfig);
                    prevLogsJsonRef.current = JSON.stringify(gmLogs);
                  }
                  return;
                }
              }
            };
            retryForGMConfig();
            return; // Exit setup early, we're now in waiting state
          }
        }

        // 5. Set initial state and mark as ready
        if (active) {
          console.log('[Calendar] Setting state and marking as ready');
          const initialConfig = loadedConfig || DEFAULT_CONFIG;
          setConfig(initialConfig);
          setLogs(allLogs);
          setReady(true);

          // Initialize refs for change detection
          prevConfigJsonRef.current = JSON.stringify(initialConfig);
          prevLogsJsonRef.current = JSON.stringify(allLogs);
        }

        console.log('[Calendar] Setup complete!');
      } catch (error) {
        console.error('[Calendar] Error during setup:', error);
        // For GMs, set ready to true with default config so they can create the calendar
        // For players, set waiting state instead of using default config
        if (active) {
          if (playerRole === 'GM') {
            setConfig(DEFAULT_CONFIG);
            setLogs([]);
            setReady(true);
            // Initialize refs for change detection
            prevConfigJsonRef.current = JSON.stringify(DEFAULT_CONFIG);
            prevLogsJsonRef.current = JSON.stringify([]);
          } else {
            // Players should wait for GM instead of using default
            setWaitingForGM(true);
            setReady(true);
          }
        }
      }
    };

    if (OBR.isAvailable) setup();

    return () => { active = false; if (unsubscribeItems) unsubscribeItems(); };
  }, []);

  // --- ACTIONS ---

  const updateConfig = async (newConfig: CalendarConfig) => {
    if (role !== 'GM') return;
    setConfig(newConfig);
    await writeConfig(newConfig);
  };

  const updateTime = async (minutesToAdd: number) => {
    if (role !== 'GM' || !config) return;
    const newDate = calculateAdvancedDate(config, config.currentDate, minutesToAdd);

    let newWeather = config.currentWeather;
    const hourDiff = Math.abs(newDate.hour - config.currentWeather.lastUpdatedHour);
    const isNewDay = newDate.day !== config.currentDate.day;

    if (hourDiff >= 2 || isNewDay) {
      const season = config.months[newDate.monthIndex].season;
      const weatherRoll = generateWeather(season, config.activeBiome || 'Temperate');
      newWeather = { ...weatherRoll, lastUpdatedHour: newDate.hour };
    }

    const updatedConfig = { ...config, currentDate: newDate, currentWeather: newWeather };
    setConfig(updatedConfig);
    await writeConfig(updatedConfig);
  };

  const setExactDate = async (newDateState: Partial<DateTimeState>) => {
    if (role !== 'GM' || !config) return;
    const updatedConfig = { ...config, currentDate: { ...config.currentDate, ...newDateState } };
    setConfig(updatedConfig);
    await writeConfig(updatedConfig);
  }

  const updateWeather = async (weatherCondition: string, temperature?: number) => {
    if (role !== 'GM' || !config) return;
    const updatedConfig = { ...config, currentWeather: { ...config.currentWeather, currentCondition: weatherCondition, temperature: temperature ?? config.currentWeather.temperature } };
    setConfig(updatedConfig);
    await writeConfig(updatedConfig);
  }

  // --- ADDING LOGS TO ITEM-BASED STORAGE ---
  const addLog = async (title: string, content: string, category: EventCategory, date: DateTimeState, isGmOnly: boolean) => {
    if (role !== 'GM') return;

    const newLog: CalendarLog = {
      id: uuidv4(),
      date: { year: date.year, monthIndex: date.monthIndex, day: date.day },
      title, content, category, authorId: OBR.player.id, isGmOnly, timestamp: Date.now()
    };

    // 1. Get existing logs for this month from item metadata
    const existingBucketLogs = await readLogs(date.year, date.monthIndex);

    // 2. Add new log to the bucket
    const newBucketLogs = [...existingBucketLogs, newLog];

    // 3. Write to item metadata
    await writeLogs(date.year, date.monthIndex, newBucketLogs);

    // 4. Update local state
    setLogs([...logs, newLog]);
  };

  const deleteLog = async (logId: string) => {
    if (role !== 'GM') return;

    const logToDelete = logs.find(l => l.id === logId);
    if (!logToDelete) return;

    // 1. Get existing logs for this month from item metadata
    const existingBucketLogs = await readLogs(logToDelete.date.year, logToDelete.date.monthIndex);

    // 2. Remove the log from the bucket
    const newBucketLogs = existingBucketLogs.filter(l => l.id !== logId);

    // 3. Write to item metadata
    await writeLogs(logToDelete.date.year, logToDelete.date.monthIndex, newBucketLogs);

    // 4. Update local state
    setLogs(logs.filter(l => l.id !== logId));
  };

  return {
    ready, role, config, logs, isGM: role === 'GM', waitingForGM,
    actions: { updateConfig, updateTime, setExactDate, updateWeather, addLog, deleteLog }
  };
};