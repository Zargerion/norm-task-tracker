import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private uploadDir: string;

  constructor(private config: ConfigService) {
    this.uploadDir = config.get('UPLOAD_DIR') ?? './uploads';
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async save(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(this.uploadDir, filename);
    fs.writeFileSync(filepath, file.buffer);
    return { url: `/uploads/${filename}`, filename };
  }
}
