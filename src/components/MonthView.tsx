import React, { useMemo } from 'react';
import type { CalendarConfig, DateTimeState, CalendarLog, EventCategory } from '../types';
import { getFirstDayOfWeekIndex } from '../utils/calendarMath';
import styles from './MonthView.module.css';
import classNames from 'classnames';

interface MonthViewProps {
  config: CalendarConfig;
  viewDate: DateTimeState;
  logs: CalendarLog[]; // We now accept logs to render dots
  onSelectDay: (day: number) => void;
  onNavigateMonth: (direction: -1 | 1) => void;
}

// Your requested colors
const CAT_COLORS: Record<EventCategory, string> = {
  Session: 'white',
  Lore: '#bf80ff',   // Purple
  Holiday: '#ffd700', // Gold
  Campaign: '#ff5555', // Red
  Other: '#55aaff'    // Blue
};

export const MonthView: React.FC<MonthViewProps> = ({ 
  config, viewDate, logs, onSelectDay, onNavigateMonth
}) => {
  const currentMonthConfig = config.months[viewDate.monthIndex];
  const weekLength = config.weekDays.length || 7;

  const startOffset = useMemo(() => {
    return getFirstDayOfWeekIndex(config, viewDate.year, viewDate.monthIndex);
  }, [config, viewDate.year, viewDate.monthIndex]);

  // Filter logs for this specific month/year to save performance
  const logsInMonth = useMemo(() => {
    return logs.filter(l => 
      l.date.year === viewDate.year && 
      l.date.monthIndex === viewDate.monthIndex
    );
  }, [logs, viewDate.year, viewDate.monthIndex]);

  const days = [];
  
  // Empty Padding Cells
  for (let i = 0; i < startOffset; i++) {
    days.push(<div key={`pad-${i}`} className={classNames(styles.cell, styles.empty)} />);
  }

  // Actual Days
  for (let d = 1; d <= currentMonthConfig.days; d++) {
    const isToday = config.currentDate.year === viewDate.year && config.currentDate.monthIndex === viewDate.monthIndex && config.currentDate.day === d;
    const isSelected = viewDate.day === d;
    
    // Find events for this day
    const daysEvents = logsInMonth.filter(l => l.date.day === d);
    // Get unique colors to avoid 10 white dots for 10 session notes
    const dots = Array.from(new Set(daysEvents.map(l => CAT_COLORS[l.category])));

    days.push(
      <div 
        key={`day-${d}`}
        className={classNames(styles.cell, {
          [styles.today]: isToday,
          [styles.selected]: isSelected
        })}
        onClick={() => onSelectDay(d)}
      >
        {d}
        {/* Render Dots */}
        <div className={styles.dotContainer}>
          {dots.map((color, i) => (
            <span key={i} className={styles.dot} style={{ background: color }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.navButton} onClick={() => onNavigateMonth(-1)}>&lt;</button>
        <span>{currentMonthConfig.name} {viewDate.year}</span>
        <button className={styles.navButton} onClick={() => onNavigateMonth(1)}>&gt;</button>
      </div>
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${weekLength}, 1fr)` }}>
        {config.weekDays.map((day) => (
          <div key={day.name} className={styles.dayName}>{day.name.substring(0, 3)}</div>
        ))}
        {days}
      </div>
    </div>
  );
};