import type { CalendarConfig, CalendarLogs } from './types';

export const DEFAULT_CONFIG: CalendarConfig = {
  yearName: 'DR',
  yearStartDayOffset: 0,
  activeBiome: 'Temperate', // Default Biome
  moonCycle: 29.5,
  weekDays: [
    { name: 'Monday' }, { name: 'Tuesday' }, { name: 'Wednesday' },
    { name: 'Thursday' }, { name: 'Friday' }, { name: 'Saturday' }, { name: 'Sunday' }
  ],
  months: [
    { name: 'Hammer', days: 30, season: 'Winter' },
    { name: 'Alturiak', days: 30, season: 'Winter' },
    { name: 'Ches', days: 30, season: 'Spring' },
    { name: 'Tarsakh', days: 30, season: 'Spring' },
    { name: 'Mirtul', days: 30, season: 'Spring' },
    { name: 'Kythorn', days: 30, season: 'Summer' },
    { name: 'Flamerule', days: 30, season: 'Summer' },
    { name: 'Eleasis', days: 30, season: 'Summer' },
    { name: 'Eleint', days: 30, season: 'Fall' },
    { name: 'Marpenoth', days: 30, season: 'Fall' },
    { name: 'Uktar', days: 30, season: 'Fall' },
    { name: 'Nightal', days: 30, season: 'Winter' },
  ],
  holidays: [],
  currentDate: {
    year: 1492,
    monthIndex: 0,
    day: 1,
    hour: 8,
    minute: 0,
  },
  currentWeather: {
    currentCondition: 'Clear',
    temperature: 72,
    lastUpdatedHour: 8,
  },
};

export const DEFAULT_LOGS: CalendarLogs = [];