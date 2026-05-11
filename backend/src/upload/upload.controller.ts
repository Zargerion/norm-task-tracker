import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new BadRequestException('Разрешены только изображения (jpg, png, webp, gif)'), false);
    },
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не передан');
    return this.uploadService.save(file);
  }
}
