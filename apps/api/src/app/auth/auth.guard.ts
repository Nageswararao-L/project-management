import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from '@pm/shared';
import { Repository } from 'typeorm';
import { MemberEntity } from '../members/member.entity';
import { IS_PUBLIC, ROLES } from './decorators';

/**
 * Global guard: every route needs a valid Bearer token unless marked @Public().
 * The member is re-loaded on each request so deactivation and role changes
 * take effect immediately.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @InjectRepository(MemberEntity)
    private readonly members: Repository<MemberEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Please sign in');
    }

    let memberId: number;
    try {
      memberId = Number(
        (await this.jwt.verifyAsync<{ sub: number }>(token)).sub,
      );
    } catch {
      throw new UnauthorizedException(
        'Your session has expired, please sign in again',
      );
    }
    const member = await this.members.findOneBy({ id: memberId });
    if (!member?.isActive) {
      throw new UnauthorizedException('Your account is not active');
    }
    request.user = member;

    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES, targets);
    if (roles?.length && !roles.includes(member.role)) {
      throw new ForbiddenException('Only managers can do this');
    }
    return true;
  }
}
