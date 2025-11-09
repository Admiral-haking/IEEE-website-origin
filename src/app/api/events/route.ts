import { NextRequest, NextResponse } from 'next/server';
import { requireRoleAtLeast } from '@/server/auth/guard';
import { AppError } from '@/server/errors';
import { listEvents, createEvent } from '@/server/events/service';
import { CreateEventSchema } from '@/server/events/validators';

export async function GET(req: NextRequest) {
  try {
    await requireRoleAtLeast('professor');
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || undefined;
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '10');
    const locale = (searchParams.get('locale') as 'en'|'fa') || undefined;
    const data = await listEvents({ q, page, pageSize, locale });
    return NextResponse.json(data);
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRoleAtLeast('professor');
    const json = await req.json();
    const input = CreateEventSchema.parse(json);
    const created = await createEvent(input as any);
    return NextResponse.json({ event: created }, { status: 201 });
  } catch (err: any) {
    const status = err instanceof AppError ? err.status : 400;
    return NextResponse.json({ error: err.message || 'Bad Request' }, { status });
  }
}

