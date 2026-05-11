import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, AddAssigneeDto, AddAdditionDto } from './dto/task.dto';
import { TelegramService } from '../bot/telegram.service';
import { ConfigService } from '@nestjs/config';
import { TasksGateway } from './tasks.gateway';

const TASK_INCLUDE = {
  assignees: {
    include: {
      user: { select: { id: true, firstName: true, lastName: true, favoriteColor: true, telegramId: true } },
    },
  },
  createdBy: { select: { id: true, firstName: true, lastName: true, favoriteColor: true } },
  attachments: true,
  _count: { select: { additions: true } },
  timeRecords: true,
} as const;

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private telegram: TelegramService,
    private config: ConfigService,
    @Inject(forwardRef(() => TasksGateway))
    private gateway: TasksGateway,
  ) {}

  async findAll(spaceId: string, projectId: string) {
    return this.prisma.task.findMany({
      where: { spaceId, projectId },
      include: TASK_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async fetchFull(id: string) {
    return this.prisma.task.findUnique({ where: { id }, include: TASK_INCLUDE });
  }

  async findOne(spaceId: string, projectId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, spaceId, projectId },
      include: {
        assignees: { include: { user: true } },
        additions: { include: { user: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { createdAt: 'asc' } },
        attachments: true,
        timeRecords: { orderBy: { createdAt: 'asc' } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!task) throw new NotFoundException('Задача не найдена');
    return task;
  }

  async create(spaceId: string, projectId: string, dto: CreateTaskDto, userId: string) {
    const frontendUrl = this.config.get('FRONTEND_URL');
    const created = await this.prisma.task.create({
      data: {
        spaceId,
        projectId,
        title: dto.title,
        description: dto.description,
        estimatedHours: dto.estimatedHours,
        createdById: userId,
        assignees: dto.assigneeIds?.length
          ? { create: dto.assigneeIds.map((uid) => ({ userId: uid })) }
          : undefined,
      },
      include: { assignees: { include: { user: true } } },
    });

    if (dto.assigneeIds?.length) {
      for (const assignee of created.assignees) {
        if (assignee.user.telegramId) {
          await this.telegram.sendMessage(
            assignee.user.telegramId,
            `📋 Вам назначена задача: *${created.title}*\n\n${created.description ?? ''}\n\n[Открыть задачу](${frontendUrl}/tracker/tasks/${created.id})`,
          );
        }
      }
    }

    const full = await this.fetchFull(created.id);
    this.gateway.emitTaskCreated(projectId, full);
    return full;
  }

  async update(spaceId: string, projectId: string, id: string, dto: Partial<CreateTaskDto>) {
    const task = await this.findOne(spaceId, projectId, id);
    await this.prisma.task.update({ where: { id: task.id }, data: dto });
    const full = await this.fetchFull(id);
    this.gateway.emitTaskUpdated(projectId, full);
    return full;
  }

  async remove(spaceId: string, projectId: string, id: string) {
    await this.findOne(spaceId, projectId, id);
    await this.prisma.task.delete({ where: { id } });
    this.gateway.emitTaskDeleted(projectId, id);
    return { ok: true };
  }

  async updateStatus(spaceId: string, projectId: string, id: string, newStatus: string, user: { sub: string; isSuperAdmin: boolean }) {
    const task = await this.findOne(spaceId, projectId, id);
    const frontendUrl = this.config.get('FRONTEND_URL');

    const spaceUser = user.isSuperAdmin
      ? { role: 'ADMIN' }
      : await this.prisma.spaceUser.findUnique({ where: { userId_spaceId: { userId: user.sub, spaceId } } });

    if (!spaceUser) throw new ForbiddenException('Нет доступа');
    const role = spaceUser.role;
    const canManage = role === 'ADMIN' || role === 'MANAGER' || user.isSuperAdmin;

    this.validateStatusTransition(task.status, newStatus, canManage);

    const updated = await this.prisma.task.update({
      where: { id },
      data: { status: newStatus as any },
      include: { assignees: { include: { user: true } } },
    });

    await this.handleStatusChange(task, updated, newStatus, user.sub, spaceId, frontendUrl, canManage);

    const full = await this.fetchFull(id);
    this.gateway.emitTaskStatusChanged(projectId, full);
    return full;
  }

  private validateStatusTransition(current: string, next: string, canManage: boolean) {
    const forbidden = [
      current === 'ACCEPTED' && next === 'CREATED',
      !canManage && next === 'ACCEPTED',
      !canManage && next === 'APPROVED',
      !canManage && current === 'COMPLETED' && next === 'ACCEPTED',
    ];
    if (forbidden.some(Boolean)) throw new ForbiddenException('Переход статуса запрещён');
  }

  private async handleStatusChange(
    oldTask: any, newTask: any, newStatus: string,
    actorId: string, spaceId: string, frontendUrl: string, canManage: boolean,
  ) {
    const taskLink = `${frontendUrl}/tracker/tasks/${newTask.id}`;
    const meetLinks = `\n\n📹 [Google Meet](https://meet.google.com/new) | [Яндекс Телемост](https://telemost.yandex.ru)`;

    if (newStatus === 'ACCEPTED') {
      const lastRecord = await this.prisma.taskTimeRecord.findFirst({
        where: { taskId: newTask.id, completedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      if (!lastRecord) {
        await this.prisma.taskTimeRecord.create({
          data: { taskId: newTask.id, acceptedAt: new Date() },
        });
      }

      await this.prisma.taskAssignee.upsert({
        where: { taskId_userId: { taskId: newTask.id, userId: actorId } },
        create: { taskId: newTask.id, userId: actorId },
        update: {},
      });
    }

    if (newStatus === 'COMPLETED') {
      const openRecord = await this.prisma.taskTimeRecord.findFirst({
        where: { taskId: newTask.id, completedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      if (openRecord) {
        await this.prisma.taskTimeRecord.update({
          where: { id: openRecord.id },
          data: { completedAt: new Date() },
        });
      }

      const managers = await this.prisma.spaceUser.findMany({
        where: { spaceId, role: { in: ['ADMIN', 'MANAGER'] } },
        include: { user: { select: { telegramId: true } } },
      });
      for (const m of managers) {
        if (m.user.telegramId) {
          await this.telegram.sendMessage(
            m.user.telegramId,
            `✅ Задача завершена: *${newTask.title}*\n\n${newTask.description ?? ''}\n\n[Открыть задачу](${taskLink})${meetLinks}`,
          );
        }
      }
    }

    if (oldTask.status === 'COMPLETED' && newStatus === 'ACCEPTED') {
      const openRecord = await this.prisma.taskTimeRecord.findFirst({
        where: { taskId: newTask.id, completedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      if (!openRecord) {
        await this.prisma.taskTimeRecord.create({
          data: { taskId: newTask.id, acceptedAt: new Date() },
        });
      }

      const actor = await this.prisma.user.findUnique({ where: { id: actorId }, select: { firstName: true, lastName: true } });
      for (const assignee of newTask.assignees) {
        if (assignee.user.telegramId) {
          await this.telegram.sendMessage(
            assignee.user.telegramId,
            `↩️ Задача *${newTask.title}* возвращена на этап "Принята"\nКто вернул: ${actor?.firstName} ${actor?.lastName}\n\n[Открыть задачу](${taskLink})${meetLinks}`,
          );
        }
      }
    }
  }

  async addAssignee(spaceId: string, projectId: string, taskId: string, dto: AddAssigneeDto) {
    const task = await this.findOne(spaceId, projectId, taskId);
    const frontendUrl = this.config.get('FRONTEND_URL');

    const assignee = await this.prisma.taskAssignee.upsert({
      where: { taskId_userId: { taskId, userId: dto.userId } },
      create: { taskId, userId: dto.userId },
      update: {},
      include: { user: true },
    });

    if (assignee.user.telegramId) {
      await this.telegram.sendMessage(
        assignee.user.telegramId,
        `📋 Вам назначена задача: *${task.title}*\n\n${task.description ?? ''}\n\n[Открыть задачу](${frontendUrl}/tracker/tasks/${task.id})`,
      );
    }

    const full = await this.fetchFull(taskId);
    this.gateway.emitTaskUpdated(task.projectId, full);
    return assignee;
  }

  async removeAssignee(spaceId: string, projectId: string, taskId: string, userId: string) {
    await this.prisma.taskAssignee.delete({ where: { taskId_userId: { taskId, userId } } });
    const full = await this.fetchFull(taskId);
    this.gateway.emitTaskUpdated(projectId, full);
    return { ok: true };
  }

  async addAddition(taskId: string, userId: string, dto: AddAdditionDto) {
    return this.prisma.taskAddition.create({ data: { taskId, userId, content: dto.content } });
  }

  async getTotalTime(taskId: string): Promise<number> {
    const records = await this.prisma.taskTimeRecord.findMany({ where: { taskId } });
    return records.reduce((sum, r) => {
      if (!r.completedAt) return sum;
      return sum + (r.completedAt.getTime() - r.acceptedAt.getTime());
    }, 0);
  }
}
