import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberEntity } from '../members/member.entity';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

const DEV_SECRET = 'dev-only-secret-change-me';

@Module({
  imports: [
    TypeOrmModule.forFeature([MemberEntity]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) {
          if (config.get('NODE_ENV') === 'production') {
            throw new Error('JWT_SECRET must be set in production');
          }
          Logger.warn(
            'JWT_SECRET is not set; using an insecure development secret',
            'Auth',
          );
        }
        return {
          secret: secret || DEV_SECRET,
          signOptions: {
            expiresIn: config.get('JWT_EXPIRES_IN', '12h'),
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthModule {}
