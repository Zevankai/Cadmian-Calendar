import React from 'react';
import type { DateTimeState, WeatherState, MoonPhase } from '../types';
import { formatTime12Hour } from '../utils/calendarMath';

interface CompactHeaderProps {
  date: DateTimeState;
  weather: WeatherState;
  moon: MoonPhase;
  yearName: string;
  isGM: boolean;
  onAdvanceTime: (minutes: number) => void;
  onWeatherClick: () => void;
  onConfigClick: () => void;
}

const TimeBtn: React.FC<{ label: string, onClick: () => void }> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(5px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      color: '#e0e0e0',
      fontFamily: 'monospace',
      fontSize: '0.8rem',
      cursor: 'pointer',
      padding: '4px 8px',
      borderRadius: '6px',
      minWidth: '28px',
      transition: 'all 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      e.currentTarget.style.color = 'white';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      e.currentTarget.style.color = '#e0e0e0';
    }}
    title="Advance Time"
  >
    {label}
  </button>
);

export const CompactHeader: React.FC<CompactHeaderProps> = ({
  date, weather, moon, yearName, isGM, onAdvanceTime, onWeatherClick, onConfigClick
}) => {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px 16px 0 0',
      padding: '12px',
      margin: '8px 8px 0 8px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
    }}>

      {/* TOP ROW: Time - Weather - Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>

        {/* CLOCK & WEATHER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            fontSize: '1.4rem',
            fontWeight: 'bold',
            lineHeight: 1,
            color: '#fff',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
             {formatTime12Hour(date.hour, date.minute)}
          </div>
          <div
             onClick={onWeatherClick}
             style={{
               fontSize: '0.8rem',
               color: '#ddd',
               cursor: isGM ? 'pointer' : 'default',
               borderBottom: isGM ? '1px dashed rgba(255, 255, 255, 0.4)' : 'none',
               transition: 'color 0.2s ease'
             }}
             onMouseEnter={(e) => isGM && (e.currentTarget.style.color = '#fff')}
             onMouseLeave={(e) => isGM && (e.currentTarget.style.color = '#ddd')}
          >
             {weather.currentCondition}, {weather.temperature}°
          </div>
        </div>

        {/* DATE & MOON */}
        <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
           <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff', textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)' }}>
              {date.day} / {date.monthIndex + 1} / {date.year} <span style={{fontSize:'0.75em', color:'#aaa'}}>{yearName}</span>
           </div>
           <div style={{ fontSize: '0.7rem', color: '#aaa' }}>{moon}</div>
        </div>
      </div>

      {/* BOTTOM ROW: Controls (GM Only) */}
      {isGM && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ display: 'flex', gap: '2px' }}>
              <TimeBtn label="<<<" onClick={() => onAdvanceTime(-480)} /> {/* -8h */}
              <TimeBtn label="<<" onClick={() => onAdvanceTime(-240)} />  {/* -4h */}
              <TimeBtn label="<" onClick={() => onAdvanceTime(-60)} />    {/* -1h */}
              <TimeBtn label="+" onClick={() => onAdvanceTime(5)} />      {/* +5m */}
              <TimeBtn label=">" onClick={() => onAdvanceTime(60)} />     {/* +1h */}
              <TimeBtn label=">>" onClick={() => onAdvanceTime(240)} />   {/* +4h */}
              <TimeBtn label=">>>" onClick={() => onAdvanceTime(480)} />  {/* +8h */}
           </div>
           
           <button
             onClick={onConfigClick}
             style={{
               background: 'rgba(255, 255, 255, 0.1)',
               backdropFilter: 'blur(5px)',
               border: '1px solid rgba(255, 255, 255, 0.2)',
               borderRadius: '6px',
               color: '#aaa',
               cursor: 'pointer',
               fontSize: '1.2rem',
               padding: '4px 8px',
               transition: 'all 0.2s ease'
             }}
             onMouseEnter={(e) => {
               e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
               e.currentTarget.style.color = '#fff';
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
               e.currentTarget.style.color = '#aaa';
             }}
             title="Settings"
           >
             ⚙
           </button>
        </div>
      )}
    </div>
  );
};