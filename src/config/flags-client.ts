// Client-side feature flags (NEXT_PUBLIC_*)

const isOff = (v: string | undefined) => v === '0' || v === 'false' || v === 'off' || v === 'no';

const boolEnv = (name: string, defaultValue: boolean) => {
  const v = process.env[name];
  if (v == null) return defaultValue;
  return !isOff(v);
};

export const flags = {
  // UI assistant widget (default: disabled)
  assistEnabled: boolEnv('NEXT_PUBLIC_ENABLE_ASSIST', false),
  // Web Vitals reporter beacon (default: enabled)
  vitalsEnabled: boolEnv('NEXT_PUBLIC_ENABLE_VITALS', true),
  // Hide chat UI links client-side (server still uses CHAT_DISABLED)
  chatDisabled: boolEnv('NEXT_PUBLIC_DISABLE_CHAT', false),
};

