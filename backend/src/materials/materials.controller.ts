import {
  Body, Controller, Delete, Get, Param, Patch, Post,
  UploadedFile, UseGuards, UseInterceptors, Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Request } from 'express';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto, SetMaterialAccessDto } from './dto/material.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SpaceRole } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UploadService } from '../upload/upload.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class MaterialsController {
  constructor(
    private materials: MaterialsService,
    private upload: UploadService,
    private prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('spaces/:spaceId/materials')
  findAll(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: any,
  ) {
    return this.materials.findAll(spaceId, user.sub, user.isSuperAdmin);
  }

  @Public()
  @Get('materials/:id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.materials.findOnePublic(id, user?.sub, user?.isSuperAdmin);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SpaceRole.MANAGER)
  @Post('spaces/:spaceId/materials')
  create(
    @Param('spaceId') spaceId: string,
    @Body() dto: CreateMaterialDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.materials.create(spaceId, dto, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SpaceRole.MANAGER)
  @Patch('spaces/:spaceId/materials/:id')
  update(
    @Param('spaceId') spaceId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateMaterialDto>,
  ) {
    return this.materials.update(spaceId, id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SpaceRole.MANAGER)
  @Post('spaces/:spaceId/materials/:id/html')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['text/html', 'application/xhtml+xml', 'text/plain'];
      if (allowed.includes(file.mimetype) || file.originalname.match(/\.(html?|htm)$/i)) cb(null, true);
      else cb(new Error('Разрешены только HTML файлы'), false);
    },
  }))
  async uploadHtml(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const result = await this.upload.save(file);
    return this.materials.setHtmlUrl(id, result.url);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SpaceRole.MANAGER)
  @Post('spaces/:spaceId/materials/:id/attachments')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }))
  async addAttachment(@Param('id') materialId: string, @UploadedFile() file: Express.Multer.File) {
    const result = await this.upload.save(file);
    return this.prisma.materialAttachment.create({
      data: { materialId, filename: file.originalname, url: result.url, mimeType: file.mimetype, size: file.size },
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SpaceRole.MANAGER)
  @Post('spaces/:spaceId/materials/:id/access')
  setAccess(@Param('id') id: string, @Body() dto: SetMaterialAccessDto) {
    return this.materials.setAccess(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SpaceRole.ADMIN)
  @Delete('spaces/:spaceId/materials/:id')
  remove(@Param('spaceId') spaceId: string, @Param('id') id: string) {
    return this.materials.remove(spaceId, id);
  }
}
