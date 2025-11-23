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
    return <div style={{
      color: '#999',
      textAlign: 'center',
      padding: '20px',
      fontStyle: 'italic',
      fontSize: '0.85rem',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
    }}>No events for this day.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {dailyLogs.map(log => (
        <div key={log.id} style={{
           background: 'rgba(255, 255, 255, 0.12)',
           backdropFilter: 'blur(8px)',
           borderRadius: '10px',
           padding: '12px 14px',
           borderLeft: `4px solid ${CAT_COLORS[log.category] || 'white'}`,
           border: `1px solid rgba(255, 255, 255, 0.15)`,
           borderLeftWidth: '4px',
           boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
           transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.35)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{
              fontWeight: 'bold',
              fontSize: '0.95rem',
              color: CAT_COLORS[log.category],
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
              filter: 'brightness(1.2)'
            }}>{log.title}</span>
            {isGM && (
              <button
                onClick={() => onDelete(log.id)}
                style={{
                  background: 'rgba(255, 68, 68, 0.2)',
                  border: '1px solid rgba(255, 68, 68, 0.3)',
                  borderRadius: '4px',
                  color: '#ff8888',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '2px 8px',
                  lineHeight: 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 68, 68, 0.3)';
                  e.currentTarget.style.color = '#ffaaaa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)';
                  e.currentTarget.style.color = '#ff8888';
                }}
              >×</button>
            )}
          </div>
          <div style={{
            fontSize: '0.85rem',
            color: '#f0f0f0',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.5',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)'
          }}>{log.content}</div>
          {log.isGmOnly && (
            <div style={{
              fontSize: '0.75rem',
              color: '#ff8888',
              marginTop: '6px',
              fontWeight: '600',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)'
            }}>[GM Only]</div>
          )}
        </div>
      ))}
    </div>
  );
};