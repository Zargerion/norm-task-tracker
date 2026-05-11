import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, AddProjectMemberDto } from './dto/project.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SpaceRole } from '../common/enums/role.enum';

@Controller('spaces/:spaceId/projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private projects: ProjectsService) {}

  @Get()
  findAll(@Param('spaceId') spaceId: string) {
    return this.projects.findAll(spaceId);
  }

  @Get(':id')
  findOne(@Param('spaceId') spaceId: string, @Param('id') id: string) {
    return this.projects.findOne(spaceId, id);
  }

  @Post()
  @Roles(SpaceRole.MANAGER)
  create(@Param('spaceId') spaceId: string, @Body() dto: CreateProjectDto) {
    return this.projects.create(spaceId, dto);
  }

  @Patch(':id')
  @Roles(SpaceRole.MANAGER)
  update(@Param('spaceId') spaceId: string, @Param('id') id: string, @Body() dto: Partial<CreateProjectDto>) {
    return this.projects.update(spaceId, id, dto);
  }

  @Delete(':id')
  @Roles(SpaceRole.ADMIN)
  remove(@Param('spaceId') spaceId: string, @Param('id') id: string) {
    return this.projects.remove(spaceId, id);
  }

  @Post(':id/members')
  @Roles(SpaceRole.MANAGER)
  addMember(@Param('spaceId') spaceId: string, @Param('id') id: string, @Body() dto: AddProjectMemberDto) {
    return this.projects.addMember(spaceId, id, dto);
  }

  @Delete(':id/members/:userId')
  @Roles(SpaceRole.ADMIN)
  removeMember(@Param('spaceId') spaceId: string, @Param('id') id: string, @Param('userId') userId: string) {
    return this.projects.removeMember(spaceId, id, userId);
  }
}
