export const ROLE_LEVEL: Record<'volunteer'|'member'|'executive'|'admin', number> = {
  volunteer: 1,
  member: 1,
  executive: 2,
  admin: 3,
};

export type AccessRow = { role: keyof typeof ROLE_LEVEL; level: number; perms: string[] };

export const ACCESS_TABLE: AccessRow[] = [
  { role: 'volunteer', level: ROLE_LEVEL.volunteer, perms: ['profile', 'chat'] },
  { role: 'member', level: ROLE_LEVEL.member, perms: ['profile', 'chat'] },
  { role: 'executive', level: ROLE_LEVEL.executive, perms: ['content', 'operations'] },
  { role: 'admin', level: ROLE_LEVEL.admin, perms: ['content', 'operations', 'admin'] },
];
