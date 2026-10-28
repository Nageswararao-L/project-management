import { Priority, TaskStatus } from '@pm/shared';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/base.entity';
import { dateTransformer, decimalTransformer } from '../common/transformers';
import { MemberEntity } from '../members/member.entity';
import { ProjectEntity } from '../projects/project.entity';

@Entity('tasks')
export class TaskEntity extends BaseEntity {
  @Index()
  @Column({ type: 'int' })
  projectId!: number;

  @ManyToOne(() => ProjectEntity, (project) => project.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project!: ProjectEntity;

  @Column({ type: 'nvarchar', length: 200 })
  title!: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  description!: string | null;

  @Index()
  @Column({
    type: 'simple-enum',
    length: 20,
    enum: TaskStatus,
    default: TaskStatus.Todo,
  })
  status!: TaskStatus;

  @Column({
    type: 'simple-enum',
    length: 20,
    enum: Priority,
    default: Priority.Medium,
  })
  priority!: Priority;

  @Column({ type: 'date', transformer: dateTransformer })
  startDate!: string;

  @Index()
  @Column({ type: 'date', transformer: dateTransformer })
  dueDate!: string;

  @Column({ type: 'int', default: 0 })
  progress!: number;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  estimatedHours!: number | null;

  @Index()
  @Column({ type: 'int', nullable: true })
  assigneeId!: number | null;

  @ManyToOne(() => MemberEntity, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'assigneeId' })
  assignee!: MemberEntity | null;

  @Column({ type: 'datetime2', nullable: true })
  completedAt!: Date | null;
}
