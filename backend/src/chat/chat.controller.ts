import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActiveUserGuard } from '../common/guards/active-user.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('rides')
@UseGuards(JwtAuthGuard, ActiveUserGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':id/messages')
  list(@CurrentUser() user: User, @Param('id') id: string) {
    return this.chatService.listMessages(user, id);
  }

  @Post(':id/messages')
  send(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: CreateMessageDto) {
    return this.chatService.sendMessage(user, id, dto);
  }
}
