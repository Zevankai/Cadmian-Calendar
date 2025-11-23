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
    <form onSubmit={handleSubmit} style={{ background: '#222', padding: '10px', borderRadius: '4px', border: '1px solid #444', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{fontSize: '0.8rem', color: '#aaa'}}>New Event: {selectedDate.day}/{selectedDate.monthIndex+1}</div>
      
      <input 
        autoFocus
        placeholder="Event Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{ background: '#111', border: '1px solid #444', color: 'white', padding: '6px', borderRadius: '3px' }}
      />

      <select 
        value={category}
        onChange={e => setCategory(e.target.value as EventCategory)}
        style={{ background: '#111', border: '1px solid #444', color: 'white', padding: '6px', borderRadius: '3px' }}
      >
        {CATEGORIES.map(cat => (
          <option key={cat.value} value={cat.value} style={{ color: cat.color }}>
             ● {cat.label}
          </option>
        ))}
      </select>
      
      <textarea 
        rows={3}
        placeholder="Details..."
        value={content}
        onChange={e => setContent(e.target.value)}
        style={{ background: '#111', border: '1px solid #444', color: 'white', padding: '6px', borderRadius: '3px', resize: 'vertical' }}
      />
      
      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', color: '#aaa' }}>
        <input type="checkbox" checked={isGmOnly} onChange={e => setIsGmOnly(e.target.checked)} />
        Secret (GM Only)
      </label>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="submit" style={{ flex: 1, background: '#4CAF50', border: 'none', color: 'white', padding: '6px', borderRadius: '3px', cursor: 'pointer' }}>Save</button>
        <button type="button" onClick={onCancel} style={{ background: 'transparent', border: '1px solid #555', color: '#aaa', padding: '6px', borderRadius: '3px', cursor: 'pointer' }}>Cancel</button>
      </div>
    </form>
  );
};