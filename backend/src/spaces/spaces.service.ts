import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpaceDto, AddSpaceMemberDto } from './dto/create-space.dto';

@Injectable()
export class SpacesService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any) {
    if (user.isSuperAdmin) {
      return this.prisma.space.findMany({
        include: { _count: { select: { spaceUsers: true, projects: true } } },
        orderBy: { createdAt: 'asc' },
      });
    }
    const spaceUsers = await this.prisma.spaceUser.findMany({
      where: { userId: user.sub },
      include: { space: { include: { _count: { select: { spaceUsers: true, projects: true } } } } },
      orderBy: { space: { createdAt: 'asc' } },
    });
    return spaceUsers.map((su) => su.space);
  }

  async findOne(id: string, user?: any) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: { spaceUsers: { include: { user: true } }, projects: true },
    });
    if (!space) throw new NotFoundException('Пространство не найдено');
    if (user && !user.isSuperAdmin) {
      const isMember = space.spaceUsers.some((su) => su.userId === user.sub);
      if (!isMember) throw new ForbiddenException('Нет доступа к этому пространству');
    }
    return space;
  }

  async create(dto: CreateSpaceDto) {
    const exists = await this.prisma.space.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException('Пространство с таким именем уже существует');
    return this.prisma.space.create({ data: dto });
  }

  async update(id: string, dto: Partial<CreateSpaceDto>) {
    await this.findOne(id);
    return this.prisma.space.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.space.delete({ where: { id } });
    return { ok: true };
  }

  async addMember(spaceId: string, dto: AddSpaceMemberDto) {
    await this.findOne(spaceId);
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const existing = await this.prisma.spaceUser.findUnique({
      where: { userId_spaceId: { userId: dto.userId, spaceId } },
    });
    if (existing) throw new ConflictException('Пользователь уже в пространстве');

    return this.prisma.spaceUser.create({
      data: { userId: dto.userId, spaceId, role: dto.role as any },
    });
  }
}
