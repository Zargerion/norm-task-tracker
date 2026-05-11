import { Module } from '@nestjs/common';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [MaterialsController],
  providers: [MaterialsService],
})
export class MaterialsModule {}
