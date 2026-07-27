import { Module } from '@nestjs/common';
import { RidesModule } from '../rides/rides.module';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';

@Module({
  imports: [RidesModule],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}
