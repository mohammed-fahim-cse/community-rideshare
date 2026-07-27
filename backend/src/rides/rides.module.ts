import { Module } from '@nestjs/common';
import { RealtimeModule } from '../realtime/realtime.module';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';

@Module({
  imports: [RealtimeModule],
  controllers: [RidesController],
  providers: [RidesService],
  exports: [RidesService],
})
export class RidesModule {}
