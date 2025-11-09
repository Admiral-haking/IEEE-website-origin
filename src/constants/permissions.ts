export const PERMISSION_KEYS = [
  'content.pages',
  'content.team',
  'content.solutions',
  'content.capabilities',
  'content.blog',
  'content.caseStudies',
  'content.jobs',
  'content.events',
  'content.media',
  'content.projects',
  'operations.membership',
  'operations.contact',
  'operations.chatModeration',
  'operations.notifications',
  'admin.users',
  'admin.permissions',
  'admin.stats',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type PermissionDefinition = {
  key: PermissionKey;
  labelKey: string;
  descriptionKey?: string;
  aliases?: string[];
};

export type PermissionGroup = {
  key: 'content' | 'operations' | 'administration';
  labelKey: string;
  descriptionKey?: string;
  permissions: PermissionDefinition[];
};

const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  { key: 'content.pages', labelKey: 'perm_pages', descriptionKey: 'perm_pages_desc' },
  { key: 'content.team', labelKey: 'perm_team', descriptionKey: 'perm_team_desc' },
  { key: 'content.solutions', labelKey: 'perm_solutions', descriptionKey: 'perm_solutions_desc' },
  { key: 'content.capabilities', labelKey: 'perm_capabilities', descriptionKey: 'perm_capabilities_desc' },
  { key: 'content.blog', labelKey: 'perm_blog', descriptionKey: 'perm_blog_desc' },
  { key: 'content.caseStudies', labelKey: 'perm_case_studies', descriptionKey: 'perm_case_studies_desc' },
  { key: 'content.jobs', labelKey: 'perm_jobs', descriptionKey: 'perm_jobs_desc' },
  { key: 'content.events', labelKey: 'perm_events', descriptionKey: 'perm_events_desc' },
  { key: 'content.media', labelKey: 'perm_media', descriptionKey: 'perm_media_desc' },
  {
    key: 'content.projects',
    labelKey: 'perm_projects',
    descriptionKey: 'perm_projects_desc',
    aliases: ['canEditProjects'],
  },
  { key: 'operations.membership', labelKey: 'perm_membership', descriptionKey: 'perm_membership_desc' },
  { key: 'operations.contact', labelKey: 'perm_contact', descriptionKey: 'perm_contact_desc' },
  {
    key: 'operations.chatModeration',
    labelKey: 'perm_chat',
    descriptionKey: 'perm_chat_desc',
    aliases: ['canModerateChat'],
  },
  { key: 'operations.notifications', labelKey: 'perm_notifications', descriptionKey: 'perm_notifications_desc' },
  { key: 'admin.users', labelKey: 'perm_users', descriptionKey: 'perm_users_desc' },
  { key: 'admin.permissions', labelKey: 'perm_permissions', descriptionKey: 'perm_permissions_desc' },
  { key: 'admin.stats', labelKey: 'perm_stats', descriptionKey: 'perm_stats_desc' },
];

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'content',
    labelKey: 'perm_group_content',
    descriptionKey: 'perm_group_content_desc',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.key.startsWith('content.')),
  },
  {
    key: 'operations',
    labelKey: 'perm_group_operations',
    descriptionKey: 'perm_group_operations_desc',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.key.startsWith('operations.')),
  },
  {
    key: 'administration',
    labelKey: 'perm_group_admin',
    descriptionKey: 'perm_group_admin_desc',
    permissions: PERMISSION_DEFINITIONS.filter((p) => p.key.startsWith('admin.')),
  },
];

const ALIAS_MAP: Record<PermissionKey, string[]> = PERMISSION_DEFINITIONS.reduce((acc, def) => {
  acc[def.key] = [def.key, ...(def.aliases || [])];
  return acc;
}, {} as Record<PermissionKey, string[]>);

export const EXECUTIVE_AREA_PERMISSIONS: PermissionKey[] = [
  'content.pages',
  'content.team',
  'content.solutions',
  'content.capabilities',
  'content.blog',
  'content.caseStudies',
  'content.jobs',
  'content.events',
  'content.media',
  'content.projects',
  'operations.membership',
  'operations.contact',
  'operations.chatModeration',
  'operations.notifications',
];

export const ADMIN_AREA_PERMISSIONS: PermissionKey[] = [
  ...EXECUTIVE_AREA_PERMISSIONS,
  'admin.users',
  'admin.permissions',
  'admin.stats',
];

export function listPermissionKeys(): PermissionKey[] {
  return [...PERMISSION_KEYS];
}

export function getPermissionDefinition(key: PermissionKey): PermissionDefinition {
  const def = PERMISSION_DEFINITIONS.find((p) => p.key === key);
  if (!def) throw new Error(`Unknown permission: ${key}`);
  return def;
}

export function hasPermission(record: Record<string, any> | null | undefined, key: PermissionKey): boolean {
  if (!record) return false;
  const aliases = ALIAS_MAP[key] || [key];
  return aliases.some((alias) => record[alias] === true);
}

export function togglePermission(
  record: Record<string, any> | null | undefined,
  key: PermissionKey,
  value: boolean,
): Record<string, any> {
  const next: Record<string, any> = { ...(record || {}) };
  const aliases = ALIAS_MAP[key] || [key];
  aliases.forEach((alias, index) => {
    if (value) {
      next[alias] = true;
      if (index === 0) next[alias] = true;
    } else {
      if (alias === key) {
        next[alias] = false;
      } else {
        delete next[alias];
      }
    }
  });
  if (!value) {
    // Remove primary key entirely when false to keep payload compact
    delete next[key];
  } else {
    next[key] = true;
  }
  return next;
}

export function anyPermission(record: Record<string, any> | null | undefined, keys: PermissionKey[]): boolean {
  return keys.some((key) => hasPermission(record, key));
}
