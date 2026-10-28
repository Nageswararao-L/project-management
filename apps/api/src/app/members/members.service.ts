import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Member,
  MemberWithWorkload,
  TaskStatus,
  toIsoDate,
  UserRole,
} from '@pm/shared';
import { DataSource, Repository } from 'typeorm';
import { hashPassword } from '../auth/password';
import { ProjectEntity } from '../projects/project.entity';
import { TaskEntity } from '../tasks/task.entity';
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto';
import { MemberEntity } from './member.entity';

/** Public JSON shape of a member (never includes the password hash). */
export function toMemberJson(m: MemberEntity): Member {
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    jobTitle: m.jobTitle,
    role: m.role,
    isActive: m.isActive,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly members: Repository<MemberEntity>,
    private readonly dataSource: DataSource,
  ) {}

  /** Members with workload; pass `memberId` to get only that member. */
  async findAll(memberId?: number): Promise<MemberWithWorkload[]> {
    const today = toIsoDate(new Date());
    const qb = this.members
      .createQueryBuilder('m')
      .select('m.id', 'id')
      .addSelect(
        'CASE WHEN m.passwordHash IS NULL THEN 0 ELSE 1 END',
        'hasLogin',
      )
      .addSelect(
        (sub) =>
          sub
            .select('COUNT(*)')
            .from(TaskEntity, 't')
            .where('t.assigneeId = m.id')
            .andWhere('t.status <> :done'),
        'openTasks',
      )
      .addSelect(
        (sub) =>
          sub
            .select('COUNT(*)')
            .from(TaskEntity, 't')
            .where('t.assigneeId = m.id')
            .andWhere('t.status <> :done')
            .andWhere('t.dueDate < :today'),
        'overdueTasks',
      )
      .addSelect(
        (sub) =>
          sub
            .select('COUNT(*)')
            .from(ProjectEntity, 'p')
            .where('p.managerId = m.id'),
        'managedProjects',
      )
      .setParameters({ done: TaskStatus.Done, today });
    if (memberId) qb.where('m.id = :memberId', { memberId });
    const rows = await qb.getRawMany<{
      id: number;
      hasLogin: number;
      openTasks: number;
      overdueTasks: number;
      managedProjects: number;
    }>();
    const stats = new Map(rows.map((r) => [r.id, r]));
    const members = await this.members.find({
      where: memberId ? { id: memberId } : {},
      order: { name: 'ASC' },
    });
    return members.map((m) => ({
      ...toMemberJson(m),
      hasLogin: Number(stats.get(m.id)?.hasLogin ?? 0) === 1,
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

  async create(dto: CreateMemberDto): Promise<Member> {
    await this.assertEmailFree(dto.email);
    const { password, ...fields } = dto;
    const member = this.members.create({
      ...fields,
      jobTitle: fields.jobTitle || null,
      role: fields.role ?? UserRole.User,
      passwordHash: password ? await hashPassword(password) : null,
    });
    return toMemberJson(await this.members.save(member));
  }

  async update(
    id: number,
    dto: UpdateMemberDto,
    currentUserId: number,
  ): Promise<Member> {
    const member = await this.findOne(id);
    if (id === currentUserId) {
      if (dto.role && dto.role !== UserRole.Manager) {
        throw new BadRequestException(
          'You cannot remove your own manager role',
        );
      }
      if (dto.isActive === false) {
        throw new BadRequestException('You cannot deactivate your own account');
      }
    }
    if (dto.email && dto.email !== member.email) {
      await this.assertEmailFree(dto.email);
    }
    const { password, ...fields } = dto;
    Object.assign(member, fields);
    if (password) member.passwordHash = await hashPassword(password);
    return toMemberJson(await this.members.save(member));
  }

  async remove(id: number, currentUserId: number): Promise<void> {
    if (id === currentUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }
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
}
