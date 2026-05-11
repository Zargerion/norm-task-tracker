import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { CreateSpaceDto, AddSpaceMemberDto } from './dto/create-space.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SuperAdminOnly } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('spaces')
@UseGuards(JwtAuthGuard)
export class SpacesController {
  constructor(private spaces: SpacesService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.spaces.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.spaces.findOne(id, user);
  }

  @Post()
  @SuperAdminOnly()
  create(@Body() dto: CreateSpaceDto) {
    return this.spaces.create(dto);
  }

  @Patch(':id')
  @SuperAdminOnly()
  update(@Param('id') id: string, @Body() dto: Partial<CreateSpaceDto>) {
    return this.spaces.update(id, dto);
  }

  @Delete(':id')
  @SuperAdminOnly()
  remove(@Param('id') id: string) {
    return this.spaces.remove(id);
  }

  @Post(':id/members')
  @SuperAdminOnly()
  addMember(@Param('id') id: string, @Body() dto: AddSpaceMemberDto) {
    return this.spaces.addMember(id, dto);
  }
}
