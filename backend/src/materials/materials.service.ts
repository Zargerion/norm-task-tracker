import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaterialDto, SetMaterialAccessDto } from './dto/material.dto';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async findAll(spaceId: string, userId: string, isSuperAdmin: boolean) {
    if (isSuperAdmin) {
      return this.prisma.material.findMany({ where: { spaceId }, include: { attachments: true }, orderBy: { createdAt: 'desc' } });
    }
    return this.prisma.material.findMany({
      where: {
        spaceId,
        OR: [
          { isPublic: true },
          { isSpaceWide: true },
          { accesses: { some: { userId } } },
          { createdById: userId },
        ],
      },
      include: { attachments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOnePublic(id: string, userId?: string, isSuperAdmin?: boolean) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: { attachments: true, accesses: true },
    });
    if (!material) throw new NotFoundException('Материал не найден');

    const canAccess =
      material.isPublic ||
      isSuperAdmin ||
      (userId && (
        material.isSpaceWide ||
        material.createdById === userId ||
        material.accesses.some((a) => a.userId === userId)
      ));

    if (!canAccess) throw new ForbiddenException('Нет доступа к материалу');
    return material;
  }

  async create(spaceId: string, dto: CreateMaterialDto, userId: string) {
    return this.prisma.material.create({
      data: {
        spaceId,
        title: dto.title,
        content: dto.content,
        type: dto.type ?? 'MARKDOWN',
        isPublic: dto.isPublic ?? false,
        isSpaceWide: dto.isSpaceWide ?? false,
        createdById: userId,
      },
    });
  }

  async update(spaceId: string, id: string, dto: Partial<CreateMaterialDto>) {
    const material = await this.prisma.material.findFirst({ where: { id, spaceId } });
    if (!material) throw new NotFoundException('Материал не найден');
    return this.prisma.material.update({ where: { id }, data: dto });
  }

  async setHtmlUrl(id: string, url: string) {
    return this.prisma.material.update({ where: { id }, data: { htmlUrl: url, type: 'HTML' } });
  }

  async setAccess(materialId: string, dto: SetMaterialAccessDto) {
    await this.prisma.materialAccess.deleteMany({ where: { materialId } });
    if (dto.userIds.length) {
      await this.prisma.materialAccess.createMany({
        data: dto.userIds.map((userId) => ({ materialId, userId })),
      });
    }
    return { ok: true };
  }

  async remove(spaceId: string, id: string) {
    const material = await this.prisma.material.findFirst({ where: { id, spaceId } });
    if (!material) throw new NotFoundException('Материал не найден');
    await this.prisma.material.delete({ where: { id } });
    return { ok: true };
  }
}
