import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('bot')
export class BotController {
  constructor(
    private telegram: TelegramService,
    private config: ConfigService,
  ) {}

  @Public()
  @Post('webhook')
  async webhook(
    @Body() body: any,
    @Headers('x-telegram-bot-api-secret-token') secret: string,
  ) {
    const expected = this.config.get('BOT_WEBHOOK_SECRET');
    if (expected && secret !== expected) throw new UnauthorizedException();
    await this.telegram.handleWebhook(body);
    return { ok: true };
  }
}
