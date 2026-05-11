import {
  Body, Controller, Delete, Get, Param, Patch, Post,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskStatusDto, AddAssigneeDto, AddAdditionDto } from './dto/task.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SpaceRole } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UploadService } from '../upload/upload.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('spaces/:spaceId/projects/:projectId/tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(
    private tasks: TasksService,
    private upload: UploadService,
    private prisma: PrismaService,
  ) {}

  @Get()
  findAll(@Param('spaceId') spaceId: string, @Param('projectId') projectId: string) {
    return this.tasks.findAll(spaceId, projectId);
  }

  @Get(':id')
  findOne(@Param('spaceId') spaceId: string, @Param('projectId') projectId: string, @Param('id') id: string) {
    return this.tasks.findOne(spaceId, projectId, id);
  }

  @Post()
  create(
    @Param('spaceId') spaceId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.tasks.create(spaceId, projectId, dto, user.sub);
  }

  @Patch(':id')
  @Roles(SpaceRole.MANAGER)
  update(
    @Param('spaceId') spaceId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateTaskDto>,
  ) {
    return this.tasks.update(spaceId, projectId, id, dto);
  }

  @Delete(':id')
  @Roles(SpaceRole.ADMIN)
  remove(@Param('spaceId') spaceId: string, @Param('projectId') projectId: string, @Param('id') id: string) {
    return this.tasks.remove(spaceId, projectId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('spaceId') spaceId: string,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.tasks.updateStatus(spaceId, projectId, id, dto.status, user);
  }

  @Post(':id/assignees')
  @Roles(SpaceRole.MANAGER)
  addAssignee(
    @Param('spaceId') spaceId: string,
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
    @Body() dto: AddAssigneeDto,
  ) {
    return this.tasks.addAssignee(spaceId, projectId, taskId, dto);
  }

  @Delete(':id/assignees/:userId')
  @Roles(SpaceRole.MANAGER)
  removeAssignee(
    @Param('spaceId') spaceId: string,
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
    @Param('userId') userId: string,
  ) {
    return this.tasks.removeAssignee(spaceId, projectId, taskId, userId);
  }

  @Post(':id/additions')
  addAddition(
    @Param('id') taskId: string,
    @Body() dto: AddAdditionDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.tasks.addAddition(taskId, userId, dto);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  async addAttachment(
    @Param('id') taskId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.upload.save(file);
    return this.prisma.taskAttachment.create({
      data: {
        taskId,
        filename: file.originalname,
        url: result.url,
        mimeType: file.mimetype,
        isImage: file.mimetype.startsWith('image/'),
        size: file.size,
      },
    });
  }

  @Get(':id/time')
  async getTotalTime(@Param('id') taskId: string) {
    const ms = await this.tasks.getTotalTime(taskId);
    return { ms, hours: Math.round((ms / 3600000) * 100) / 100 };
  }
}
