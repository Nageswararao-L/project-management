import type {
  Priority,
  ProjectHealth,
  ProjectStatus,
  TaskStatus,
} from './enums.js';

/** Calendar date in ISO format, e.g. `2026-03-31`. */
export type IsoDate = string;

export interface Member {
  id: number;
  name: string;
  email: string;
  role: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemberWithWorkload extends Member {
  openTasks: number;
  overdueTasks: number;
  managedProjects: number;
}

export interface ProjectStats {
  taskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  /** 0-100, average of task progress. */
  progress: number;
  health: ProjectHealth;
}

export interface Project extends ProjectStats {
  id: number;
  code: string;
  name: string;
  description: string | null;
  client: string | null;
  status: ProjectStatus;
  priority: Priority;
  startDate: IsoDate;
  endDate: IsoDate;
  managerId: number | null;
  manager: Member | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  projectId: number;
  project?: Pick<Project, 'id' | 'code' | 'name'>;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  startDate: IsoDate;
  dueDate: IsoDate;
  progress: number;
  estimatedHours: number | null;
  assigneeId: number | null;
  assignee: Member | null;
  completedAt: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpcomingDeadline {
  type: 'project' | 'task';
  id: number;
  projectId: number;
  title: string;
  projectName: string;
  dueDate: IsoDate;
  daysLeft: number;
}

export interface DashboardSummary {
  totals: {
    projects: number;
    activeProjects: number;
    tasks: number;
    openTasks: number;
    overdueTasks: number;
    completedTasksLast30Days: number;
  };
  projectsByStatus: Record<ProjectStatus, number>;
  projectsByHealth: Record<ProjectHealth, number>;
  tasksByStatus: Record<TaskStatus, number>;
  upcomingDeadlines: UpcomingDeadline[];
  overdueTasks: Task[];
  atRiskProjects: Project[];
  workload: MemberWithWorkload[];
}

/** Payloads accepted by the API. */
export interface ProjectInput {
  code: string;
  name: string;
  description?: string | null;
  client?: string | null;
  status: ProjectStatus;
  priority: Priority;
  startDate: IsoDate;
  endDate: IsoDate;
  managerId?: number | null;
}

export interface TaskInput {
  projectId: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: Priority;
  startDate: IsoDate;
  dueDate: IsoDate;
  progress?: number;
  estimatedHours?: number | null;
  assigneeId?: number | null;
}

export interface MemberInput {
  name: string;
  email: string;
  role?: string | null;
  isActive?: boolean;
}
