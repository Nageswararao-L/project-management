export enum ProjectStatus {
  NotStarted = 'NOT_STARTED',
  Planning = 'PLANNING',
  InProgress = 'IN_PROGRESS',
  OnHold = 'ON_HOLD',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
}

export enum TaskStatus {
  Todo = 'TODO',
  InProgress = 'IN_PROGRESS',
  InReview = 'IN_REVIEW',
  Blocked = 'BLOCKED',
  Done = 'DONE',
}

/** Login level: managers see and manage everything, users only their own tasks. */
export enum UserRole {
  Manager = 'MANAGER',
  User = 'USER',
}

export enum Priority {
  Low = 'LOW',
  Medium = 'MEDIUM',
  High = 'HIGH',
  Critical = 'CRITICAL',
}

/** Schedule health of a project, derived from its dates and progress. */
export enum ProjectHealth {
  OnTrack = 'ON_TRACK',
  AtRisk = 'AT_RISK',
  Overdue = 'OVERDUE',
  Closed = 'CLOSED',
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.NotStarted]: 'Not Started',
  [ProjectStatus.Planning]: 'Planning',
  [ProjectStatus.InProgress]: 'In Progress',
  [ProjectStatus.OnHold]: 'On Hold',
  [ProjectStatus.Completed]: 'Completed',
  [ProjectStatus.Cancelled]: 'Cancelled',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: 'To Do',
  [TaskStatus.InProgress]: 'In Progress',
  [TaskStatus.InReview]: 'In Review',
  [TaskStatus.Blocked]: 'Blocked',
  [TaskStatus.Done]: 'Done',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Manager]: 'Manager',
  [UserRole.User]: 'User',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.Low]: 'Low',
  [Priority.Medium]: 'Medium',
  [Priority.High]: 'High',
  [Priority.Critical]: 'Critical',
};

export const HEALTH_LABELS: Record<ProjectHealth, string> = {
  [ProjectHealth.OnTrack]: 'On Track',
  [ProjectHealth.AtRisk]: 'At Risk',
  [ProjectHealth.Overdue]: 'Overdue',
  [ProjectHealth.Closed]: 'Closed',
};

/** Project statuses that mean no more work is expected. */
export const CLOSED_PROJECT_STATUSES: ProjectStatus[] = [
  ProjectStatus.Completed,
  ProjectStatus.Cancelled,
];
