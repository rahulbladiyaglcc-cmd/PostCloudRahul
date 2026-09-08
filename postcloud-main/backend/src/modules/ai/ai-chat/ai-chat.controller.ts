import { Body, Controller, Post } from '@nestjs/common';
import { AiChatMessageDto } from '../dto/ai-chat-message.dto';
import { AiChatService } from './ai-chat.service';

@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('message')
  ask(@Body() aiChatMessageDto: AiChatMessageDto) {
    return this.aiChatService.ask(aiChatMessageDto.message);
  }
}
