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
      background: 'transparent', border: '1px solid #444', color: '#aaa', 
      fontFamily: 'monospace', fontSize: '0.8rem', cursor: 'pointer',
      padding: '2px 6px', borderRadius: '3px', minWidth: '24px'
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
    <div style={{ background: '#1a1a1a', borderBottom: '1px solid #333', padding: '8px' }}>
      
      {/* TOP ROW: Time - Weather - Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        
        {/* CLOCK & WEATHER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', lineHeight: 1 }}>
             {formatTime12Hour(date.hour, date.minute)}
          </div>
          <div 
             onClick={onWeatherClick}
             style={{ 
               fontSize: '0.8rem', color: '#bbb', cursor: isGM ? 'pointer' : 'default',
               borderBottom: isGM ? '1px dashed #444' : 'none'
             }}
          >
             {weather.currentCondition}, {weather.temperature}°
          </div>
        </div>

        {/* DATE & MOON */}
        <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
           <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#eee' }}>
              {date.day} / {date.monthIndex + 1} / {date.year} <span style={{fontSize:'0.75em', color:'#888'}}>{yearName}</span>
           </div>
           <div style={{ fontSize: '0.7rem', color: '#888' }}>{moon}</div>
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
             style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.2rem' }}
             title="Settings"
           >
             ⚙
           </button>
        </div>
      )}
    </div>
  );
};