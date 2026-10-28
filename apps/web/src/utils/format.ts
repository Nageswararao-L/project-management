import dayjs from 'dayjs';

export const DATE_FORMAT = 'DD MMM YYYY';

export const formatDate = (value?: string | null) =>
  value ? dayjs(value).format(DATE_FORMAT) : '—';

export const toApiDate = (value: dayjs.Dayjs) => value.format('YYYY-MM-DD');

export const formatCurrency = (value?: number | null) =>
  value == null
    ? '—'
    : new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);

/** Inclusive number of calendar days between two ISO dates. */
export const durationDays = (start: string, end: string) =>
  dayjs(end).diff(dayjs(start), 'day') + 1;

/** "in 3 days", "today", "2 days ago" */
export function relativeDays(date: string): string {
  const days = dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const AVATAR_COLORS = [
  '#1677ff',
  '#13c2c2',
  '#52c41a',
  '#fa8c16',
  '#eb2f96',
  '#722ed1',
  '#2f54eb',
  '#a0d911',
];

export const avatarColor = (id: number) =>
  AVATAR_COLORS[id % AVATAR_COLORS.length];
