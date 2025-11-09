import { NextRequest } from 'next/server';
import { getBucket, deleteFile } from '@/server/media/gridfs';
import { requireRoleAtLeast } from '@/server/auth/guard';
import { ObjectId } from 'mongodb';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = new ObjectId(idParam);
  const files = await getBucket().find({ _id: id }).toArray();
  if (!files[0]) return new Response('Not found', { status: 404 });
  const file = files[0];
  const stream = getBucket().openDownloadStream(id);
  const headers = new Headers();
  if (file.contentType) headers.set('Content-Type', file.contentType);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(stream as any, { headers });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireRoleAtLeast('professor');
  const { id } = await params;
  await deleteFile(id);
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}
