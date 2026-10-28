import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MemberWithWorkload, TaskStatus, toIsoDate } from '@pm/shared';
import { DataSource, Repository } from 'typeorm';
import { ProjectEntity } from '../projects/project.entity';
import { TaskEntity } from '../tasks/task.entity';
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto';
import { MemberEntity } from './member.entity';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly members: Repository<MemberEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<MemberWithWorkload[]> {
    const today = toIsoDate(new Date());
    const rows = await this.members
      .createQueryBuilder('m')
      .select('m.id', 'id')
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)')
            .from(TaskEntity, 't')
            .where('t.assigneeId = m.id')
            .andWhere('t.status <> :done'),
        'openTasks',
      )
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)')
            .from(TaskEntity, 't')
            .where('t.assigneeId = m.id')
            .andWhere('t.status <> :done')
            .andWhere('t.dueDate < :today'),
        'overdueTasks',
      )
      .addSelect(
        (qb) =>
          qb
            .select('COUNT(*)')
            .from(ProjectEntity, 'p')
            .where('p.managerId = m.id'),
        'managedProjects',
      )
      .setParameters({ done: TaskStatus.Done, today })
      .getRawMany<{
        id: number;
        openTasks: number;
        overdueTasks: number;
        managedProjects: number;
      }>();
    const stats = new Map(rows.map((r) => [r.id, r]));
    const members = await this.members.find({ order: { name: 'ASC' } });
    return members.map((m) => ({
      ...this.toJson(m),
      openTasks: Number(stats.get(m.id)?.openTasks ?? 0),
      overdueTasks: Number(stats.get(m.id)?.overdueTasks ?? 0),
      managedProjects: Number(stats.get(m.id)?.managedProjects ?? 0),
    }));
  }

  async findOne(id: number): Promise<MemberEntity> {
    const member = await this.members.findOneBy({ id });
    if (!member) throw new NotFoundException(`Team member #${id} not found`);
    return member;
  }

  async create(dto: CreateMemberDto) {
    await this.assertEmailFree(dto.email);
    const member = this.members.create({ ...dto, role: dto.role || null });
    return this.toJson(await this.members.save(member));
  }

  async update(id: number, dto: UpdateMemberDto) {
    const member = await this.findOne(id);
    if (dto.email && dto.email !== member.email) {
      await this.assertEmailFree(dto.email);
    }
    Object.assign(member, dto);
    return this.toJson(await this.members.save(member));
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.dataSource.transaction(async (em) => {
      await em.update(TaskEntity, { assigneeId: id }, { assigneeId: null });
      await em.update(ProjectEntity, { managerId: id }, { managerId: null });
      await em.delete(MemberEntity, { id });
    });
  }

  private async assertEmailFree(email: string) {
    if (await this.members.existsBy({ email })) {
      throw new ConflictException(
        `A team member with email ${email} already exists`,
      );
    }
  }

  private toJson(m: MemberEntity) {
    return {
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    };
  }
}
