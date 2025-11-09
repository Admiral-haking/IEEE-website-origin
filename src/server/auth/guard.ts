import { getTokenFromCookies, TokenPayload } from './jwt';
import { UnauthorizedError, ForbiddenError } from '@/server/errors';
import User from '@/models/User';
import { hasPermission as hasPermissionFlag, anyPermission as hasAnyPermission, PermissionKey, EXECUTIVE_AREA_PERMISSIONS, ADMIN_AREA_PERMISSIONS } from '@/constants/permissions';

export type Role = TokenPayload['role'];
type ExtendedRole = Role | 'user' | 'professor';

export async function requireAuth() {
  return getTokenFromCookies();
}

export async function requireRole(roles: Role[]) {
  const token = await getTokenFromCookies();
  if (!roles.includes(token.role)) throw new ForbiddenError('Insufficient role');
  return token;
}

export async function requireAdmin() {
  return requireRole(['admin']);
}

const rank: Record<ExtendedRole, number> = {
  user: 0,
  member: 1,
  volunteer: 1,
  professor: 2, // backwards compatibility
  executive: 2,
  admin: 3,
};

export async function requireRoleAtLeast(min: ExtendedRole) {
  const token = await getTokenFromCookies();
  if (rank[token.role as ExtendedRole] < rank[min]) throw new ForbiddenError('Insufficient role');
  return token;
}

async function loadUserPermissions(userId: string) {
  const u = await User.findById(userId).select('permissions role').lean();
  if (!u) throw new UnauthorizedError();
  return { role: (u as any).role as ExtendedRole, permissions: ((u as any).permissions || {}) as Record<string, any> };
}

export async function requirePermission(key: PermissionKey) {
  const token = await getTokenFromCookies();
  const role = token.role as ExtendedRole;
  // Admins/executives allowed by default
  if (rank[role] >= rank['executive']) return token;
  const { permissions } = await loadUserPermissions(token.sub);
  if (!hasPermissionFlag(permissions, key)) throw new ForbiddenError('Missing permission');
  return token;
}

type RolePermissionOptions = {
  minRole?: ExtendedRole;
  permission: PermissionKey | PermissionKey[];
};

export async function requireRoleOrPermission(options: RolePermissionOptions) {
  const token = await getTokenFromCookies();
  const role = token.role as ExtendedRole;
  if (options.minRole && rank[role] >= rank[options.minRole]) return token;
  const keys = Array.isArray(options.permission) ? options.permission : [options.permission];
  const { permissions, role: storedRole } = await loadUserPermissions(token.sub);
  const effectiveRole = storedRole || role;
  if (options.minRole && rank[effectiveRole] >= rank[options.minRole]) return token;
  const hasPerm = keys.some((key) => hasPermissionFlag(permissions, key));
  if (!hasPerm) throw new ForbiddenError('Missing permission');
  return token;
}

export async function requireExecutiveAreaAccess() {
  const token = await getTokenFromCookies();
  const role = token.role as ExtendedRole;
  if (rank[role] >= rank['executive']) return token;
  const { permissions } = await loadUserPermissions(token.sub);
  if (!hasAnyPermission(permissions, EXECUTIVE_AREA_PERMISSIONS)) {
    throw new ForbiddenError('Missing permission');
  }
  return token;
}

export async function requireAdminAreaAccess() {
  const token = await getTokenFromCookies();
  const role = token.role as ExtendedRole;
  if (rank[role] >= rank['executive']) return token;
  const { permissions } = await loadUserPermissions(token.sub);
  if (!hasAnyPermission(permissions, ADMIN_AREA_PERMISSIONS)) {
    throw new ForbiddenError('Missing permission');
  }
  return token;
}
