import { useState, useEffect } from 'react';
import './App.css';
import { useCalendar } from './hooks/useCalendar';
import { MonthView } from './components/MonthView';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { Settings } from './components/Settings';
import { CompactHeader } from './components/CompactHeader';
import type { DateTimeState } from './types';
import { getMoonPhase } from './utils/calendarMath';
import { getThemeColors, applyTheme } from './utils/theme';

function App() {
  // FIXED: Removed 'role' from this line
  const { ready, config, logs, isGM, actions } = useCalendar();

  const [viewDate, setViewDate] = useState<DateTimeState | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'settings'>('calendar');

  useEffect(() => {
    if (config && !viewDate) {
      setViewDate(config.currentDate);
    }
  }, [config, viewDate]);

  // Apply dynamic theme based on biome and season
  useEffect(() => {
    if (config) {
      const currentMonth = config.months[config.currentDate.monthIndex];
      const season = currentMonth.season;
      const biome = config.activeBiome;

      const themeColors = getThemeColors(biome, season);
      applyTheme(themeColors);
    }
  }, [config]);

  if (!ready || !config || !viewDate) return <div className="loading">Loading...</div>;

  const moonPhase = getMoonPhase(config, config.currentDate.year, config.currentDate.monthIndex, config.currentDate.day);

  // Helper: Weather Click
  const handleWeatherClick = () => {
    if (!isGM) return;
    const newCondition = prompt("Override Weather Condition:", config.currentWeather.currentCondition);
    if (newCondition) {
      const newTempStr = prompt("Override Temperature:", config.currentWeather.temperature.toString());
      const newTemp = newTempStr ? parseInt(newTempStr) : config.currentWeather.temperature;
      actions.updateWeather(newCondition, newTemp);
    }
  };

  // RENDER SETTINGS
  if (activeTab === 'settings') {
    return (
      <Settings
        config={config}
        logs={logs}
        onSave={(newConfig) => {
            actions.updateConfig(newConfig);
            setActiveTab('calendar');
        }}
        onCancel={() => setActiveTab('calendar')}
      />
    );
  }

  // RENDER MAIN APP
  return (
    <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* COMPACT HEADER (Contains Time, Date, Weather, GM Controls) */}
      <CompactHeader 
        date={config.currentDate}
        weather={config.currentWeather}
        moon={moonPhase}
        yearName={config.yearName}
        isGM={isGM}
        onAdvanceTime={actions.updateTime}
        onWeatherClick={handleWeatherClick}
        onConfigClick={() => setActiveTab('settings')}
      />
      
      {/* SCROLLABLE CONTENT AREA */}
      <div className="scroll-area">
        
        {/* CALENDAR GRID */}
        <div style={{ flexShrink: 0 }}>
           <MonthView 
              config={config} 
              logs={logs}
              viewDate={viewDate}
              onSelectDay={(day) => {
                setViewDate({ ...viewDate, day });
                setIsCreatingNote(false); 
              }}
              onNavigateMonth={(dir) => {
                let newMonth = viewDate.monthIndex + dir;
                let newYear = viewDate.year;
                if (newMonth < 0) { newMonth = config.months.length - 1; newYear--; }
                if (newMonth >= config.months.length) { newMonth = 0; newYear++; }
                setViewDate({ ...viewDate, monthIndex: newMonth, year: newYear, day: 1 });
              }}
            />
        </div>

        {/* EVENTS SECTION */}
        <div style={{ padding: '10px', borderTop: '1px solid #333', background: '#181818', minHeight: '200px' }}>
          
          {/* Events Header & Add Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>
               Events ({viewDate.day}/{viewDate.monthIndex + 1})
            </h3>
            {isGM && !isCreatingNote && (
              <button 
                onClick={() => setIsCreatingNote(true)} 
                style={{ 
                  background: 'transparent', border: '1px solid #444', color: '#888', 
                  cursor: 'pointer', fontSize: '0.8rem', padding: '2px 8px', borderRadius: '10px'
                }}
              >
                + Add Event
              </button>
            )}
          </div>

          {/* Note Creator or List */}
          {isCreatingNote ? (
            <NoteEditor 
              selectedDate={viewDate}
              onCancel={() => setIsCreatingNote(false)}
              onSave={(title, content, category, isGmOnly) => {
                actions.addLog(title, content, category, viewDate, isGmOnly);
                setIsCreatingNote(false);
              }}
            />
          ) : (
            <NoteList 
               logs={logs} 
               selectedDate={viewDate} 
               isGM={isGM} 
               onDelete={actions.deleteLog} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;