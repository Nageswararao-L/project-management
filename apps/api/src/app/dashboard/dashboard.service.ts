import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CLOSED_PROJECT_STATUSES,
  DashboardSummary,
  daysBetween,
  ProjectHealth,
  ProjectStatus,
  TaskStatus,
  toIsoDate,
  UpcomingDeadline,
  UserRole,
} from '@pm/shared';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { MemberEntity } from '../members/member.entity';
import { MembersService } from '../members/members.service';
import { ProjectsService } from '../projects/projects.service';
import { TaskEntity } from '../tasks/task.entity';
import { TasksService } from '../tasks/tasks.service';

const UPCOMING_DAYS = 14;

function countBy<K extends string>(keys: K[], values: K[]): Record<K, number> {
  const result = Object.fromEntries(keys.map((k) => [k, 0])) as Record<
    K,
    number
  >;
  for (const v of values) result[v] += 1;
  return result;
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly tasksService: TasksService,
    private readonly membersService: MembersService,
    @InjectRepository(TaskEntity)
    private readonly tasks: Repository<TaskEntity>,
  ) {}

  /** Managers get the whole portfolio; users get a summary of their own tasks. */
  async getSummary(viewer: MemberEntity): Promise<DashboardSummary> {
    const scopedToUser = viewer.role !== UserRole.Manager;
    const own = scopedToUser ? { assigneeId: viewer.id } : {};
    const today = toIsoDate(new Date());
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      projects,
      taskStatusRows,
      overdueTasks,
      dueSoon,
      workload,
      completedRecently,
    ] = await Promise.all([
      this.projectsService.findAll({}, viewer),
      this.tasks
        .createQueryBuilder('t')
        .select('t.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where(scopedToUser ? 't.assigneeId = :viewerId' : '1 = 1', {
          viewerId: viewer.id,
        })
        .groupBy('t.status')
        .getRawMany<{ status: TaskStatus; count: number }>(),
      this.tasksService.findAll({ overdue: true }, viewer),
      this.tasksService.findAll({ dueWithinDays: UPCOMING_DAYS }, viewer),
      this.membersService.findAll(scopedToUser ? viewer.id : undefined),
      this.tasks.countBy({
        ...own,
        status: TaskStatus.Done,
        completedAt: MoreThanOrEqual(thirtyDaysAgo),
      }),
    ]);

    const tasksByStatus = countBy(Object.values(TaskStatus), []);
    for (const row of taskStatusRows)
      tasksByStatus[row.status] = Number(row.count);
    const totalTasks = Object.values(tasksByStatus).reduce((a, b) => a + b, 0);

    const openProjects = projects.filter(
      (p) => !CLOSED_PROJECT_STATUSES.includes(p.status),
    );

    const upcomingDeadlines: UpcomingDeadline[] = [
      ...dueSoon.map((t) => ({
        type: 'task' as const,
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        projectName: t.project?.name ?? '',
        dueDate: t.dueDate,
        daysLeft: daysBetween(today, t.dueDate),
      })),
      ...openProjects
        .filter(
          (p) =>
            p.endDate >= today &&
            daysBetween(today, p.endDate) <= UPCOMING_DAYS,
        )
        .map((p) => ({
          type: 'project' as const,
          id: p.id,
          projectId: p.id,
          title: p.name,
          projectName: p.name,
          dueDate: p.endDate,
          daysLeft: daysBetween(today, p.endDate),
        })),
    ]
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 15);

    return {
      totals: {
        projects: projects.length,
        activeProjects: projects.filter(
          (p) => p.status === ProjectStatus.InProgress,
        ).length,
        tasks: totalTasks,
        openTasks: totalTasks - tasksByStatus[TaskStatus.Done],
        overdueTasks: overdueTasks.length,
        completedTasksLast30Days: completedRecently,
      },
      projectsByStatus: countBy(
        Object.values(ProjectStatus),
        projects.map((p) => p.status),
      ),
      projectsByHealth: countBy(
        Object.values(ProjectHealth),
        projects.map((p) => p.health),
      ),
      tasksByStatus,
      upcomingDeadlines,
      overdueTasks: overdueTasks.slice(0, 10),
      atRiskProjects: openProjects.filter(
        (p) =>
          p.health === ProjectHealth.AtRisk ||
          p.health === ProjectHealth.Overdue,
      ),
      workload: workload.filter((m) => m.isActive),
    };
  }
}
