/**
 * CONSTANTS
 */
export const METADATA_KEY_CONFIG = 'com.username.calendar.config';

// NOTE: This is a PREFIX, not a full key.
// Real keys will look like: "com.username.calendar.logs.1492-0"
export const METADATA_PREFIX_LOGS = 'com.username.calendar.logs';

/**
 * UNION TYPES
 */
export type SeasonName = 'Spring' | 'Summer' | 'Fall' | 'Winter';
export type MoonPhase = 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous' | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';
export type EventCategory = 'Session' | 'Lore' | 'Holiday' | 'Campaign' | 'Other';
export type BiomeType = 'Temperate' | 'Desert' | 'Polar' | 'Rainforest' | 'Mediterranean' | 'Underdark';

/**
 * SUB-INTERFACES
 */
export interface Holiday {
  id: string;
  name: string;
  description?: string;
  monthIndex: number;
  day: number;
}

export interface MonthConfig {
  name: string;
  days: number;
  season: SeasonName;
}

export interface WeekDayConfig {
  name: string;
}

/**
 * STATE MANAGEMENT
 */
export interface DateTimeState {
  year: number;
  monthIndex: number;
  day: number;
  hour: number;
  minute: number;
}

export interface WeatherState {
  currentCondition: string;
  temperature: number;
  lastUpdatedHour: number;
}

/**
 * MAIN CONFIG STRUCTURE
 */
export interface CalendarConfig {
  yearName: string;
  yearStartDayOffset: number;
  activeBiome: BiomeType;
  moonCycle: number;
  weekDays: WeekDayConfig[];
  months: MonthConfig[];
  holidays: Holiday[];
  currentDate: DateTimeState;
  currentWeather: WeatherState;
}

/**
 * LOGS STRUCTURE
 */
export interface CalendarLog {
  id: string;
  date: {
    year: number;
    monthIndex: number;
    day: number;
  };
  title: string;
  content: string;
  category: EventCategory;
  authorId: string;
  isGmOnly: boolean;
  timestamp: number;
}

export type CalendarLogs = CalendarLog[];

export interface ViewState {
  view: 'month' | 'week' | 'day';
  selectedDate?: DateTimeState;
  isLocked: boolean;
}