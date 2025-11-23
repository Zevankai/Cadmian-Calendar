import type { CalendarLogs, CalendarConfig } from '../types';

/**
 * Owlbear Rodeo metadata size limit (in bytes)
 * This is a TOTAL ROOM LIMIT - all metadata keys combined cannot exceed this
 */
export const METADATA_SIZE_LIMIT = 16 * 1024; // 16KB in bytes

/**
 * Calculate the approximate size of data in bytes (JSON stringified)
 */
export function calculateDataSize(data: any): number {
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch {
    return 0;
  }
}

/**
 * Calculate percentage of metadata limit used
 */
export function calculateUsagePercentage(size: number): number {
  return (size / METADATA_SIZE_LIMIT) * 100;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get usage status color based on percentage
 */
export function getUsageColor(percentage: number): string {
  if (percentage < 50) return '#4ade80'; // Green
  if (percentage < 75) return '#fbbf24'; // Yellow
  if (percentage < 90) return '#fb923c'; // Orange
  return '#ef4444'; // Red
}

export interface MonthMetadata {
  year: number;
  monthIndex: number;
  monthName: string;
  eventCount: number;
  sizeBytes: number;
  usagePercentage: number;
}

/**
 * Get metadata statistics for all month buckets
 */
export function getMonthMetadataStats(
  logs: CalendarLogs,
  monthNames: string[]
): MonthMetadata[] {
  // Group logs by year/month
  const buckets = new Map<string, CalendarLogs>();

  logs.forEach(log => {
    const key = `${log.date.year}-${log.date.monthIndex}`;
    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key)!.push(log);
  });

  // Calculate stats for each bucket
  const stats: MonthMetadata[] = [];

  buckets.forEach((bucketLogs, key) => {
    const [yearStr, monthIndexStr] = key.split('-');
    const year = parseInt(yearStr);
    const monthIndex = parseInt(monthIndexStr);

    const sizeBytes = calculateDataSize(bucketLogs);
    const usagePercentage = calculateUsagePercentage(sizeBytes);

    stats.push({
      year,
      monthIndex,
      monthName: monthNames[monthIndex] || `Month ${monthIndex + 1}`,
      eventCount: bucketLogs.length,
      sizeBytes,
      usagePercentage
    });
  });

  // Sort by year and month
  stats.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year; // Newest year first
    return b.monthIndex - a.monthIndex; // Newest month first
  });

  return stats;
}

/**
 * Calculate total metadata usage across all keys
 * (config + all log buckets combined)
 */
export function getTotalMetadataUsage(
  config: CalendarConfig,
  logs: CalendarLogs
): { sizeBytes: number; usagePercentage: number } {
  // Calculate config size
  const configSize = calculateDataSize(config);

  // Calculate total logs size (all buckets combined)
  const logsSize = calculateDataSize(logs);

  // Total size
  const totalSize = configSize + logsSize;
  const usagePercentage = calculateUsagePercentage(totalSize);

  return {
    sizeBytes: totalSize,
    usagePercentage
  };
}
