import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { typeOrmOptions } from './database/database.config';
import { SeedService } from './database/seed.service';
import { HealthController } from './health.controller';
import { MembersModule } from './members/members.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // The first file that defines a variable wins; real environment variables
      // (e.g. from docker-compose) always win. The example file supplies working
      // development defaults when apps/api/.env has not been created.
      envFilePath: ['apps/api/.env', '.env', 'apps/api/.env.example'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmOptions,
    }),
    AuthModule,
    MembersModule,
    ProjectsModule,
    TasksModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [SeedService],
})
export class AppModule {}
