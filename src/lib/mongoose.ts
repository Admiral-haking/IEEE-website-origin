import mongoose from 'mongoose';

// Strengthen global Mongoose safety defaults
mongoose.set('strictQuery', true);
mongoose.set('sanitizeFilter', true as any);
mongoose.set('runValidators', true);

const MONGODB_URI = process.env.MONGODB_URI || (process.env.NODE_ENV === 'production' ? '' : 'mongodb://127.0.0.1:27017/ieee-qut-website');

if (!MONGODB_URI) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI is required in production');
  } else {
    console.warn('MONGODB_URI is not set. DB routes will fail.');
  }
}

type MongooseGlobal = typeof globalThis & {
  _mongooseConn?: Promise<typeof mongoose>;
};

const globalWithMongoose = global as MongooseGlobal;

if (!globalWithMongoose._mongooseConn) {
  globalWithMongoose._mongooseConn = (async () => {
    if (!MONGODB_URI) return mongoose; // no-op connection
    if (mongoose.connection.readyState >= 1) return mongoose;
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    } as any);
    return mongoose;
  })();
}

export default globalWithMongoose._mongooseConn!;
