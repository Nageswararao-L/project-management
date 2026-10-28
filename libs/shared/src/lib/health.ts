import {
  CLOSED_PROJECT_STATUSES,
  ProjectHealth,
  ProjectStatus,
} from './enums.js';
import type { IsoDate } from './models.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** How far (in percentage points) progress may lag the schedule before a project is "at risk". */
export const AT_RISK_TOLERANCE = 15;

export function toIsoDate(date: Date): IsoDate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseIsoDate(value: IsoDate): number {
  const [y, m, d] = value.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((parseIsoDate(to) - parseIsoDate(from)) / DAY_MS);
}

/** Percentage (0-100) of the planned duration that has elapsed on `today`. */
export function expectedProgress(
  startDate: IsoDate,
  endDate: IsoDate,
  today: IsoDate,
): number {
  const total = daysBetween(startDate, endDate) + 1;
  const elapsed = daysBetween(startDate, today) + 1;
  if (elapsed <= 0) return 0;
  if (elapsed >= total) return 100;
  return Math.round((elapsed / total) * 100);
}

export function computeProjectHealth(
  project: {
    status: ProjectStatus;
    startDate: IsoDate;
    endDate: IsoDate;
    progress: number;
    overdueTaskCount: number;
  },
  today: IsoDate = toIsoDate(new Date()),
): ProjectHealth {
  if (CLOSED_PROJECT_STATUSES.includes(project.status)) {
    return ProjectHealth.Closed;
  }
  if (project.endDate < today) {
    return ProjectHealth.Overdue;
  }
  const expected = expectedProgress(project.startDate, project.endDate, today);
  if (
    project.status === ProjectStatus.OnHold ||
    project.overdueTaskCount > 0 ||
    project.progress + AT_RISK_TOLERANCE < expected
  ) {
    return ProjectHealth.AtRisk;
  }
  return ProjectHealth.OnTrack;
}
