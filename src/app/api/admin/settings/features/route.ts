import { NextRequest, NextResponse } from 'next/server';
import { requireRoleOrPermission } from '@/server/auth/guard';
import { getFeatures, updateFeatures } from '@/server/settings/service';

export async function GET() {
  await requireRoleOrPermission({ minRole: 'admin', permission: 'admin.permissions' });
  const features = await getFeatures();
  return NextResponse.json({ features });
}

export async function PATCH(req: NextRequest) {
  await requireRoleOrPermission({ minRole: 'admin', permission: 'admin.permissions' });
  try {
    const body = await req.json();
    const patch = body?.features || body || {};
    // basic sanitization
    if (patch.contact && patch.contact.captchaProvider && !['none','turnstile','hcaptcha'].includes(patch.contact.captchaProvider)) {
      patch.contact.captchaProvider = 'none';
    }
    if (patch.ai && patch.ai.provider && !['none','openai','deepseek','other'].includes(patch.ai.provider)) {
      patch.ai.provider = 'none';
    }
    if (patch.ai && patch.ai.defaultModels) {
      const dm = patch.ai.defaultModels as any;
      if (dm.openai && typeof dm.openai !== 'string') delete dm.openai;
      if (dm.deepseek && typeof dm.deepseek !== 'string') delete dm.deepseek;
    }
    if (patch.ui && patch.ui.hyperspeed) {
      const hs = patch.ui.hyperspeed as any;
      const allowed = ['turbulentDistortion','mountainDistortion','xyDistortion','LongRaceDistortion','deepDistortion','turbulentDistortionStill','deepDistortionStill'];
      if (hs.distortion && !allowed.includes(hs.distortion)) hs.distortion = 'turbulentDistortion';
      const numeric = ['length','roadWidth','islandWidth'];
      numeric.forEach((k) => { if (hs[k] != null) hs[k] = Number(hs[k]); });
      // Colors can be hex string or number; keep as provided
    }
    if (patch.ui && patch.ui.team) {
      const team = patch.ui.team as any;
      if (team.chipColors) {
        const allowedColors = new Set(['default','primary','secondary','success','info','warning','error']);
        ['software','hardware','networking','computer'].forEach((k) => {
          if (team.chipColors[k] && !allowedColors.has(team.chipColors[k])) delete team.chipColors[k];
        });
      }
      if (team.iconColors) {
        const allowed = new Set(['inherit','primary','secondary','success','info','warning','error']);
        ['software','hardware','networking','computer'].forEach((k) => { if (team.iconColors[k] && !allowed.has(team.iconColors[k])) delete team.iconColors[k]; });
      }
      if (team.iconNames) {
        ['software','hardware','networking','computer'].forEach((k) => { if (team.iconNames[k] && typeof team.iconNames[k] !== 'string') delete team.iconNames[k]; });
      }
      if (team.groupOrder && !Array.isArray(team.groupOrder)) delete team.groupOrder;
    }
    const updated = await updateFeatures(patch);
    return NextResponse.json({ features: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bad Request' }, { status: 400 });
  }
}
