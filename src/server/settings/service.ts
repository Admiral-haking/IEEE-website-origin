import Setting from '@/models/Setting';

type Features = {
  assistEnabled: boolean;
  vitalsClientEnabled: boolean;
  vitalsServerEnabled: boolean;
  chatEnabled: boolean;
  notificationsEmailEnabled: boolean;
  contact: { captchaProvider: 'none'|'turnstile'|'hcaptcha' };
  security?: {
    strictForeignIp?: boolean;
  };
  ai?: { enabled: boolean; provider?: 'openai'|'deepseek'|'other'|'none'; defaultModels?: { openai?: string; deepseek?: string } };
  auth: {
    emailPasswordEnabled: boolean;
    phoneOtpEnabled: boolean;
    signupEnabled: boolean;
    passwordResetEnabled: boolean;
    usernameLoginEnabled: boolean;
  };
  ui?: {
    hyperspeed?: {
      enabled: boolean;
      distortion: 'turbulentDistortion'|'mountainDistortion'|'xyDistortion'|'LongRaceDistortion'|'deepDistortion'|'turbulentDistortionStill'|'deepDistortionStill';
      length?: number;
      roadWidth?: number;
      islandWidth?: number;
      colors?: Partial<{
        background: string|number;
        sticks: string|number;
        leftCars: Array<string|number>;
        rightCars: Array<string|number>;
        roadColor: string|number;
        islandColor: string|number;
        shoulderLines: string|number;
        brokenLines: string|number;
      }>;
    }
    team?: {
      chipColors?: Partial<Record<'software'|'hardware'|'networking'|'computer', 'default'|'primary'|'secondary'|'success'|'info'|'warning'|'error'>>;
      iconColors?: Partial<Record<'software'|'hardware'|'networking'|'computer', 'inherit'|'primary'|'secondary'|'success'|'info'|'warning'|'error'>>;
      iconNames?: Partial<Record<'software'|'hardware'|'networking'|'computer', string>>;
      groupOrder?: string[];
    }
  };
};

const isOff = (v: string | undefined) => v === '0' || v === 'false' || v === 'off' || v === 'no';
const isOn = (v: string | undefined) => v === '1' || v === 'true' || v === 'on' || v === 'yes';

function defaultFeatures(): Features {
  const captcha: 'none'|'turnstile'|'hcaptcha' = process.env.TURNSTILE_SECRET_KEY
    ? 'turnstile'
    : (process.env.HCAPTCHA_SECRET ? 'hcaptcha' : 'none');
  const aiProvider = process.env.OPENAI_API_KEY ? 'openai' : (process.env.DEEPSEEK_API_KEY ? 'deepseek' : 'none');
  const smsAvailable = !!((process.env.SMS_API_URL || process.env.SHAPARAK_SMS_URL) && (process.env.SMS_API_KEY || process.env.SHAPARAK_SMS_KEY));
  const strictForeignIp = isOn(process.env.SEC_STRICT_FOREIGN_IP);
  return {
    assistEnabled: isOn(process.env.NEXT_PUBLIC_ENABLE_ASSIST) && !isOff(process.env.NEXT_PUBLIC_ENABLE_ASSIST),
    vitalsClientEnabled: !isOff(process.env.NEXT_PUBLIC_ENABLE_VITALS) /* default true */,
    vitalsServerEnabled: !isOff(process.env.OPS_VITALS_ENABLED) /* default true */,
    chatEnabled: !(process.env.CHAT_DISABLED === '1' || process.env.CHAT_DISABLED === 'true'),
    notificationsEmailEnabled: !(process.env.NOTIFICATIONS_EMAIL_ENABLED === '0' || process.env.NOTIFICATIONS_EMAIL_ENABLED === 'false'),
    contact: { captchaProvider: captcha },
    security: { strictForeignIp },
    ai: { enabled: aiProvider !== 'none', provider: aiProvider as any, defaultModels: { openai: 'gpt-4o-mini', deepseek: 'deepseek-chat' } },
    auth: {
      emailPasswordEnabled: true,
      phoneOtpEnabled: smsAvailable,
      signupEnabled: true,
      passwordResetEnabled: true,
      usernameLoginEnabled: true,
    },
    ui: {
      hyperspeed: {
        enabled: false,
        distortion: 'turbulentDistortion',
        length: 420,
        roadWidth: 12,
        islandWidth: 2,
        colors: {
          background: '#000000',
          sticks: '#03b3c3',
          leftCars: ['#d856bf', '#6750a2', '#c247ac'],
          rightCars: ['#03b3c3', '#0e5ea5', '#324555'],
          roadColor: '#080808',
          islandColor: '#0a0a0a',
          shoulderLines: '#ffffff',
          brokenLines: '#ffffff',
        }
      },
      team: {
        chipColors: { software: 'primary', hardware: 'success', networking: 'info', computer: 'primary' },
        iconColors: { software: 'primary', hardware: 'success', networking: 'info', computer: 'primary' },
        iconNames: { software: 'code', hardware: 'memory', networking: 'router', computer: 'computer' },
        groupOrder: ['software','hardware','networking','computer']
      }
    }
  };
}

let cache: { features: Features; at: number } | null = null;
const TTL_MS = 5000;

export async function getFeatures(): Promise<Features> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.features;
  let doc: any = null;
  try {
    doc = await Setting.findOne({ key: 'features' }).lean<any>();
  } catch {}
  const base = defaultFeatures();
  const merged: Features = { ...base, ...(doc?.value || {}) } as Features;
  cache = { features: merged, at: now };
  return merged;
}

function deepMerge<T>(base: T, patch: Partial<T>): T {
  const out: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const [k, v] of Object.entries(patch as any)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof (out as any)[k] === 'object' && (out as any)[k] !== null) {
      (out as any)[k] = deepMerge((out as any)[k], v);
    } else {
      (out as any)[k] = v;
    }
  }
  return out as T;
}

export async function updateFeatures(patch: Partial<Features>) {
  const current = await getFeatures();
  const next = deepMerge(current, patch);
  await Setting.updateOne(
    { key: 'features' },
    { $set: { value: next } },
    { upsert: true }
  );
  cache = { features: next as Features, at: Date.now() };
  return next as Features;
}

export async function isFeatureEnabled(name: keyof Features): Promise<boolean> {
  const f = await getFeatures();
  return Boolean((f as any)[name]);
}
