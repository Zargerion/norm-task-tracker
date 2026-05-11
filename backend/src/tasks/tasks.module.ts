import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksGateway } from './tasks.gateway';
import { BotModule } from '../bot/bot.module';
import { UploadModule } from '../upload/upload.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [BotModule, UploadModule, AuthModule],
  controllers: [TasksController],
  providers: [TasksService, TasksGateway],
  exports: [TasksService],
})
export class TasksModule {}
