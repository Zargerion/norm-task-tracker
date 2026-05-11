import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, Context } from 'grammy';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Bot<Context>;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private auth: AuthService,
  ) {}

  async onModuleInit() {
    const token = this.config.get<string>('BOT_TOKEN');
    if (!token) {
      this.logger.warn('BOT_TOKEN not set — Telegram bot disabled');
      return;
    }

    this.bot = new Bot(token);
    this.registerHandlers();

    const isDev = this.config.get('NODE_ENV') !== 'production';
    if (isDev) {
      this.bot.start().catch((e) => this.logger.error('Bot start error', e));
      this.logger.log('Telegram bot started in polling mode');
    }
  }

  private registerHandlers() {
    const frontendUrl = this.config.get('FRONTEND_URL');

    this.bot.command('start', async (ctx) => {
      const code = ctx.match?.trim();
      const tgId = String(ctx.from?.id);

      if (code) {
        const pending = await this.prisma.pendingCode.findUnique({ where: { id: code } });
        if (!pending) {
          await ctx.reply('❌ Код не найден или истёк. Попробуйте зарегистрироваться снова.');
          return;
        }
        if (pending.expiresAt < new Date()) {
          await ctx.reply('❌ Код истёк. Зарегистрируйтесь снова на сайте.');
          return;
        }

        const existingTg = await this.prisma.user.findUnique({ where: { telegramId: tgId } });
        if (existingTg && existingTg.id !== pending.userId) {
          await ctx.reply('❌ Этот Telegram-аккаунт уже привязан к другому пользователю.');
          return;
        }

        await this.prisma.user.update({
          where: { id: pending.userId },
          data: { telegramId: tgId, isApproved: true },
        });
        await this.prisma.pendingCode.delete({ where: { id: code } });

        const magicToken = await this.auth.createMagicToken(pending.userId);
        const magicLink = `${frontendUrl}/auth/magic?token=${magicToken}`;

        await ctx.reply(
          `✅ Аккаунт подтверждён! Добро пожаловать!\n\n` +
          `🔗 [Войти в систему](${magicLink})\n\n` +
          `_Ссылка действует 15 минут. Для повторного входа используйте /войти_`,
          { parse_mode: 'Markdown' },
        );
        return;
      }

      const user = await this.prisma.user.findUnique({ where: { telegramId: tgId } });
      if (user) {
        await ctx.reply(
          `👋 Привет, ${user.firstName}!\n\nИспользуй /войти для входа в систему.`,
        );
      } else {
        await ctx.reply(
          `👋 Добро пожаловать в Norm Task Tracker!\n\n` +
          `Для начала работы зарегистрируйтесь на сайте: ${frontendUrl}/register`,
        );
      }
    });

    this.bot.command('войти', async (ctx) => {
      const tgId = String(ctx.from?.id);
      const user = await this.prisma.user.findUnique({ where: { telegramId: tgId } });

      if (!user) {
        await ctx.reply(`❌ Аккаунт не найден. Зарегистрируйтесь на сайте: ${frontendUrl}/register`);
        return;
      }

      const magicToken = await this.auth.createMagicToken(user.id);
      const magicLink = `${frontendUrl}/auth/magic?token=${magicToken}`;

      await ctx.reply(
        `🔗 [Войти в систему](${magicLink})\n\n_Ссылка действует 15 минут._`,
        { parse_mode: 'Markdown' },
      );
    });

    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        `📚 *Команды бота*\n\n` +
        `/войти — получить ссылку для входа\n` +
        `/help — список команд`,
        { parse_mode: 'Markdown' },
      );
    });

    this.bot.on('message:text', async (ctx) => {
      const text = ctx.message.text.trim();
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) {
        const tgId = String(ctx.from?.id);
        const pending = await this.prisma.pendingCode.findUnique({ where: { id: text } });
        if (pending && pending.expiresAt >= new Date()) {
          const frontendUrlLocal = this.config.get('FRONTEND_URL');
          await this.prisma.user.update({ where: { id: pending.userId }, data: { telegramId: tgId, isApproved: true } });
          await this.prisma.pendingCode.delete({ where: { id: text } });
          const magicToken = await this.auth.createMagicToken(pending.userId);
          await ctx.reply(
            `✅ Аккаунт подтверждён!\n\n🔗 [Войти в систему](${frontendUrlLocal}/auth/magic?token=${magicToken})`,
            { parse_mode: 'Markdown' },
          );
        }
      }
    });
  }

  async handleWebhook(body: any) {
    if (this.bot) {
      await this.bot.handleUpdate(body);
    }
  }

  async sendMessage(telegramId: string, text: string) {
    if (!this.bot) return;
    try {
      await this.bot.api.sendMessage(telegramId, text, { parse_mode: 'Markdown' });
    } catch (e) {
      this.logger.error(`Failed to send TG message to ${telegramId}: ${e.message}`);
    }
  }

  async setupWebhook(url: string) {
    if (this.bot) {
      await this.bot.api.setWebhook(url);
      this.logger.log(`Webhook set to: ${url}`);
    }
  }
}
