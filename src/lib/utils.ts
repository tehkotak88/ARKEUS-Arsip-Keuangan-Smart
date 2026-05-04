import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { addYears, isBefore, isAfter, subMonths, format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PANGKAT_INTERVAL = 4;
export const KGB_INTERVAL = 2;

export function calculateNextPangkat(lastDate: string | Date) {
  const date = typeof lastDate === 'string' ? parseISO(lastDate) : lastDate;
  return addYears(date, PANGKAT_INTERVAL);
}

export function calculateNextKgb(lastDate: string | Date) {
  const date = typeof lastDate === 'string' ? parseISO(lastDate) : lastDate;
  return addYears(date, KGB_INTERVAL);
}

export function isDueSoon(nextDate: string | Date, monthsThreshold = 3) {
  const date = typeof nextDate === 'string' ? parseISO(nextDate) : nextDate;
  const now = new Date();
  const thresholdDate = addYears(subMonths(date, monthsThreshold), 0); // Just a point in time
  const warningStart = subMonths(date, monthsThreshold);
  return isAfter(now, warningStart) && isBefore(now, date);
}

export function isOverdue(nextDate: string | Date) {
  const date = typeof nextDate === 'string' ? parseISO(nextDate) : nextDate;
  return isBefore(date, new Date());
}

export function formatDateString(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy');
}
