import type {
  DashboardSummary,
  MemberInput,
  MemberWithWorkload,
  OwnTaskUpdate,
  Priority,
  Project,
  ProjectHealth,
  ProjectInput,
  ProjectStatus,
  Task,
  TaskInput,
  TaskStatus,
} from '@pm/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { useAuth } from '../auth/AuthContext';
import { errorMessage, http } from './client';

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus[];
  priority?: Priority[];
  health?: ProjectHealth[];
  managerId?: number;
}

export interface TaskFilters {
  projectId?: number;
  assigneeId?: number;
  search?: string;
  status?: TaskStatus[];
  priority?: Priority[];
  overdue?: boolean;
}

/** Drops empty values and joins arrays so they serialize as `?status=A,B`. */
function params(filters: object) {
  return Object.fromEntries(
    Object.entries(filters)
      .filter(
        ([, v]) =>
          v !== undefined &&
          v !== '' &&
          v !== false &&
          !(Array.isArray(v) && !v.length),
      )
      .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v]),
  );
}

const get = <T>(url: string, query: object = {}) =>
  http.get<T>(url, { params: params(query) }).then((r) => r.data);

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: () => get<DashboardSummary>('/dashboard'),
  });

export const useProjects = (filters: ProjectFilters = {}) =>
  useQuery({
    queryKey: ['projects', filters],
    queryFn: () => get<Project[]>('/projects', filters),
  });

export const useProject = (id: number) =>
  useQuery({
    queryKey: ['projects', id],
    queryFn: () => get<Project>(`/projects/${id}`),
    enabled: Number.isFinite(id),
  });

export const useTasks = (filters: TaskFilters = {}, enabled = true) =>
  useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => get<Task[]>('/tasks', filters),
    enabled,
  });

/** Team list; only managers may load it (users get an empty list). */
export function useMembers() {
  const { isManager } = useAuth();
  return useQuery({
    queryKey: ['members'],
    queryFn: () => get<MemberWithWorkload[]>('/members'),
    enabled: isManager,
  });
}

/**
 * Mutation that refreshes every cached list afterwards (stats such as progress,
 * health and workload depend on several resources) and reports errors.
 */
function useApiMutation<TVars, TResult>(
  fn: (vars: TVars) => Promise<TResult>,
  successMessage?: string,
) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      if (successMessage) message.success(successMessage);
      return queryClient.invalidateQueries();
    },
    onError: (error) => {
      message.error(errorMessage(error));
    },
  });
}

export const useSaveProject = () =>
  useApiMutation(
    ({ id, data }: { id?: number; data: ProjectInput }) =>
      (id
        ? http.patch<Project>(`/projects/${id}`, data)
        : http.post<Project>('/projects', data)
      ).then((r) => r.data),
    'Project saved',
  );

export const useDeleteProject = () =>
  useApiMutation(
    (id: number) => http.delete(`/projects/${id}`),
    'Project deleted',
  );

export const useSaveTask = () =>
  useApiMutation(
    ({
      id,
      data,
      ownTaskOnly,
    }: {
      id?: number;
      data: TaskInput;
      /** Users may only change status and progress of their own tasks. */
      ownTaskOnly?: boolean;
    }) => {
      if (!id) return http.post<Task>('/tasks', data).then((r) => r.data);
      const { projectId: _projectId, ...changes } = data;
      const body: Partial<TaskInput> | OwnTaskUpdate = ownTaskOnly
        ? { status: data.status, progress: data.progress }
        : changes;
      return http.patch<Task>(`/tasks/${id}`, body).then((r) => r.data);
    },
    'Task saved',
  );

export const useUpdateTaskStatus = () =>
  useApiMutation(({ id, status }: { id: number; status: TaskStatus }) =>
    http.patch<Task>(`/tasks/${id}/status`, { status }).then((r) => r.data),
  );

export const useDeleteTask = () =>
  useApiMutation((id: number) => http.delete(`/tasks/${id}`), 'Task deleted');

export const useSaveMember = () =>
  useApiMutation(
    ({ id, data }: { id?: number; data: MemberInput }) =>
      (id
        ? http.patch(`/members/${id}`, data)
        : http.post('/members', data)
      ).then((r) => r.data),
    'Team member saved',
  );

export const useDeleteMember = () =>
  useApiMutation(
    (id: number) => http.delete(`/members/${id}`),
    'Team member removed',
  );
