import { SetMetadata } from '@nestjs/common';
import { SpaceRole } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: SpaceRole[]) => SetMetadata(ROLES_KEY, roles);
export const SUPER_ADMIN_KEY = 'superAdminOnly';
export const SuperAdminOnly = () => SetMetadata(SUPER_ADMIN_KEY, true);
