import { DaymarkData, DayCell, WeekColumn } from './types';

export const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
] as const;

export function getISTToday(): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === 'year')!.value, 10);
  const month = parseInt(parts.find((p) => p.type === 'month')!.value, 10) - 1;
  const day = parseInt(parts.find((p) => p.type === 'day')!.value, 10);
  return new Date(year, month, day, 0, 0, 0, 0);
}

export function formatDateKey(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export function getMonthKey(d: Date): string {
  return MONTH_NAMES[d.getMonth()];
}

export function isWorked(data: DaymarkData, date: Date): boolean {
  const year = String(date.getFullYear());
  const month = getMonthKey(date);
  const key = formatDateKey(date);
  return Boolean(data?.[year]?.[month]?.[key]);
}

export function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function generateCalendarGrid(data: DaymarkData): WeekColumn[] {
  const today = getISTToday();
  const todayTime = today.getTime();

  // 30 days window: from (today - 29 days) to today
  const windowStart = new Date(today);
  windowStart.setDate(today.getDate() - 29);
  const windowStartTime = windowStart.getTime();

  // Each column represents one week starting on Sunday and ending on Saturday
  // Start with the Sunday of the week that includes windowStart
  const startSunday = new Date(windowStart);
  startSunday.setDate(windowStart.getDate() - windowStart.getDay());

  // End with the Saturday of the week that includes today
  const endSaturday = new Date(today);
  endSaturday.setDate(today.getDate() + (6 - today.getDay()));

  const columns: WeekColumn[] = [];
  const current = new Date(startSunday);

  while (current.getTime() <= endSaturday.getTime()) {
    const weekDays: DayCell[] = [];
    const colId = formatDateKey(current);

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const cellDate = new Date(current);
      const cellTime = cellDate.getTime();
      const dateKey = formatDateKey(cellDate);
      const isInWindow = cellTime >= windowStartTime && cellTime <= todayTime;

      let status: DayCell['status'] = 'PAST';
      if (cellTime === todayTime) {
        status = 'TODAY';
      } else if (cellTime > todayTime) {
        status = 'FUTURE';
      } else {
        status = 'PAST';
      }

      weekDays.push({
        date: cellDate,
        dateKey,
        dayOfMonth: cellDate.getDate(),
        monthName: getMonthKey(cellDate),
        year: cellDate.getFullYear(),
        dayOfWeek,
        status,
        isInWindow,
        worked: isInWindow ? isWorked(data, cellDate) : false,
      });

      current.setDate(current.getDate() + 1);
    }

    columns.push({
      id: colId,
      days: weekDays,
    });
  }

  return columns;
}
