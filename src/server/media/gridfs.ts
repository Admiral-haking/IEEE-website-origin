import '@/lib/mongoose';
import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';

let bucket: GridFSBucket | null = null;

export function getBucket() {
  const db = mongoose.connection.db;
  if (!db) throw new Error('DB not connected');
  if (!bucket) bucket = new GridFSBucket(db, { bucketName: 'media' });
  return bucket;
}

export async function saveBase64File(name: string, contentType: string, base64: string, meta: Record<string, any> = {}) {
  const data = Buffer.from(base64, 'base64');
  const uploadStream = getBucket().openUploadStream(name, { contentType, metadata: meta });
  uploadStream.end(data);
  const file = await new Promise<any>((resolve, reject) => {
    uploadStream.on('error', reject);
    uploadStream.on('finish', resolve);
  });
  return file; // includes _id
}

export async function listFiles(limit = 50, skip = 0) {
  const files = await getBucket().find({}, { limit, skip, sort: { uploadDate: -1 } }).toArray();
  return files;
}

export async function deleteFile(id: string) {
  await getBucket().delete(new ObjectId(id));
}
