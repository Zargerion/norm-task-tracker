import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../bot/telegram.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private telegram: TelegramService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async notifyMilestones() {
    const now = new Date();
    const milestones = await this.prisma.milestone.findMany({
      where: { date: { lte: now }, notified: false },
      include: {
        project: {
          include: {
            members: { include: { user: { select: { telegramId: true } } } },
          },
        },
      },
    });

    for (const milestone of milestones) {
      const text =
        `🗓 *Важная дата проекта "${milestone.project.name}"*\n\n` +
        `📌 ${milestone.title}\n${milestone.description ?? ''}`;

      for (const member of milestone.project.members) {
        if (member.user.telegramId) {
          await this.telegram.sendMessage(member.user.telegramId, text);
        }
      }

      await this.prisma.milestone.update({ where: { id: milestone.id }, data: { notified: true } });
      this.logger.log(`Notified milestone: ${milestone.title}`);
    }
  }
}
