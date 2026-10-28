import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  computeProjectHealth,
  Project,
  ProjectStats,
  TaskStatus,
  toIsoDate,
  UserRole,
} from '@pm/shared';
import { Brackets, In, Repository } from 'typeorm';
import { assertDateRange } from '../common/validation';
import { MemberEntity } from '../members/member.entity';
import { toMemberJson } from '../members/members.service';
import { TaskEntity } from '../tasks/task.entity';
import {
  CreateProjectDto,
  ProjectQueryDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { ProjectEntity } from './project.entity';

type RawTaskStats = {
  projectId: number;
  taskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
  progress: number | null;
};

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projects: Repository<ProjectEntity>,
    @InjectRepository(TaskEntity)
    private readonly tasks: Repository<TaskEntity>,
    @InjectRepository(MemberEntity)
    private readonly members: Repository<MemberEntity>,
  ) {}

  /** Users (non-managers) only see projects that have a task assigned to them. */
  async findAll(
    query: ProjectQueryDto = {},
    viewer?: MemberEntity,
  ): Promise<Project[]> {
    const qb = this.projects
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.manager', 'manager')
      .orderBy('p.endDate', 'ASC')
      .addOrderBy('p.name', 'ASC');

    if (viewer && viewer.role !== UserRole.Manager) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM tasks vt WHERE vt.projectId = p.id AND vt.assigneeId = :viewerId)',
        { viewerId: viewer.id },
      );
    }

    if (query.search?.trim()) {
      qb.andWhere(
        new Brackets((w) =>
          w
            .where('p.code LIKE :search')
            .orWhere('p.name LIKE :search')
            .orWhere('p.client LIKE :search'),
        ),
        { search: `%${escapeLike(query.search.trim())}%` },
      );
    }
    if (query.status?.length) {
      qb.andWhere('p.status IN (:...status)', { status: query.status });
    }
    if (query.priority?.length) {
      qb.andWhere('p.priority IN (:...priority)', { priority: query.priority });
    }
    if (query.managerId) {
      qb.andWhere('p.managerId = :managerId', { managerId: query.managerId });
    }

    const entities = await qb.getMany();
    const stats = await this.statsFor(entities);
    const projects = entities.map((p) => this.toJson(p, stats.get(p.id)));
    return query.health?.length
      ? projects.filter((p) => query.health?.includes(p.health))
      : projects;
  }

  async findOne(id: number, viewer?: MemberEntity): Promise<Project> {
    const project = await this.getEntity(id);
    if (
      viewer &&
      viewer.role !== UserRole.Manager &&
      !(await this.tasks.existsBy({ projectId: id, assigneeId: viewer.id }))
    ) {
      throw new NotFoundException(`Project #${id} not found`);
    }
    const stats = await this.statsFor([project]);
    return this.toJson(project, stats.get(id));
  }

  async getEntity(id: number): Promise<ProjectEntity> {
    const project = await this.projects.findOne({
      where: { id },
      relations: { manager: true },
    });
    if (!project) throw new NotFoundException(`Project #${id} not found`);
    return project;
  }

  async create(dto: CreateProjectDto): Promise<Project> {
    assertDateRange(dto.startDate, dto.endDate, 'Start date', 'End date');
    await this.assertCodeFree(dto.code);
    await this.assertManager(dto.managerId);
    const saved = await this.projects.save(
      this.projects.create({
        ...dto,
        description: dto.description || null,
        client: dto.client || null,
        managerId: dto.managerId ?? null,
      }),
    );
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.getEntity(id);
    const startDate = dto.startDate ?? project.startDate;
    const endDate = dto.endDate ?? project.endDate;
    assertDateRange(startDate, endDate, 'Start date', 'End date');

    if (dto.code && dto.code !== project.code) {
      await this.assertCodeFree(dto.code);
    }
    if (dto.managerId !== undefined) {
      await this.assertManager(dto.managerId);
    }
    if (startDate !== project.startDate || endDate !== project.endDate) {
      const outside = await this.tasks
        .createQueryBuilder('t')
        .where('t.projectId = :id', { id })
        .andWhere('(t.startDate < :startDate OR t.dueDate > :endDate)', {
          startDate,
          endDate,
        })
        .getCount();
      if (outside > 0) {
        throw new BadRequestException(
          `${outside} task(s) fall outside ${startDate} – ${endDate}. ` +
            'Reschedule those tasks first, or choose dates that cover them.',
        );
      }
    }

    // The loaded relation would otherwise override a changed managerId on save.
    const { manager: _manager, ...rest } = project;
    await this.projects.save({ ...rest, ...dto });
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.getEntity(id);
    await this.projects.delete({ id });
  }

  /** Aggregated task statistics per project. */
  private async statsFor(
    projects: ProjectEntity[],
  ): Promise<Map<number, RawTaskStats>> {
    if (!projects.length) return new Map();
    const rows = await this.tasks
      .createQueryBuilder('t')
      .select('t.projectId', 'projectId')
      .addSelect('COUNT(*)', 'taskCount')
      .addSelect(
        'SUM(CASE WHEN t.status = :done THEN 1 ELSE 0 END)',
        'completedTaskCount',
      )
      .addSelect(
        'SUM(CASE WHEN t.status <> :done AND t.dueDate < :today THEN 1 ELSE 0 END)',
        'overdueTaskCount',
      )
      .addSelect('AVG(CAST(t.progress AS FLOAT))', 'progress')
      .where({ projectId: In(projects.map((p) => p.id)) })
      .groupBy('t.projectId')
      .setParameters({ done: TaskStatus.Done, today: toIsoDate(new Date()) })
      .getRawMany<RawTaskStats>();
    return new Map(rows.map((r) => [Number(r.projectId), r]));
  }

  private toJson(p: ProjectEntity, raw?: RawTaskStats): Project {
    const stats: Omit<ProjectStats, 'health'> = {
      taskCount: Number(raw?.taskCount ?? 0),
      completedTaskCount: Number(raw?.completedTaskCount ?? 0),
      overdueTaskCount: Number(raw?.overdueTaskCount ?? 0),
      progress: Math.round(Number(raw?.progress ?? 0)),
    };
    const { tasks: _tasks, manager, ...fields } = p;
    return {
      ...fields,
      ...stats,
      health: computeProjectHealth({ ...p, ...stats }),
      manager: manager ? toMemberJson(manager) : null,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  private async assertCodeFree(code: string) {
    if (await this.projects.existsBy({ code })) {
      throw new ConflictException(`Project code ${code} is already in use`);
    }
  }

  private async assertManager(managerId?: number | null) {
    if (
      managerId != null &&
      !(await this.members.existsBy({ id: managerId }))
    ) {
      throw new BadRequestException(`Team member #${managerId} does not exist`);
    }
  }
}

export function escapeLike(value: string): string {
  return value.replace(/[[\]%_]/g, (c) => `[${c}]`);
}
