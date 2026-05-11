import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY, SUPER_ADMIN_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SpaceRole, hasRoleOrHigher } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const superAdminOnly = this.reflector.getAllAndOverride<boolean>(SUPER_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredRoles = this.reflector.getAllAndOverride<SpaceRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;
    if (user.isSuperAdmin) return true;
    if (superAdminOnly) throw new ForbiddenException('Только для супер-администратора');

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const spaceId = request.params?.spaceId;
    if (!spaceId) return true;

    const spaceUser = await this.prisma.spaceUser.findUnique({
      where: { userId_spaceId: { userId: user.sub, spaceId } },
    });

    if (!spaceUser) throw new ForbiddenException('Нет доступа к этому пространству');

    const minRequired = requiredRoles.reduce((min, role) => {
      const h = { ADMIN: 3, MANAGER: 2, EMPLOYEE: 1 };
      return h[role] < h[min] ? role : min;
    }, requiredRoles[0]);

    if (!hasRoleOrHigher(spaceUser.role as SpaceRole, minRequired)) {
      throw new ForbiddenException('Недостаточно прав');
    }

    request.spaceUser = spaceUser;
    return true;
  }
}
