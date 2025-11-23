import React, { useState } from 'react';
import type { DateTimeState, EventCategory } from '../types';

interface NoteEditorProps {
  selectedDate: DateTimeState;
  onSave: (title: string, content: string, category: EventCategory, isGmOnly: boolean) => void;
  onCancel: () => void;
}

const CATEGORIES: { label: string; value: EventCategory; color: string }[] = [
  { label: 'Session Start', value: 'Session', color: 'white' },
  { label: 'Lore', value: 'Lore', color: '#bf80ff' }, // Purple
  { label: 'Holiday', value: 'Holiday', color: '#ffd700' }, // Gold
  { label: 'Campaign', value: 'Campaign', color: '#ff5555' }, // Red
  { label: 'Other', value: 'Other', color: '#55aaff' }, // Blue
];

export const NoteEditor: React.FC<NoteEditorProps> = ({ selectedDate, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<EventCategory>('Other');
  const [isGmOnly, setIsGmOnly] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title, content, category, isGmOnly);
  };

  return (
    <form onSubmit={handleSubmit} style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      padding: '14px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{
        fontSize: '0.85rem',
        color: '#fff',
        fontWeight: '600',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)'
      }}>New Event: {selectedDate.day}/{selectedDate.monthIndex+1}</div>

      <input
        autoFocus
        placeholder="Event Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#fff',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '0.9rem',
          outline: 'none',
          transition: 'all 0.2s ease'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(100, 108, 255, 0.2)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      <select
        value={category}
        onChange={e => setCategory(e.target.value as EventCategory)}
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#fff',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '0.9rem',
          outline: 'none',
          cursor: 'pointer'
        }}
      >
        {CATEGORIES.map(cat => (
          <option key={cat.value} value={cat.value} style={{ background: '#1a1a1a', color: cat.color }}>
             ● {cat.label}
          </option>
        ))}
      </select>

      <textarea
        rows={3}
        placeholder="Details..."
        value={content}
        onChange={e => setContent(e.target.value)}
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#fff',
          padding: '10px',
          borderRadius: '8px',
          resize: 'vertical',
          fontSize: '0.9rem',
          outline: 'none',
          fontFamily: 'inherit',
          transition: 'all 0.2s ease'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(100, 108, 255, 0.2)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.85rem',
        color: '#ddd',
        cursor: 'pointer',
        userSelect: 'none'
      }}>
        <input
          type="checkbox"
          checked={isGmOnly}
          onChange={e => setIsGmOnly(e.target.checked)}
          style={{ cursor: 'pointer' }}
        />
        Secret (GM Only)
      </label>

      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button type="submit" style={{
          flex: 1,
          background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          padding: '10px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '0.9rem',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #45a049 0%, #4CAF50 100%)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
        }}>Save</button>
        <button type="button" onClick={onCancel} style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ddd',
          padding: '10px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.color = '#ddd';
        }}>Cancel</button>
      </div>
    </form>
  );
};