/**
 * NBA Date Synchronization Engine
 * Operates in US Eastern Time (America/New_York) to match NBA scheduling conventions.
 */

export interface ScheduleDateOption {
  label: string;
  value: string;
  isToday?: boolean;
}

/**
 * Get date string (YYYY-MM-DD) in US Eastern Time with optional day offset.
 */
export function getEasternDateStr(offsetDays: number = 0): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [y, m, d] = formatter.format(now).split('-').map(Number);
  const targetDate = new Date(Date.UTC(y, m - 1, d + offsetDays, 12, 0, 0));
  return targetDate.toISOString().slice(0, 10);
}

/**
 * Returns today's canonical NBA date string (YYYY-MM-DD).
 */
export function getTodayEasternDate(): string {
  return getEasternDateStr(0);
}

/**
 * Returns tomorrow's canonical NBA date string (YYYY-MM-DD).
 */
export function getTomorrowEasternDate(): string {
  return getEasternDateStr(1);
}

/**
 * Returns yesterday's canonical NBA date string (YYYY-MM-DD).
 */
export function getYesterdayEasternDate(): string {
  return getEasternDateStr(-1);
}

/**
 * Formats a YYYY-MM-DD string into a human-friendly label relative to today's Eastern date.
 */
export function formatScheduleDateLabel(dateStr: string): string {
  if (dateStr === 'ALL') return 'All Scheduled Games';
  
  const todayStr = getTodayEasternDate();
  const tomorrowStr = getTomorrowEasternDate();
  const yesterdayStr = getYesterdayEasternDate();

  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

    if (dateStr === todayStr) {
      return `Today (${monthDay})`;
    }
    if (dateStr === tomorrowStr) {
      return `Tomorrow (${monthDay})`;
    }
    if (dateStr === yesterdayStr) {
      return `Yesterday (${monthDay})`;
    }
    return weekday;
  } catch {
    return dateStr;
  }
}

/**
 * Generates dynamic, real-time schedule date selector options.
 */
export function getAvailableScheduleDates(options?: { existingDates?: string[] }): ScheduleDateOption[] {
  const todayStr = getTodayEasternDate();
  const tomorrowStr = getTomorrowEasternDate();
  const yesterdayStr = getYesterdayEasternDate();

  const datesMap = new Map<string, ScheduleDateOption>();

  // 1. Today (Priority 1)
  datesMap.set(todayStr, {
    label: formatScheduleDateLabel(todayStr),
    value: todayStr,
    isToday: true,
  });

  // 2. Tomorrow (Priority 2)
  datesMap.set(tomorrowStr, {
    label: formatScheduleDateLabel(tomorrowStr),
    value: tomorrowStr,
  });

  // 3. Next 3 days (+2 to +4)
  for (let offset = 2; offset <= 4; offset++) {
    const dStr = getEasternDateStr(offset);
    datesMap.set(dStr, {
      label: formatScheduleDateLabel(dStr),
      value: dStr,
    });
  }

  // 4. Yesterday (Priority 3)
  datesMap.set(yesterdayStr, {
    label: formatScheduleDateLabel(yesterdayStr),
    value: yesterdayStr,
  });

  // 5. Past 4 days (-2 to -5)
  for (let offset = -2; offset >= -5; offset--) {
    const dStr = getEasternDateStr(offset);
    datesMap.set(dStr, {
      label: formatScheduleDateLabel(dStr),
      value: dStr,
    });
  }

  // 6. Include any additional dates present in the active schedule
  if (options?.existingDates && Array.isArray(options.existingDates)) {
    options.existingDates.forEach((dStr) => {
      if (dStr && dStr !== 'ALL' && !datesMap.has(dStr)) {
        datesMap.set(dStr, {
          label: formatScheduleDateLabel(dStr),
          value: dStr,
        });
      }
    });
  }

  const result = Array.from(datesMap.values());
  result.push({
    label: 'All Scheduled Games',
    value: 'ALL',
  });

  return result;
}

export const nbaDateService = {
  getEasternDateStr,
  getTodayEasternDate,
  getTomorrowEasternDate,
  getYesterdayEasternDate,
  formatScheduleDateLabel,
  getAvailableScheduleDates,
};
