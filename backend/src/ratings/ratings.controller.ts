import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from '../common/guards/active-user.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@Controller('rides')
@UseGuards(JwtAuthGuard, ActiveUserGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post(':id/rate')
  rate(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: CreateRatingDto) {
    return this.ratingsService.rate(user, id, dto);
  }
}
