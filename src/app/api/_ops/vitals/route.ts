import { NextRequest, NextResponse } from 'next/server';
import { addVital, getVitals } from '@/server/ops/vitals-store';
import { getFeatures } from '@/server/settings/service';

export async function POST(req: NextRequest) {
  const f = await getFeatures();
  if (!f.vitalsServerEnabled) return NextResponse.json({ ok: false, disabled: true }, { status: 404 });
  try {
    const body = await req.json();
    // Lightweight sampling to avoid log spam
    if (Math.random() < 0.2) console.info('[vitals]', body?.name, { value: body?.value, rating: body?.rating, path: body?.pathname });
    addVital({
      name: String(body?.name || ''),
      value: Number(body?.value || 0),
      rating: String(body?.rating || ''),
      id: String(body?.id || ''),
      label: String(body?.label || ''),
      pathname: String(body?.pathname || ''),
      ts: Number(body?.ts || Date.now())
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bad Request' }, { status: 400 });
  }
}

export async function GET() {
  const f = await getFeatures();
  if (!f.vitalsServerEnabled) return NextResponse.json({ items: [], disabled: true }, { status: 404 });
  const items = getVitals();
  return NextResponse.json({ items });
}
