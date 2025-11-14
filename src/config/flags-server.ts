// Server-side feature flags (non-public envs)

const isOff = (v: string | undefined) => v === '0' || v === 'false' || v === 'off' || v === 'no';

const boolEnv = (name: string, defaultValue: boolean) => {
  const v = process.env[name];
  if (v == null) return defaultValue;
  return !isOff(v);
};

export const flags = {
  vitalsEnabled: boolEnv('OPS_VITALS_ENABLED', true),
  notificationsEmailEnabled: boolEnv('NOTIFICATIONS_EMAIL_ENABLED', true),
  // server-side disable flag for chat endpoints
  chatDisabled: boolEnv('CHAT_DISABLED', false),
};
