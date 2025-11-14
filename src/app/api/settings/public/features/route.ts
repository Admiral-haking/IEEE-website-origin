import { NextResponse } from 'next/server';
import { getFeatures } from '@/server/settings/service';

export async function GET() {
  const f = await getFeatures();
  return NextResponse.json({
    assistEnabled: !!f.assistEnabled,
    vitalsEnabled: !!f.vitalsClientEnabled,
    chatEnabled: !!f.chatEnabled,
    contact: { captchaProvider: f.contact.captchaProvider },
    auth: {
      emailPasswordEnabled: !!f.auth.emailPasswordEnabled,
      phoneOtpEnabled: !!f.auth.phoneOtpEnabled,
      signupEnabled: !!f.auth.signupEnabled,
      passwordResetEnabled: !!f.auth.passwordResetEnabled,
      usernameLoginEnabled: !!f.auth.usernameLoginEnabled,
    },
    ai: { enabled: !!(f.ai && (f.ai as any).enabled), provider: (f.ai && (f.ai as any).provider) || 'none', defaultModels: ((f.ai as any)?.defaultModels) || { openai: 'gpt-4o-mini', deepseek: 'deepseek-chat' } },
    ui: {
      hyperspeed: {
        enabled: !!(f.ui as any)?.hyperspeed?.enabled,
        distortion: ((f.ui as any)?.hyperspeed?.distortion) || 'turbulentDistortion',
        length: (f.ui as any)?.hyperspeed?.length,
        roadWidth: (f.ui as any)?.hyperspeed?.roadWidth,
        islandWidth: (f.ui as any)?.hyperspeed?.islandWidth,
        colors: (f.ui as any)?.hyperspeed?.colors || null,
      },
      team: {
        chipColors: (f.ui as any)?.team?.chipColors || null,
        iconColors: (f.ui as any)?.team?.iconColors || null,
        iconNames: (f.ui as any)?.team?.iconNames || null,
        groupOrder: (f.ui as any)?.team?.groupOrder || null,
      }
    }
  });
}
