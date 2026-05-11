import { Module } from '@nestjs/common';
import { BotController } from './bot.controller';
import { TelegramService } from './telegram.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [BotController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class BotModule {}
