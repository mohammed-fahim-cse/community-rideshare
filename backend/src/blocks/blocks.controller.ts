import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from '../common/guards/active-user.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BlocksService } from './blocks.service';
import { CreateBlockDto } from './dto/create-block.dto';

@Controller('blocks')
@UseGuards(JwtAuthGuard, ActiveUserGuard)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.blocksService.list(user);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateBlockDto) {
    return this.blocksService.block(user, dto.blockedUserId);
  }

  @Delete(':userId')
  remove(@CurrentUser() user: User, @Param('userId') userId: string) {
    return this.blocksService.unblock(user, userId);
  }
}
