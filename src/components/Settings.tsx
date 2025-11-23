import React, { useState, useRef } from 'react';
import OBR from '@owlbear-rodeo/sdk';
import type { CalendarConfig, MonthConfig, SeasonName, BiomeType, DateTimeState, CalendarLogs } from '../types';
import { METADATA_KEY_CONFIG, METADATA_PREFIX_LOGS } from '../types';
import { getMonthMetadataStats, formatBytes, getUsageColor, calculateDataSize, calculateUsagePercentage } from '../utils/metadataStats';

interface SettingsProps {
  config: CalendarConfig;
  logs: CalendarLogs;
  onSave: (newConfig: CalendarConfig) => void;
  onCancel: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ config, logs, onSave, onCancel }) => {
  const [localConfig, setLocalConfig] = useState<CalendarConfig>(JSON.parse(JSON.stringify(config)));
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ARCHIVING HELPERS ---

  const handleExport = async () => {
    // 1. Get ALL current logs from OBR directly
    const metadata = await OBR.room.getMetadata();
    const allLogs: CalendarLogs = [];
    
    // 2. Find all bucket keys (e.g. logs.1492-0, logs.1492-1)
    Object.keys(metadata).forEach(key => {
      if (key.startsWith(METADATA_PREFIX_LOGS)) {
        const bucketLogs = metadata[key] as CalendarLogs;
        if (Array.isArray(bucketLogs)) allLogs.push(...bucketLogs);
      }
    });

    // 3. Create the backup object
    const backupData = {
      version: "1.0.0",
      timestamp: Date.now(),
      config: localConfig,
      logs: allLogs
    };

    // 4. Download file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `calendar_backup_${localConfig.currentDate.year}_${localConfig.currentDate.monthIndex}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.config || !json.logs) {
            alert("Invalid Calendar Backup File");
            return;
        }

        if (confirm("Importing will OVERWRITE your current settings. Are you sure?")) {
            // 1. Restore Config
            setLocalConfig(json.config); // Update UI
            await OBR.room.setMetadata({ [METADATA_KEY_CONFIG]: json.config });

            // 2. Restore Logs - First NUKE existing logs to prevent duplicates
            const currentMeta = await OBR.room.getMetadata();
            const keysToDelete: Record<string, undefined> = {};
            Object.keys(currentMeta).forEach(k => {
                if (k.startsWith(METADATA_PREFIX_LOGS)) keysToDelete[k] = undefined;
            });
            await OBR.room.setMetadata(keysToDelete);

            // 3. Bucket the new logs
            const newLogs = json.logs as CalendarLogs;
            const buckets: Record<string, CalendarLogs> = {};

            newLogs.forEach(log => {
                // Re-calculate the bucket key for each log
                const key = `${METADATA_PREFIX_LOGS}.${log.date.year}-${log.date.monthIndex}`;
                if (!buckets[key]) buckets[key] = [];
                buckets[key].push(log);
            });

            // 4. Batch update OBR
            await OBR.room.setMetadata(buckets);

            alert("Import Successful! Reloading...");
            window.location.reload();
        }
      } catch (err) {
        console.error(err);
        alert("Error parsing JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handlePurgeLogs = async () => {
      if (confirm("This will DELETE ALL EVENTS from the room to free up space. Ensure you have exported a backup first! Continue?")) {
        const currentMeta = await OBR.room.getMetadata();
        const keysToDelete: Record<string, undefined> = {};
        Object.keys(currentMeta).forEach(k => {
            if (k.startsWith(METADATA_PREFIX_LOGS)) keysToDelete[k] = undefined;
        });
        await OBR.room.setMetadata(keysToDelete);
        window.location.reload();
      }
  };

  const handleDebugKeys = async () => {
    const meta = await OBR.room.getMetadata();
    const keys = Object.keys(meta).filter(k => k.startsWith('com.username.calendar'));
    alert("Current Metadata Keys in Room:\n\n" + keys.join('\n'));
  };

  // --- CONFIG HELPERS ---
  const handleDateChange = (field: keyof DateTimeState, value: number) => {
    setLocalConfig({ ...localConfig, currentDate: { ...localConfig.currentDate, [field]: value } });
  };
  const removeMonth = (index: number) => {
    const newMonths = localConfig.months.filter((_, i) => i !== index);
    setLocalConfig({ ...localConfig, months: newMonths });
  };
  const addMonth = () => {
    setLocalConfig({ ...localConfig, months: [...localConfig.months, { name: 'New Month', days: 30, season: 'Spring' }] });
  };
  const handleMonthChange = (index: number, field: keyof MonthConfig, value: any) => {
    const newMonths = [...localConfig.months];
    newMonths[index] = { ...newMonths[index], [field]: value };
    setLocalConfig({ ...localConfig, months: newMonths });
  };
  const removeWeekDay = (index: number) => {
    const newDays = localConfig.weekDays.filter((_, i) => i !== index);
    setLocalConfig({ ...localConfig, weekDays: newDays });
  }
  const addWeekDay = () => {
    setLocalConfig({ ...localConfig, weekDays: [...localConfig.weekDays, { name: 'NewDay' }] });
  }
  const handleWeekDayChange = (index: number, value: string) => {
    const newWeek = [...localConfig.weekDays];
    newWeek[index] = { name: value };
    setLocalConfig({ ...localConfig, weekDays: newWeek });
  };

  return (
    <div style={{
      padding: '1.5rem',
      background: 'transparent',
      height: '100%',
      overflowY: 'auto',
      color: '#eee',
      fontSize: '0.9rem'
    }}>
      <h2 style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        paddingBottom: '0.75rem',
        marginTop: 0,
        color: '#fff',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
      }}>Settings</h2>

      {/* --- ARCHIVING --- */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(8px)',
        padding: '12px',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#7dd3fc' }}>Data Management</h3>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            <button onClick={handleExport} className="btn-secondary" style={{ flex: 1 }}>↓ Export Backup</button>
            <button onClick={() => fileInputRef.current?.click()} className="btn-secondary" style={{ flex: 1 }}>↑ Import Backup</button>
            <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept=".json"
                onChange={handleImport}
            />
        </div>
        <button onClick={handlePurgeLogs} style={{ marginTop: '5px', width: '100%', background: 'transparent', border: '1px solid #774444', color: '#dd8888', cursor: 'pointer', padding: '4px', borderRadius: '3px' }}>
            Purge All Events (Free Space)
        </button>
      </div>

      {/* --- METADATA USAGE TRACKER --- */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(8px)',
        padding: '12px',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#a78bfa' }}>Storage Usage (Item-Based)</h3>
        <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '12px' }}>
          <strong>New:</strong> Using item metadata storage where each month gets its own 16KB storage.
          Events are split by month, allowing virtually unlimited total storage.
        </div>

        {(() => {
          // Calculate month metadata stats
          const monthStats = getMonthMetadataStats(logs, localConfig.months.map(m => m.name));

          return (
            <>
              {/* Config Item Display */}
              <div style={{
                background: 'rgba(100, 108, 255, 0.1)',
                padding: '14px',
                borderRadius: '10px',
                border: '2px solid rgba(100, 108, 255, 0.3)',
                marginBottom: '16px',
                boxShadow: '0 0 20px rgba(100, 108, 255, 0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#fff' }}>
                    Config Item
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#a5b4fc' }}>
                    {(() => {
                      const configSize = calculateDataSize(localConfig);
                      const configPercentage = calculateUsagePercentage(configSize);
                      return `${configPercentage.toFixed(1)}% of 16 KB`;
                    })()}
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: '#ddd' }}>
                  Calendar configuration stored in dedicated item
                </div>
              </div>

              {/* Per-Month Breakdown */}
              {monthStats.length > 0 && (
                <>
                  <div style={{ fontSize: '0.8rem', color: '#bbb', marginBottom: '8px', fontWeight: '600' }}>
                    Event Items (Each month has 16KB storage)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {monthStats.map((stat, idx) => {
                const usageColor = getUsageColor(stat.usagePercentage);
                return (
                  <div key={idx} style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1px solid ${usageColor}40`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 'bold', color: '#fff' }}>
                        {stat.monthName} {stat.year}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#ccc' }}>
                        {stat.eventCount} event{stat.eventCount !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div style={{ marginBottom: '4px' }}>
                      {/* Progress bar */}
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min(stat.usagePercentage, 100)}%`,
                          height: '100%',
                          background: usageColor,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                      <span style={{ color: usageColor }}>
                        {stat.usagePercentage.toFixed(2)}% used
                      </span>
                      <span style={{ color: '#aaa' }}>
                        {formatBytes(stat.sizeBytes)} / 16 KB
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
                </>
              )}
            </>
          );
        })()}
      </div>

      {/* --- CURRENT DATE OVERRIDE --- */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(8px)',
        padding: '12px',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#86efac' }}>Current Date Override</h3>
        <div style={{ display: 'flex', gap: '5px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.75rem', color: '#aaa' }}>Year</label>
            <input type="number" className="settings-input" value={localConfig.currentDate.year} onChange={(e) => handleDateChange('year', parseInt(e.target.value))} />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ fontSize: '0.75rem', color: '#aaa' }}>Month</label>
            <select className="settings-input" value={localConfig.currentDate.monthIndex} onChange={(e) => handleDateChange('monthIndex', parseInt(e.target.value))}>
              {localConfig.months.map((m, i) => <option key={i} value={i}>{m.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.75rem', color: '#aaa' }}>Day</label>
            <input type="number" className="settings-input" value={localConfig.currentDate.day} onChange={(e) => handleDateChange('day', parseInt(e.target.value))} />
          </div>
        </div>
      </div>

      {/* --- GLOBAL CONFIG --- */}
      <h3 style={{ fontSize: '0.9rem', marginTop: '10px', marginBottom: '5px' }}>World Config</h3>
      <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <label>
          <div style={{fontSize: '0.8rem', color: '#aaa'}}>Year Suffix</div>
          <input className="settings-input" value={localConfig.yearName} onChange={e => setLocalConfig({...localConfig, yearName: e.target.value})} />
        </label>
        <label>
          <div style={{fontSize: '0.8rem', color: '#aaa'}}>Moon Cycle</div>
          <input type="number" className="settings-input" value={localConfig.moonCycle} onChange={e => setLocalConfig({...localConfig, moonCycle: parseFloat(e.target.value)})} />
        </label>
      </div>

      <div style={{ marginBottom: '1rem' }}>
         <label style={{fontSize: '0.8rem', color: '#aaa'}}>Active Region Biome</label>
         <select className="settings-input" value={localConfig.activeBiome || 'Temperate'} onChange={(e) => setLocalConfig({...localConfig, activeBiome: e.target.value as BiomeType})} style={{ border: '1px solid #4CAF50', color: '#81c784' }}>
            <option value="Temperate">Temperate</option>
            <option value="Mediterranean">Mediterranean</option>
            <option value="Desert">Desert</option>
            <option value="Polar">Polar</option>
            <option value="Rainforest">Rainforest</option>
            <option value="Underdark">Underdark</option>
         </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
         <label style={{fontSize: '0.8rem', color: '#aaa'}}>Year 0 Start Day</label>
         <select className="settings-input" value={localConfig.yearStartDayOffset || 0} onChange={(e) => setLocalConfig({...localConfig, yearStartDayOffset: parseInt(e.target.value)})}>
            {localConfig.weekDays.map((day, idx) => <option key={idx} value={idx}>{day.name}</option>)}
         </select>
      </div>

      <hr style={{borderColor: '#333'}} />

      <h3 style={{fontSize: '0.9rem', marginTop: '10px'}}>Days of Week</h3>
      <div style={{display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px'}}>
        {localConfig.weekDays.map((day, idx) => (
          <div key={idx} style={{display: 'flex', gap: '5px'}}>
             <input className="settings-input" value={day.name} onChange={(e) => handleWeekDayChange(idx, e.target.value)} />
             <button onClick={() => removeWeekDay(idx)} className="btn-danger">x</button>
          </div>
        ))}
        <button onClick={addWeekDay} className="btn-secondary" style={{ width: '100%' }}>+ Add Day</button>
      </div>

      <h3 style={{fontSize: '0.9rem', marginTop: '20px'}}>Months</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {localConfig.months.map((month, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 0.4fr 0.8fr auto', gap: '5px', alignItems: 'center' }}>
            <input className="settings-input" value={month.name} onChange={(e) => handleMonthChange(idx, 'name', e.target.value)} />
            <input className="settings-input" type="number" value={month.days} onChange={(e) => handleMonthChange(idx, 'days', parseInt(e.target.value))} />
            <select className="settings-input" value={month.season} onChange={(e) => handleMonthChange(idx, 'season', e.target.value as SeasonName)}>
              <option value="Winter">Winter</option>
              <option value="Spring">Spring</option>
              <option value="Summer">Summer</option>
              <option value="Fall">Fall</option>
            </select>
            <button onClick={() => removeMonth(idx)} className="btn-danger">X</button>
          </div>
        ))}
        <button onClick={addMonth} className="btn-secondary">+ Add Month</button>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => onSave(localConfig)} className="btn-primary" style={{ flex: 1 }}>Save Changes</button>
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>

      {/* DANGER ZONE */}
      <div style={{ marginTop: '30px', borderTop: '1px solid #522', paddingTop: '20px' }}>
        <h3 style={{ color: '#f55', fontSize: '0.8rem', marginTop: 0 }}>Danger Zone</h3>
        <button 
          className="btn-secondary" 
          style={{ width: '100%', marginBottom: '10px' }} 
          onClick={handleDebugKeys}
        >
          🔍 Debug: Show Storage Keys
        </button>

        <button className="btn-danger" style={{ width: '100%', padding: '10px', border: '1px solid #f55', color: '#f55' }} onClick={async () => {
            if (confirm("ARE YOU SURE? This will wipe ALL calendar data, logs, and settings permanently.")) {
                const metadata = await OBR.room.getMetadata();
                const keysToDelete: Record<string, undefined> = {};
                Object.keys(metadata).forEach(key => {
                    if (key.startsWith('com.username.calendar')) keysToDelete[key] = undefined;
                });
                await OBR.room.setMetadata(keysToDelete);
                window.location.reload();
            }
        }}>☢ NUKE ALL CALENDAR DATA</button>
      </div>
      
      <style>{`
        .settings-input {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px;
          border-radius: 8px;
          width: 100%;
          transition: all 0.2s ease;
        }
        .settings-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(0, 0, 0, 0.4);
          box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.2);
        }
        .btn-danger {
          background: rgba(255, 85, 85, 0.1);
          border: 1px solid rgba(255, 85, 85, 0.3);
          color: #ff8888;
          cursor: pointer;
          border-radius: 8px;
          padding: 6px 12px;
          transition: all 0.2s ease;
          backdrop-filter: blur(5px);
        }
        .btn-danger:hover {
          background: rgba(255, 85, 85, 0.2);
          border-color: rgba(255, 85, 85, 0.5);
          color: #ffaaaa;
        }
        .btn-primary {
          background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 12px;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #45a049 0%, #4CAF50 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(76, 175, 80, 0.5);
        }
        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(5px);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};