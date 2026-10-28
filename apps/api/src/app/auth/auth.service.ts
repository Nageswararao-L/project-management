import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { LoginResponse } from '@pm/shared';
import { Repository } from 'typeorm';
import { MemberEntity } from '../members/member.entity';
import { toMemberJson } from '../members/members.service';
import { LoginDto } from './dto/login.dto';
import { verifyPassword } from './password';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(MemberEntity)
    private readonly members: Repository<MemberEntity>,
    private readonly jwt: JwtService,
  ) {}

  async login({ email, password }: LoginDto): Promise<LoginResponse> {
    const member = await this.members
      .createQueryBuilder('m')
      .addSelect('m.passwordHash')
      .where('m.email = :email', { email })
      .getOne();
    // Same message for unknown email and wrong password.
    if (!member || !(await verifyPassword(password, member.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!member.isActive) {
      throw new UnauthorizedException('Your account is not active');
    }
    return {
      accessToken: await this.jwt.signAsync({ sub: member.id }),
      user: toMemberJson(member),
    };
  }
}
