import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, AddProjectMemberDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(spaceId: string) {
    return this.prisma.project.findMany({
      where: { spaceId },
      include: {
        milestones: { orderBy: { date: 'asc' } },
        members: { include: { user: { select: { id: true, firstName: true, lastName: true, favoriteColor: true } } } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(spaceId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, spaceId },
      include: {
        milestones: { orderBy: { date: 'asc' } },
        members: { include: { user: true } },
      },
    });
    if (!project) throw new NotFoundException('Проект не найден');
    return project;
  }

  async create(spaceId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        spaceId,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        imageUrl: dto.imageUrl,
        milestones: dto.milestones
          ? { create: dto.milestones.map((m) => ({ ...m, date: new Date(m.date) })) }
          : undefined,
      },
      include: { milestones: true },
    });
  }

  async update(spaceId: string, id: string, dto: Partial<CreateProjectDto>) {
    await this.findOne(spaceId, id);
    const { milestones, ...rest } = dto;

    if (milestones !== undefined) {
      await this.prisma.milestone.deleteMany({ where: { projectId: id } });
      await this.prisma.milestone.createMany({
        data: milestones.map((m) => ({ projectId: id, ...m, date: new Date(m.date) })),
      });
    }

    return this.prisma.project.update({
      where: { id },
      data: rest,
      include: { milestones: true },
    });
  }

  async remove(spaceId: string, id: string) {
    await this.findOne(spaceId, id);
    await this.prisma.project.delete({ where: { id } });
    return { ok: true };
  }

  async addMember(spaceId: string, projectId: string, dto: AddProjectMemberDto) {
    const project = await this.findOne(spaceId, projectId);
    return this.prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: project.id, userId: dto.userId } },
      create: { projectId: project.id, userId: dto.userId },
      update: {},
    });
  }

  async removeMember(spaceId: string, projectId: string, userId: string) {
    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
    return { ok: true };
  }
}
