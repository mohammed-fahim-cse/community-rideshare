import { Module } from '@nestjs/common';
import { RidesModule } from '../rides/rides.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [RidesModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
