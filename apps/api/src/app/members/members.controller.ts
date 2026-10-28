import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, ManagerOnly } from '../auth/decorators';
import { CreateMemberDto, UpdateMemberDto } from './dto/member.dto';
import { MemberEntity } from './member.entity';
import { MembersService } from './members.service';

@ApiTags('Team members')
@ApiBearerAuth()
@ManagerOnly()
@Controller('members')
export class MembersController {
  constructor(private readonly service: MembersService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateMemberDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: MemberEntity,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: MemberEntity,
  ) {
    return this.service.remove(id, user.id);
  }
}
