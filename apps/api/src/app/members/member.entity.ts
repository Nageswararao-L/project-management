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
  role!: string | null;

  @Column({ type: 'bit', default: true })
  isActive!: boolean;
}
