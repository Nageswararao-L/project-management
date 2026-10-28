import { Priority, ProjectStatus } from '@pm/shared';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { dateTransformer } from '../common/transformers';
import { MemberEntity } from '../members/member.entity';
import { TaskEntity } from '../tasks/task.entity';

@Entity('projects')
export class ProjectEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'nvarchar', length: 20 })
  code!: string;

  @Column({ type: 'nvarchar', length: 150 })
  name!: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  description!: string | null;

  @Column({ type: 'nvarchar', length: 150, nullable: true })
  client!: string | null;

  @Index()
  @Column({
    type: 'simple-enum',
    length: 20,
    enum: ProjectStatus,
    default: ProjectStatus.NotStarted,
  })
  status!: ProjectStatus;

  @Column({
    type: 'simple-enum',
    length: 20,
    enum: Priority,
    default: Priority.Medium,
  })
  priority!: Priority;

  @Column({ type: 'date', transformer: dateTransformer })
  startDate!: string;

  @Column({ type: 'date', transformer: dateTransformer })
  endDate!: string;

  @Column({ type: 'int', nullable: true })
  managerId!: number | null;

  // NO ACTION: SQL Server rejects multiple cascade paths (members -> projects -> tasks
  // and members -> tasks), so MembersService clears references before deleting.
  @ManyToOne(() => MemberEntity, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'managerId' })
  manager!: MemberEntity | null;

  @OneToMany(() => TaskEntity, (task) => task.project)
  tasks!: TaskEntity[];
}
