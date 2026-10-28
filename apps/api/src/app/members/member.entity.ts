import { UserRole } from '@pm/shared';
import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../common/base.entity';

@Entity('members')
export class MemberEntity extends BaseEntity {
  @Column({ type: 'nvarchar', length: 100 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'nvarchar', length: 150 })
  email!: string;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  jobTitle!: string | null;

  @Column({
    type: 'simple-enum',
    length: 20,
    enum: UserRole,
    default: UserRole.User,
  })
  role!: UserRole;

  /** scrypt hash; null means the member cannot sign in. Never selected by default. */
  @Column({ type: 'nvarchar', length: 255, nullable: true, select: false })
  passwordHash?: string | null;

  @Column({ type: 'bit', default: true })
  isActive!: boolean;
}
