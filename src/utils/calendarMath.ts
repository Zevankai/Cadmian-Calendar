import type { CalendarConfig, MoonPhase, DateTimeState } from '../types';

export const getDaysInYear = (config: CalendarConfig): number => {
  return config.months.reduce((acc, month) => acc + month.days, 0);
};

export const getTotalDaysElapsed = (config: CalendarConfig, year: number, monthIndex: number, day: number): number => {
  const daysInYear = getDaysInYear(config);
  let total = year * daysInYear;
  for (let i = 0; i < monthIndex; i++) {
    if (config.months[i]) {
      total += config.months[i].days;
    }
  }
  total += day;
  return total;
};

export const getFirstDayOfWeekIndex = (config: CalendarConfig, year: number, monthIndex: number): number => {
  // 0 is treated as the day *before* the 1st of the month for offset calculation
  const totalDays = getTotalDaysElapsed(config, year, monthIndex, 0);
  
  if (config.weekDays.length === 0) return 0;
  
  // Add the global offset
  const startOffset = config.yearStartDayOffset || 0;

  return (totalDays + startOffset) % config.weekDays.length;
};

const MOON_PHASES: MoonPhase[] = [
  'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 
  'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent'
];

export const getMoonPhase = (config: CalendarConfig, year: number, month: number, day: number): MoonPhase => {
  const totalDays = getTotalDaysElapsed(config, year, month, day);
  const cycleLength = config.moonCycle || 29.5;
  const phaseIndex = Math.floor((totalDays % cycleLength) / (cycleLength / 8));
  return MOON_PHASES[phaseIndex % 8];
};

export const formatTime12Hour = (hour: number, minute: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  let h = hour % 12;
  if (h === 0) h = 12;
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m} ${period}`;
};

export const calculateAdvancedDate = (config: CalendarConfig, current: DateTimeState, minutesToAdd: number): DateTimeState => {
  let { year, monthIndex, day, hour, minute } = current;
  minute += minutesToAdd;
  while (minute >= 60) { minute -= 60; hour++; }
  while (minute < 0) { minute += 60; hour--; }
  while (hour >= 24) { hour -= 24; day++; }
  while (hour < 0) { hour += 24; day--; }

  while (true) {
    const currentMonthConfig = config.months[monthIndex];
    if (!currentMonthConfig) break;
    const daysInCurrentMonth = currentMonthConfig.days;

    if (day > daysInCurrentMonth) {
      day -= daysInCurrentMonth;
      monthIndex++;
      if (monthIndex >= config.months.length) {
        monthIndex = 0;
        year++;
      }
    } else if (day < 1) {
      monthIndex--;
      if (monthIndex < 0) {
        monthIndex = config.months.length - 1;
        year--;
      }
      if (config.months[monthIndex]) {
        day += config.months[monthIndex].days;
      } else { day = 30; }
    } else {
      break; 
    }
  }
  return { year, monthIndex, day, hour, minute };
};