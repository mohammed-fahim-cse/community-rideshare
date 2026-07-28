import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from '../common/guards/active-user.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RidesService } from './rides.service';
import { CreateRidePostDto } from './dto/create-ride-post.dto';
import { ListRidesDto } from './dto/list-rides.dto';
import { CancelRideDto } from './dto/cancel-ride.dto';

@Controller('rides')
@UseGuards(JwtAuthGuard, ActiveUserGuard)
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateRidePostDto) {
    return this.ridesService.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: User, @Query() query: ListRidesDto) {
    return this.ridesService.list(user, query);
  }

  @Get('mine')
  listMine(@CurrentUser() user: User) {
    return this.ridesService.listMine(user);
  }

  @Get(':id')
  getOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.ridesService.getOne(user, id);
  }

  @Post(':id/accept')
  accept(@CurrentUser() user: User, @Param('id') id: string) {
    return this.ridesService.accept(user, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: CancelRideDto) {
    return this.ridesService.cancel(user, id, dto);
  }

  @Post(':id/arrived')
  arrived(@CurrentUser() user: User, @Param('id') id: string) {
    return this.ridesService.arrived(user, id);
  }

  @Post(':id/complete')
  complete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.ridesService.complete(user, id);
  }
}
