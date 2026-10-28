import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  FireOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import {
  HEALTH_LABELS,
  Priority,
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  ProjectHealth,
  ProjectStatus,
  TASK_STATUS_LABELS,
  TaskStatus,
} from '@pm/shared';
import { Badge, Tag } from 'antd';
import type { ReactNode } from 'react';

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.NotStarted]: 'default',
  [ProjectStatus.Planning]: 'purple',
  [ProjectStatus.InProgress]: 'processing',
  [ProjectStatus.OnHold]: 'warning',
  [ProjectStatus.Completed]: 'success',
  [ProjectStatus.Cancelled]: 'error',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: 'default',
  [TaskStatus.InProgress]: 'processing',
  [TaskStatus.InReview]: 'purple',
  [TaskStatus.Blocked]: 'error',
  [TaskStatus.Done]: 'success',
};

/** Hex colors for charts and timeline bars. */
export const TASK_STATUS_HEX: Record<TaskStatus, string> = {
  [TaskStatus.Todo]: '#8c8c8c',
  [TaskStatus.InProgress]: '#1677ff',
  [TaskStatus.InReview]: '#722ed1',
  [TaskStatus.Blocked]: '#ff4d4f',
  [TaskStatus.Done]: '#389e0d',
};

export const PROJECT_STATUS_HEX: Record<ProjectStatus, string> = {
  [ProjectStatus.NotStarted]: '#8c8c8c',
  [ProjectStatus.Planning]: '#722ed1',
  [ProjectStatus.InProgress]: '#1677ff',
  [ProjectStatus.OnHold]: '#faad14',
  [ProjectStatus.Completed]: '#389e0d',
  [ProjectStatus.Cancelled]: '#ff4d4f',
};

export const HEALTH_HEX: Record<ProjectHealth, string> = {
  [ProjectHealth.OnTrack]: '#389e0d',
  [ProjectHealth.AtRisk]: '#faad14',
  [ProjectHealth.Overdue]: '#ff4d4f',
  [ProjectHealth.Closed]: '#8c8c8c',
};

const PRIORITY_STYLE: Record<Priority, { color: string; icon: ReactNode }> = {
  [Priority.Low]: { color: 'default', icon: <ArrowDownOutlined /> },
  [Priority.Medium]: { color: 'blue', icon: <MinusOutlined /> },
  [Priority.High]: { color: 'orange', icon: <ArrowUpOutlined /> },
  [Priority.Critical]: { color: 'red', icon: <FireOutlined /> },
};

export const ProjectStatusTag = ({ status }: { status: ProjectStatus }) => (
  <Tag color={PROJECT_STATUS_COLORS[status]}>
    {PROJECT_STATUS_LABELS[status]}
  </Tag>
);

export const TaskStatusTag = ({ status }: { status: TaskStatus }) => (
  <Tag color={TASK_STATUS_COLORS[status]}>{TASK_STATUS_LABELS[status]}</Tag>
);

export const PriorityTag = ({ priority }: { priority: Priority }) => (
  <Tag
    color={PRIORITY_STYLE[priority].color}
    icon={PRIORITY_STYLE[priority].icon}
  >
    {PRIORITY_LABELS[priority]}
  </Tag>
);

export const HealthBadge = ({ health }: { health: ProjectHealth }) => (
  <Badge color={HEALTH_HEX[health]} text={HEALTH_LABELS[health]} />
);

const options = <T extends string>(labels: Record<T, string>) =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({
    value,
    label,
  }));

export const PROJECT_STATUS_OPTIONS = options(PROJECT_STATUS_LABELS);
export const TASK_STATUS_OPTIONS = options(TASK_STATUS_LABELS);
export const PRIORITY_OPTIONS = options(PRIORITY_LABELS);
export const HEALTH_OPTIONS = options(HEALTH_LABELS);
