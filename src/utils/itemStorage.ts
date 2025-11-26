import OBR, { buildImage } from '@owlbear-rodeo/sdk';
import type { Item } from '@owlbear-rodeo/sdk';
import type { CalendarConfig, CalendarLogs } from '../types';

/**
 * Item IDs for calendar storage
 */
const CALENDAR_CONFIG_ITEM_ID = 'com.username.calendar-config-item';
const CALENDAR_LOGS_ITEM_PREFIX = 'com.username.calendar-logs-item';

/**
 * Metadata keys for items
 */
const ITEM_METADATA_KEY_CONFIG = 'calendar.config';
const ITEM_METADATA_KEY_LOGS = 'calendar.logs';

/**
 * Get the item ID for a specific month/year logs bucket
 */
export function getLogsItemId(year: number, monthIndex: number): string {
  return `${CALENDAR_LOGS_ITEM_PREFIX}.${year}-${monthIndex}`;
}

/**
 * Create an invisible item for storing calendar data
 */
async function createCalendarItem(id: string, name: string): Promise<Item> {
  // Transparent 1x1 PNG as data URL
  const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const item = buildImage(
    {
      height: 1,
      width: 1,
      url: transparentPixel,
      mime: 'image/png'
    },
    { dpi: 150, offset: { x: 0, y: 0 } }
  )
    .id(id)
    .name(name)
    .layer('ATTACHMENT')
    .locked(true)
    .visible(false)
    .disableHit(true)
    .position({ x: -10000, y: -10000 }) // Off-screen
    .build();

  await OBR.scene.items.addItems([item]);
  return item;
}

/**
 * Get the calendar config item (read-only, returns null if not found)
 */
export async function getConfigItem(): Promise<Item | null> {
  const items = await OBR.scene.items.getItems((item) => item.id === CALENDAR_CONFIG_ITEM_ID);
  return items.length > 0 ? items[0] : null;
}

/**
 * Get or create the calendar config item (for GM write operations)
 */
export async function getOrCreateConfigItem(): Promise<Item> {
  const existingItem = await getConfigItem();
  if (existingItem) {
    return existingItem;
  }
  return await createCalendarItem(CALENDAR_CONFIG_ITEM_ID, 'Calendar Configuration');
}

/**
 * Get a logs item for a specific month/year (read-only, returns null if not found)
 */
export async function getLogsItem(year: number, monthIndex: number): Promise<Item | null> {
  const itemId = getLogsItemId(year, monthIndex);
  const items = await OBR.scene.items.getItems((item) => item.id === itemId);
  return items.length > 0 ? items[0] : null;
}

/**
 * Get or create a logs item for a specific month/year (for GM write operations)
 */
export async function getOrCreateLogsItem(year: number, monthIndex: number): Promise<Item> {
  const existingItem = await getLogsItem(year, monthIndex);
  if (existingItem) {
    return existingItem;
  }
  const itemId = getLogsItemId(year, monthIndex);
  return await createCalendarItem(itemId, `Calendar Events: ${year}-${monthIndex}`);
}

/**
 * Read calendar config from item metadata (read-only, doesn't create items)
 */
export async function readConfig(): Promise<CalendarConfig | null> {
  try {
    const item = await getConfigItem();
    if (!item) {
      return null;
    }
    const metadata = item.metadata;
    return (metadata[ITEM_METADATA_KEY_CONFIG] as CalendarConfig) || null;
  } catch (error) {
    console.error('Error reading config from item:', error);
    return null;
  }
}

/**
 * Write calendar config to item metadata
 */
export async function writeConfig(config: CalendarConfig): Promise<void> {
  const item = await getOrCreateConfigItem();

  await OBR.scene.items.updateItems([item.id], (items) => {
    items.forEach(item => {
      item.metadata[ITEM_METADATA_KEY_CONFIG] = config;
    });
  });
}

/**
 * Read logs for a specific month/year from item metadata (read-only, doesn't create items)
 */
export async function readLogs(year: number, monthIndex: number): Promise<CalendarLogs> {
  try {
    const item = await getLogsItem(year, monthIndex);
    if (!item) {
      return [];
    }
    const metadata = item.metadata;
    return (metadata[ITEM_METADATA_KEY_LOGS] as CalendarLogs) || [];
  } catch (error) {
    console.error(`Error reading logs for ${year}-${monthIndex}:`, error);
    return [];
  }
}

/**
 * Write logs for a specific month/year to item metadata
 */
export async function writeLogs(year: number, monthIndex: number, logs: CalendarLogs): Promise<void> {
  const item = await getOrCreateLogsItem(year, monthIndex);

  await OBR.scene.items.updateItems([item.id], (items) => {
    items.forEach(item => {
      item.metadata[ITEM_METADATA_KEY_LOGS] = logs;
    });
  });
}

/**
 * Get all calendar log items (for reading all events)
 */
export async function getAllLogsItems(): Promise<Item[]> {
  const allItems = await OBR.scene.items.getItems();
  return allItems.filter(item => item.id.startsWith(CALENDAR_LOGS_ITEM_PREFIX));
}

/**
 * Read all logs from all month/year items
 */
export async function readAllLogs(): Promise<CalendarLogs> {
  const logsItems = await getAllLogsItems();
  const allLogs: CalendarLogs = [];

  for (const item of logsItems) {
    const logs = (item.metadata[ITEM_METADATA_KEY_LOGS] as CalendarLogs) || [];
    allLogs.push(...logs);
  }

  return allLogs;
}

/**
 * Delete all calendar items (for cleanup/reset)
 */
export async function deleteAllCalendarItems(): Promise<void> {
  const allItems = await OBR.scene.items.getItems();
  const calendarItemIds = allItems
    .filter(item =>
      item.id === CALENDAR_CONFIG_ITEM_ID ||
      item.id.startsWith(CALENDAR_LOGS_ITEM_PREFIX)
    )
    .map(item => item.id);

  if (calendarItemIds.length > 0) {
    await OBR.scene.items.deleteItems(calendarItemIds);
  }
}
