export enum SpaceRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export const ROLE_HIERARCHY: Record<SpaceRole, number> = {
  [SpaceRole.ADMIN]: 3,
  [SpaceRole.MANAGER]: 2,
  [SpaceRole.EMPLOYEE]: 1,
};

export function hasRoleOrHigher(userRole: SpaceRole, required: SpaceRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}
