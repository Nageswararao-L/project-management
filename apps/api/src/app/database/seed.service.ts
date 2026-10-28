import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Priority,
  ProjectStatus,
  TaskStatus,
  toIsoDate,
  UserRole,
} from '@pm/shared';
import { hashPassword } from '../auth/password';
import { DataSource } from 'typeorm';
import { MemberEntity } from '../members/member.entity';
import { ProjectEntity } from '../projects/project.entity';
import { TaskEntity } from '../tasks/task.entity';

/** Date `n` days from today as YYYY-MM-DD. */
function day(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toIsoDate(d);
}

type SeedTask = [
  title: string,
  status: TaskStatus,
  priority: Priority,
  start: number,
  due: number,
  progress: number,
  assignee: number,
  hours: number,
];

const { Todo, InProgress, InReview, Blocked, Done } = TaskStatus;
const { Low, Medium, High, Critical } = Priority;

/** Password of every demo account (see README). */
export const DEMO_PASSWORD = 'Password@123';

/**
 * On startup:
 * - inserts sample data (dates relative to today) into an empty database
 *   when SEED_DEMO_DATA=true, so the dashboard has something to show;
 * - creates the first manager account from ADMIN_EMAIL / ADMIN_PASSWORD
 *   when no manager can sign in yet.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get('SEED_DEMO_DATA') === 'true') await this.seedDemoData();
    await this.ensureAdmin();
  }

  private async ensureAdmin() {
    const members = this.dataSource.getRepository(MemberEntity);
    const managerCanSignIn = await members
      .createQueryBuilder('m')
      .where('m.role = :role', { role: UserRole.Manager })
      .andWhere('m.isActive = 1')
      .andWhere('m.passwordHash IS NOT NULL')
      .getExists();
    if (managerCanSignIn) return;

    const email = this.config.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) {
      this.logger.warn(
        'No manager account can sign in. Set ADMIN_EMAIL and ADMIN_PASSWORD to create one.',
      );
      return;
    }
    const existing = await members.findOneBy({ email });
    await members.save({
      ...existing,
      email,
      name: existing?.name ?? this.config.get('ADMIN_NAME', 'Administrator'),
      role: UserRole.Manager,
      isActive: true,
      passwordHash: await hashPassword(password),
    });
    this.logger.log(`Manager account ready: ${email}`);
  }

  private async seedDemoData() {
    if ((await this.dataSource.getRepository(ProjectEntity).count()) > 0)
      return;
    const passwordHash = await hashPassword(DEMO_PASSWORD);
    await this.dataSource.transaction(async (em) => {
      const { Manager, User } = UserRole;
      const members = await em.save(
        MemberEntity,
        (
          [
            [
              'Aarav Patel',
              'aarav.patel@example.com',
              'Project Manager',
              Manager,
            ],
            [
              'Priya Sharma',
              'priya.sharma@example.com',
              'Frontend Developer',
              User,
            ],
            [
              'Rahul Verma',
              'rahul.verma@example.com',
              'Backend Developer',
              User,
            ],
            ['Sneha Reddy', 'sneha.reddy@example.com', 'QA Engineer', User],
            ['Kiran Rao', 'kiran.rao@example.com', 'UI/UX Designer', User],
            [
              'Anita Desai',
              'anita.desai@example.com',
              'Delivery Manager',
              Manager,
            ],
          ] as const
        ).map(([name, email, jobTitle, role]) =>
          em.create(MemberEntity, {
            name,
            email,
            jobTitle,
            role,
            passwordHash,
          }),
        ),
      );

      const projects: Array<{
        project: Partial<ProjectEntity>;
        start: number;
        end: number;
        tasks: SeedTask[];
      }> = [
        {
          project: {
            code: 'CRM-01',
            name: 'Customer Portal Revamp',
            client: 'Acme Corp',
            description:
              'Redesign the self-service customer portal with a new UI and faster APIs.',
            status: ProjectStatus.InProgress,
            priority: High,
          },
          start: -40,
          end: 50,
          tasks: [
            ['Gather requirements', Done, High, -40, -30, 100, 5, 24],
            ['UI wireframes & design system', Done, High, -32, -18, 100, 4, 40],
            ['Authentication & SSO', InProgress, Critical, -18, 4, 70, 2, 32],
            ['Customer dashboard UI', InProgress, High, -14, 10, 45, 1, 48],
            ['Invoices & payments module', Todo, Medium, 0, 25, 0, 2, 40],
            ['Integration testing', Todo, Medium, 20, 40, 0, 3, 30],
            ['UAT & go-live', Todo, High, 38, 50, 0, 0, 16],
          ],
        },
        {
          project: {
            code: 'MOB-02',
            name: 'Mobile App v2',
            client: 'Internal',
            description:
              'Second major release of the field-service mobile app (offline mode, push notifications).',
            status: ProjectStatus.InProgress,
            priority: Critical,
          },
          start: -60,
          end: 12,
          tasks: [
            ['Offline sync engine', InProgress, Critical, -50, -3, 60, 2, 80],
            ['Push notifications', Blocked, High, -30, -1, 30, 2, 24],
            ['Redesign navigation', InReview, Medium, -25, 2, 90, 1, 24],
            ['Regression test suite', Todo, High, -5, 8, 0, 3, 32],
            ['App store submission', Todo, Medium, 8, 12, 0, 0, 6],
          ],
        },
        {
          project: {
            code: 'ERP-03',
            name: 'ERP Data Migration',
            client: 'Globex Ltd',
            description:
              'Migrate legacy ERP data to the new SQL Server 2022 platform.',
            status: ProjectStatus.Planning,
            priority: Medium,
          },
          start: 5,
          end: 95,
          tasks: [
            ['Data mapping workshop', Todo, High, 5, 12, 0, 5, 16],
            ['Migration scripts', Todo, Medium, 12, 50, 0, 2, 120],
            ['Data validation', Todo, Medium, 45, 80, 0, 3, 60],
            ['Cut-over plan', Todo, Low, 80, 95, 0, 0, 12],
          ],
        },
        {
          project: {
            code: 'WEB-04',
            name: 'Marketing Website',
            client: 'Initech',
            description: 'New marketing website with CMS.',
            status: ProjectStatus.Completed,
            priority: Low,
          },
          start: -120,
          end: -20,
          tasks: [
            ['Content strategy', Done, Medium, -120, -100, 100, 5, 20],
            ['Site design', Done, Medium, -100, -70, 100, 4, 40],
            ['Build & launch', Done, High, -70, -20, 100, 1, 80],
          ],
        },
        {
          project: {
            code: 'SEC-05',
            name: 'Security Audit',
            client: 'Internal',
            description:
              'Annual security review and penetration test remediation.',
            status: ProjectStatus.OnHold,
            priority: High,
          },
          start: -30,
          end: 30,
          tasks: [
            ['Vendor selection', Done, Medium, -30, -20, 100, 0, 8],
            ['Penetration test', InProgress, High, -15, 10, 40, 3, 40],
            ['Remediation', Todo, High, 10, 30, 0, 2, 40],
          ],
        },
      ];

      for (const [index, p] of projects.entries()) {
        const project = await em.save(
          em.create(ProjectEntity, {
            ...p.project,
            startDate: day(p.start),
            endDate: day(p.end),
            managerId: members[index % 2 === 0 ? 0 : 5].id,
          }),
        );
        await em.save(
          p.tasks.map(
            ([
              title,
              status,
              priority,
              start,
              due,
              progress,
              assignee,
              hours,
            ]) =>
              em.create(TaskEntity, {
                projectId: project.id,
                title,
                status,
                priority,
                startDate: day(start),
                dueDate: day(due),
                progress,
                assigneeId: members[assignee].id,
                estimatedHours: hours,
                completedAt:
                  status === Done ? new Date(`${day(due)}T12:00:00Z`) : null,
              }),
          ),
        );
      }
    });
    this.logger.log('Demo data inserted');
  }
}
