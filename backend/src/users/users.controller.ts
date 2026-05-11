import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { UploadService } from '../upload/upload.service';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, SuperAdminOnly } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SpaceRole } from '../common/enums/role.enum';

@Controller()
export class UsersController {
  constructor(
    private users: UsersService,
    private upload: UploadService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.users.register(dto);
  }

  @Public()
  @Get('register/status/:id')
  registrationStatus(@Param('id') id: string) {
    return this.users.getRegistrationStatus(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('users/me')
  updateMe(@CurrentUser('sub') userId: string, @Body() body: any) {
    return this.users.updateMe(userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('users/me/avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new BadRequestException('Разрешены только jpg, png, webp'), false);
    },
  }))
  async uploadAvatar(@CurrentUser('sub') userId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не передан');
    const { url } = await this.upload.save(file);
    return this.users.setAvatar(userId, url);
  }

  @UseGuards(JwtAuthGuard)
  @SuperAdminOnly()
  @Get('users/all')
  getAllUsers() {
    return this.users.getAllUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('spaces/:spaceId/users')
  getSpaceUsers(@Param('spaceId') spaceId: string) {
    return this.users.getSpaceUsers(spaceId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SpaceRole.ADMIN)
  @Patch('spaces/:spaceId/users/:userId')
  updateSpaceUser(
    @Param('spaceId') spaceId: string,
    @Param('userId') userId: string,
    @Body() body: { role?: string; description?: string },
  ) {
    return this.users.updateSpaceUser(spaceId, userId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SpaceRole.ADMIN)
  @Delete('spaces/:spaceId/users/:userId')
  removeFromSpace(@Param('spaceId') spaceId: string, @Param('userId') userId: string) {
    return this.users.removeFromSpace(spaceId, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('spaces/:spaceId/users/:userId/stats')
  getUserStats(@Param('spaceId') spaceId: string, @Param('userId') userId: string) {
    return this.users.getUserStats(spaceId, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('spaces/:spaceId/users/:userId/completed-tasks')
  getUserCompletedTasks(@Param('spaceId') spaceId: string, @Param('userId') userId: string) {
    return this.users.getUserCompletedTasks(spaceId, userId);
  }
}
