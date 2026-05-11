import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ login: dto.login }, ...(dto.email ? [{ email: dto.email }] : [])] },
    });
    if (existing) throw new ConflictException('Логин или email уже заняты');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        login: dto.login,
        passwordHash,
        jobTitle: dto.jobTitle,
        favoriteColor: dto.favoriteColor,
        description: dto.description,
        phone: dto.phone,
        email: dto.email,
        isApproved: false,
      },
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const code = await this.prisma.pendingCode.create({
      data: { userId: user.id, expiresAt },
    });

    const botUsername = (this.config.get<string>('BOT_USERNAME') ?? '').trim();
    const botUrl = botUsername
      ? `https://t.me/${botUsername}?start=${code.id}`
      : '';

    return { userId: user.id, code: code.id, botUrl };
  }

  async getRegistrationStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isApproved: true, telegramId: true },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
  }

  async getSpaceUsers(spaceId: string) {
    return this.prisma.spaceUser.findMany({
      where: { spaceId },
      include: {
        user: {
          select: {
            id: true, firstName: true, lastName: true, login: true,
            jobTitle: true, favoriteColor: true, description: true,
            phone: true, email: true, telegramId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateSpaceUser(spaceId: string, userId: string, data: { role?: string; description?: string }) {
    const spaceUser = await this.prisma.spaceUser.findUnique({
      where: { userId_spaceId: { userId, spaceId } },
    });
    if (!spaceUser) throw new NotFoundException('Пользователь не найден в пространстве');

    const updates: any[] = [];
    if (data.role) {
      updates.push(this.prisma.spaceUser.update({
        where: { userId_spaceId: { userId, spaceId } },
        data: { role: data.role as any },
      }));
    }
    if (data.description !== undefined) {
      updates.push(this.prisma.user.update({
        where: { id: userId },
        data: { description: data.description },
      }));
    }
    await Promise.all(updates);
    return { ok: true };
  }

  async removeFromSpace(spaceId: string, userId: string) {
    await this.prisma.spaceUser.delete({
      where: { userId_spaceId: { userId, spaceId } },
    });
    return { ok: true };
  }

  async updateMe(userId: string, data: {
    firstName?: string; lastName?: string; jobTitle?: string;
    phone?: string; email?: string; favoriteColor?: string;
    description?: string; password?: string;
  }) {
    const update: any = { ...data };
    if (data.password) {
      update.passwordHash = await argon2.hash(data.password);
      delete update.password;
    }
    if (data.email) {
      const exists = await this.prisma.user.findFirst({ where: { email: data.email, NOT: { id: userId } } });
      if (exists) throw new ConflictException('Email уже занят');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: update,
      select: {
        id: true, firstName: true, lastName: true, login: true,
        jobTitle: true, favoriteColor: true, description: true,
        phone: true, email: true, avatarUrl: true, isSuperAdmin: true,
      },
    });
  }

  async setAvatar(userId: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: { avatarUrl: true },
    });
  }

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true, login: true, telegramId: true, isSuperAdmin: true },
    });
  }

  async getUserStats(spaceId: string, userId: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        spaceId,
        assignees: { some: { userId } },
        status: { in: ['COMPLETED', 'APPROVED'] },
      },
      include: {
        timeRecords: true,
        project: { select: { id: true, name: true, color: true } },
      },
    });

    const classify = (hours: number | null) => {
      if (!hours || hours <= 3) return 'Обычная';
      if (hours <= 5) return 'Нормальная';
      if (hours <= 8) return 'Уникальная';
      if (hours <= 20) return 'Особая';
      return 'Реликварная';
    };

    const calcHours = (records: { acceptedAt: Date; completedAt: Date | null }[]) =>
      records.reduce((sum, r) => {
        if (!r.completedAt) return sum;
        return sum + (r.completedAt.getTime() - r.acceptedAt.getTime()) / 3600000;
      }, 0);

    const byType: Record<string, number> = {};
    let totalHours = 0;
    const projectMap: Record<string, any> = {};

    for (const task of tasks) {
      const type = classify(task.estimatedHours);
      byType[type] = (byType[type] ?? 0) + 1;
      const hours = calcHours(task.timeRecords);
      totalHours += hours;

      const pid = task.project.id;
      if (!projectMap[pid]) {
        projectMap[pid] = { project: task.project, total: 0, byType: {}, hours: 0 };
      }
      projectMap[pid].total += 1;
      projectMap[pid].byType[type] = (projectMap[pid].byType[type] ?? 0) + 1;
      projectMap[pid].hours += hours;
    }

    return {
      total: tasks.length,
      byType,
      totalHours: Math.round(totalHours * 100) / 100,
      projects: Object.values(projectMap).map((p) => ({
        ...p,
        hours: Math.round(p.hours * 100) / 100,
      })),
    };
  }

  async getUserCompletedTasks(spaceId: string, userId: string) {
    const tasks = await this.prisma.task.findMany({
      where: {
        spaceId,
        assignees: { some: { userId } },
        status: { in: ['COMPLETED', 'APPROVED'] },
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        assignees: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, favoriteColor: true } },
          },
        },
        timeRecords: { orderBy: { completedAt: 'desc' }, take: 1 },
        _count: { select: { additions: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return tasks.map((t) => ({
      ...t,
      completedAt: t.timeRecords[0]?.completedAt ?? t.updatedAt,
    }));
  }
}
