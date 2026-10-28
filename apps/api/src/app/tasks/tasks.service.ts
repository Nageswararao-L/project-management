import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Task, TaskStatus, toIsoDate } from '@pm/shared';
import { Repository } from 'typeorm';
import { assertDateRange } from '../common/validation';
import { MemberEntity } from '../members/member.entity';
import { ProjectEntity } from '../projects/project.entity';
import { escapeLike } from '../projects/projects.service';
import { CreateTaskDto, TaskQueryDto, UpdateTaskDto } from './dto/task.dto';
import { TaskEntity } from './task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly tasks: Repository<TaskEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projects: Repository<ProjectEntity>,
    @InjectRepository(MemberEntity)
    private readonly members: Repository<MemberEntity>,
  ) {}

  async findAll(query: TaskQueryDto = {}, limit?: number): Promise<Task[]> {
    const today = toIsoDate(new Date());
    const qb = this.tasks
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.assignee', 'assignee')
      .leftJoin('t.project', 'project')
      .addSelect(['project.id', 'project.code', 'project.name'])
      .orderBy('t.dueDate', 'ASC')
      .addOrderBy('t.id', 'ASC');

    if (query.projectId) {
      qb.andWhere('t.projectId = :projectId', { projectId: query.projectId });
    }
    if (query.assigneeId) {
      qb.andWhere('t.assigneeId = :assigneeId', {
        assigneeId: query.assigneeId,
      });
    }
    if (query.search?.trim()) {
      qb.andWhere('t.title LIKE :search', {
        search: `%${escapeLike(query.search.trim())}%`,
      });
    }
    if (query.status?.length) {
      qb.andWhere('t.status IN (:...status)', { status: query.status });
    }
    if (query.priority?.length) {
      qb.andWhere('t.priority IN (:...priority)', { priority: query.priority });
    }
    if (query.overdue || query.dueWithinDays != null) {
      qb.andWhere('t.status <> :done', { done: TaskStatus.Done });
    }
    if (query.overdue) {
      qb.andWhere('t.dueDate < :today', { today });
    }
    if (query.dueWithinDays != null) {
      const until = new Date();
      until.setDate(until.getDate() + query.dueWithinDays);
      qb.andWhere('t.dueDate BETWEEN :today AND :until', {
        today,
        until: toIsoDate(until),
      });
    }
    if (limit) qb.take(limit);

    return (await qb.getMany()).map((t) => this.toJson(t, today));
  }

  async findOne(id: number): Promise<Task> {
    return this.toJson(await this.getEntity(id));
  }

  async create(dto: CreateTaskDto): Promise<Task> {
    const project = await this.projects.findOneBy({ id: dto.projectId });
    if (!project) {
      throw new BadRequestException(`Project #${dto.projectId} does not exist`);
    }
    this.assertSchedule(dto.startDate, dto.dueDate, project);
    await this.assertAssignee(dto.assigneeId);

    const task = this.tasks.create({
      ...dto,
      description: dto.description || null,
      estimatedHours: dto.estimatedHours ?? null,
      assigneeId: dto.assigneeId ?? null,
      progress: dto.progress ?? 0,
    });
    this.applyStatusRules(task, null);
    const saved = await this.tasks.save(task);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.getEntity(id);
    const previousStatus = task.status;
    const startDate = dto.startDate ?? task.startDate;
    const dueDate = dto.dueDate ?? task.dueDate;
    if (startDate !== task.startDate || dueDate !== task.dueDate) {
      this.assertSchedule(startDate, dueDate, task.project);
    }
    if (dto.assigneeId !== undefined) {
      await this.assertAssignee(dto.assigneeId);
    }

    const { assignee: _a, project: _p, ...fields } = task;
    const updated = this.tasks.create({ ...fields, ...dto });
    this.applyStatusRules(updated, previousStatus, dto.progress);
    await this.tasks.save(updated);
    return this.findOne(id);
  }

  updateStatus(id: number, status: TaskStatus): Promise<Task> {
    return this.update(id, { status });
  }

  async remove(id: number): Promise<void> {
    await this.getEntity(id);
    await this.tasks.delete({ id });
  }

  private async getEntity(id: number): Promise<TaskEntity> {
    const task = await this.tasks
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.assignee', 'assignee')
      .leftJoinAndSelect('t.project', 'project')
      .where('t.id = :id', { id })
      .getOne();
    if (!task) throw new NotFoundException(`Task #${id} not found`);
    return task;
  }

  /**
   * Keeps status, progress and completion date consistent:
   * Done means 100% and stamps completedAt; reopening clears it.
   */
  private applyStatusRules(
    task: TaskEntity,
    previousStatus: TaskStatus | null,
    explicitProgress?: number,
  ) {
    if (task.status === TaskStatus.Done) {
      task.progress = 100;
      if (previousStatus !== TaskStatus.Done) task.completedAt = new Date();
    } else {
      task.completedAt = null;
      const statusChanged =
        previousStatus !== null && previousStatus !== task.status;
      if (statusChanged && explicitProgress === undefined) {
        if (task.status === TaskStatus.Todo) task.progress = 0;
        else if (previousStatus === TaskStatus.Done) {
          task.progress = Math.min(task.progress, 90);
        }
      }
    }
  }

  private assertSchedule(
    startDate: string,
    dueDate: string,
    project: Pick<ProjectEntity, 'startDate' | 'endDate' | 'name'>,
  ) {
    assertDateRange(startDate, dueDate, 'Start date', 'Due date');
    if (startDate < project.startDate || dueDate > project.endDate) {
      throw new BadRequestException(
        `Task dates must be within the project schedule ` +
          `(${project.startDate} – ${project.endDate}) of "${project.name}"`,
      );
    }
  }

  private async assertAssignee(assigneeId?: number | null) {
    if (
      assigneeId != null &&
      !(await this.members.existsBy({ id: assigneeId }))
    ) {
      throw new BadRequestException(
        `Team member #${assigneeId} does not exist`,
      );
    }
  }

  private toJson(t: TaskEntity, today = toIsoDate(new Date())): Task {
    const { project, assignee, ...fields } = t;
    return {
      ...fields,
      project: project
        ? { id: project.id, code: project.code, name: project.name }
        : undefined,
      assignee: assignee
        ? {
            ...assignee,
            createdAt: assignee.createdAt.toISOString(),
            updatedAt: assignee.updatedAt.toISOString(),
          }
        : null,
      isOverdue: t.status !== TaskStatus.Done && t.dueDate < today,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }
}
