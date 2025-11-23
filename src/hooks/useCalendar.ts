import { useEffect, useState } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import { v4 as uuidv4 } from 'uuid';
import { 
  METADATA_KEY_CONFIG, 
  METADATA_PREFIX_LOGS // <--- We use the prefix now
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

// HELPER: Generates the specific key for a month (e.g. "...logs.1492-0")
const getBucketKey = (year: number, monthIndex: number) => {
  return `${METADATA_PREFIX_LOGS}.${year}-${monthIndex}`;
};

export const useCalendar = () => {
  const [config, setConfig] = useState<CalendarConfig | null>(null);
  const [logs, setLogs] = useState<CalendarLogs>([]);
  const [role, setRole] = useState<'GM' | 'PLAYER'>('PLAYER');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribeMetadata: (() => void) | undefined;

    const setup = async () => {
      await new Promise<void>(resolve => OBR.onReady(() => resolve()));
      if (!active) return;

      const playerRole = await OBR.player.getRole();
      if (active) setRole(playerRole);

      // 1. Get ALL Metadata
      const metadata = await OBR.room.getMetadata();
      
      // 2. Handle Config
      let loadedConfig = metadata[METADATA_KEY_CONFIG] as CalendarConfig;
      if (!loadedConfig && playerRole === 'GM') {
        loadedConfig = DEFAULT_CONFIG;
        await OBR.room.setMetadata({ [METADATA_KEY_CONFIG]: DEFAULT_CONFIG });
      }

      // 3. Handle Logs (Bucketing Strategy)
      // Scan for any key that starts with our prefix
      const allLogs: CalendarLogs = [];
      Object.keys(metadata).forEach(key => {
        if (key.startsWith(METADATA_PREFIX_LOGS)) {
          const bucketLogs = metadata[key] as CalendarLogs;
          if (Array.isArray(bucketLogs)) {
            allLogs.push(...bucketLogs);
          }
        }
      });

      if (active) {
        setConfig(loadedConfig || DEFAULT_CONFIG);
        setLogs(allLogs);
        setReady(true);
      }

      // 4. Register Listener
      unsubscribeMetadata = OBR.room.onMetadataChange((changes) => {
        if (!active) return;

        // A. Config Update?
        if (changes[METADATA_KEY_CONFIG]) {
          setConfig(changes[METADATA_KEY_CONFIG] as CalendarConfig);
        }

        // B. Logs Update?
        // Check if ANY changed key matches our prefix
        const logKeysChanged = Object.keys(changes).some(k => k.startsWith(METADATA_PREFIX_LOGS));
        
        if (logKeysChanged) {
          // Re-sync local logs state from the changes
          setLogs((prevLogs) => {
             // Identify which buckets changed
             const changedBuckets = Object.keys(changes).filter(k => k.startsWith(METADATA_PREFIX_LOGS));
             
             let newLogsState = [...prevLogs];

             changedBuckets.forEach(key => {
                // Extract Year/Month from key to remove old data
                const suffix = key.replace(`${METADATA_PREFIX_LOGS}.`, '');
                const [yStr, mStr] = suffix.split('-');
                const y = parseInt(yStr);
                const m = parseInt(mStr);

                // Remove old logs for this bucket
                newLogsState = newLogsState.filter(l => !(l.date.year === y && l.date.monthIndex === m));

                // Add new logs from the update (if not undefined/deleted)
                const newBucketData = changes[key] as CalendarLogs;
                if (newBucketData && Array.isArray(newBucketData)) {
                  newLogsState.push(...newBucketData);
                }
             });

             return newLogsState;
          });
        }
      });
    };

    if (OBR.isAvailable) setup();

    return () => { active = false; if (unsubscribeMetadata) unsubscribeMetadata(); };
  }, []);

  // --- ACTIONS ---

  const updateConfig = async (newConfig: CalendarConfig) => {
    if (role !== 'GM') return;
    setConfig(newConfig);
    await OBR.room.setMetadata({ [METADATA_KEY_CONFIG]: newConfig });
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
    await OBR.room.setMetadata({ [METADATA_KEY_CONFIG]: updatedConfig });
  };

  const setExactDate = async (newDateState: Partial<DateTimeState>) => {
    if (role !== 'GM' || !config) return;
    const updatedConfig = { ...config, currentDate: { ...config.currentDate, ...newDateState } };
    setConfig(updatedConfig);
    await OBR.room.setMetadata({ [METADATA_KEY_CONFIG]: updatedConfig });
  }

  const updateWeather = async (weatherCondition: string, temperature?: number) => {
    if (role !== 'GM' || !config) return;
    const updatedConfig = { ...config, currentWeather: { ...config.currentWeather, currentCondition: weatherCondition, temperature: temperature ?? config.currentWeather.temperature } };
    setConfig(updatedConfig);
    await OBR.room.setMetadata({ [METADATA_KEY_CONFIG]: updatedConfig });
  }

  // --- THE CRITICAL PART: ADDING LOGS TO SPECIFIC BUCKETS ---
  const addLog = async (title: string, content: string, category: EventCategory, date: DateTimeState, isGmOnly: boolean) => {
    if (role !== 'GM') return;

    const newLog: CalendarLog = {
      id: uuidv4(),
      date: { year: date.year, monthIndex: date.monthIndex, day: date.day },
      title, content, category, authorId: OBR.player.id, isGmOnly, timestamp: Date.now()
    };

    // 1. Determine Bucket Key (e.g. logs.1492-0)
    const bucketKey = getBucketKey(date.year, date.monthIndex);

    // 2. Filter existing logs to find ones belonging to THIS bucket only
    const existingBucketLogs = logs.filter(l => 
      l.date.year === date.year && l.date.monthIndex === date.monthIndex
    );

    // 3. Update only that bucket
    const newBucketLogs = [...existingBucketLogs, newLog];
    await OBR.room.setMetadata({ [bucketKey]: newBucketLogs });
    
    // 4. Update local state
    setLogs([...logs, newLog]);
  };

  const deleteLog = async (logId: string) => {
    if (role !== 'GM') return;

    const logToDelete = logs.find(l => l.id === logId);
    if (!logToDelete) return;

    // 1. Determine Bucket Key
    const bucketKey = getBucketKey(logToDelete.date.year, logToDelete.date.monthIndex);

    // 2. Filter bucket
    const existingBucketLogs = logs.filter(l => 
      l.date.year === logToDelete.date.year && l.date.monthIndex === logToDelete.date.monthIndex
    );
    const newBucketLogs = existingBucketLogs.filter(l => l.id !== logId);

    // 3. Update OBR
    await OBR.room.setMetadata({ [bucketKey]: newBucketLogs });

    // 4. Update Local
    setLogs(logs.filter(l => l.id !== logId));
  };

  return {
    ready, role, config, logs, isGM: role === 'GM',
    actions: { updateConfig, updateTime, setExactDate, updateWeather, addLog, deleteLog }
  };
};