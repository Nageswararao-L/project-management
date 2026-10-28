import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { UserRole } from '@pm/shared';
import type { MemberEntity } from '../members/member.entity';

export const IS_PUBLIC = 'isPublic';
export const ROLES = 'roles';

/** Skips authentication (login, health check). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Restricts a route (or controller) to the given roles. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES, roles);

/** Shorthand for `@Roles(UserRole.Manager)`. */
export const ManagerOnly = () => Roles(UserRole.Manager);

/** The signed-in member, set by AuthGuard. */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): MemberEntity =>
    ctx.switchToHttp().getRequest().user,
);
