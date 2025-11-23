import { useEffect, useState } from 'react';
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
  readLogs
} from '../utils/itemStorage';

export const useCalendar = () => {
  const [config, setConfig] = useState<CalendarConfig | null>(null);
  const [logs, setLogs] = useState<CalendarLogs>([]);
  const [role, setRole] = useState<'GM' | 'PLAYER'>('PLAYER');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribeItems: (() => void) | undefined;

    const setup = async () => {
      try {
        await new Promise<void>(resolve => OBR.onReady(() => resolve()));
        if (!active) return;

        const playerRole = await OBR.player.getRole();
        if (active) setRole(playerRole);

        console.log('[Calendar] Starting setup...');

        // Wait for scene to be ready
        console.log('[Calendar] Waiting for scene to be ready...');
        await OBR.scene.isReady();
        console.log('[Calendar] Scene is ready!');

        // 1. Try reading from item metadata
        console.log('[Calendar] Reading config from items...');
        let loadedConfig = await readConfig();
        console.log('[Calendar] Config loaded:', loadedConfig ? 'Found' : 'Not found');

        console.log('[Calendar] Reading logs from items...');
        let allLogs = await readAllLogs();
        console.log('[Calendar] Logs loaded:', allLogs.length, 'events');

        // 2. Migration: If no item config found, check room metadata
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
            // No existing data, create new
            console.log('[Calendar] No existing data, creating default config...');
            loadedConfig = DEFAULT_CONFIG;
            await writeConfig(DEFAULT_CONFIG);
          }
        }

        // For players, wait for GM to create config
        if (!loadedConfig && playerRole === 'PLAYER') {
          console.log('[Calendar] Player mode: using default config until GM creates one');
          loadedConfig = DEFAULT_CONFIG;
        }

        if (active) {
          console.log('[Calendar] Setting state and marking as ready');
          setConfig(loadedConfig || DEFAULT_CONFIG);
          setLogs(allLogs);
          setReady(true);
        }

        // 3. Listen for scene item changes (our calendar items)
        unsubscribeItems = OBR.scene.items.onChange(async (items) => {
          if (!active) return;

          // Check if any calendar items changed
          const calendarItems = items.filter(item =>
            item.id.startsWith('com.username.calendar-')
          );

          if (calendarItems.length === 0) return;

          console.log('[Calendar] Calendar items changed, reloading...');
          // Reload config and logs when calendar items change
          const newConfig = await readConfig();
          const newLogs = await readAllLogs();

          if (newConfig) setConfig(newConfig);
          setLogs(newLogs);
        });

        console.log('[Calendar] Setup complete!');
      } catch (error) {
        console.error('[Calendar] Error during setup:', error);
        // Even if there's an error, set ready to true with default config
        // so the extension doesn't get stuck on loading
        if (active) {
          setConfig(DEFAULT_CONFIG);
          setLogs([]);
          setReady(true);
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
    ready, role, config, logs, isGM: role === 'GM',
    actions: { updateConfig, updateTime, setExactDate, updateWeather, addLog, deleteLog }
  };
};