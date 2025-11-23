import React from 'react';
import type { CalendarLog, DateTimeState, EventCategory } from '../types';

interface NoteListProps {
  logs: CalendarLog[];
  selectedDate: DateTimeState;
  isGM: boolean;
  onDelete: (id: string) => void;
}

const CAT_COLORS: Record<EventCategory, string> = {
  Session: 'white',
  Lore: '#bf80ff',
  Holiday: '#ffd700',
  Campaign: '#ff5555',
  Other: '#55aaff'
};

export const NoteList: React.FC<NoteListProps> = ({ logs, selectedDate, isGM, onDelete }) => {
  
  const dailyLogs = logs.filter(log => {
    const isSameDate = log.date.year === selectedDate.year && log.date.monthIndex === selectedDate.monthIndex && log.date.day === selectedDate.day;
    if (!isSameDate) return false;
    if (log.isGmOnly && !isGM) return false;
    return true;
  });

  if (dailyLogs.length === 0) {
    return <div style={{ color: '#666', textAlign: 'center', padding: '10px', fontStyle: 'italic', fontSize: '0.8rem' }}>No events.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {dailyLogs.map(log => (
        <div key={log.id} style={{ 
           background: '#333', 
           borderRadius: '4px', 
           padding: '6px 10px',
           borderLeft: `4px solid ${CAT_COLORS[log.category] || 'white'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: CAT_COLORS[log.category] }}>{log.title}</span>
            {isGM && <button onClick={() => onDelete(log.id)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1rem' }}>×</button>}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#ccc', whiteSpace: 'pre-wrap' }}>{log.content}</div>
          {log.isGmOnly && <div style={{ fontSize: '0.7rem', color: '#ff5555', marginTop: '2px' }}>[Secret]</div>}
        </div>
      ))}
    </div>
  );
};