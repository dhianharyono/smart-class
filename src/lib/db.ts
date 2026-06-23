import mongoose from 'mongoose';
import AdminUser from '@/models/AdminUser';
import School from '@/models/School';

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: GlobalMongoose | undefined;
}

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}
const cached = global.mongoose;

async function seedInitialData() {
  try {
    // 1. Seed AdminUser jika kosong
    const adminCount = await AdminUser.countDocuments();
    if (adminCount === 0) {
      const defaultAdmin = (process.env.ADMIN_EMAIL || 'admin@smartclass.com').toLowerCase().trim();
      await AdminUser.create({ username: defaultAdmin });
      console.log(`[SEED] Default admin user created: ${defaultAdmin}`);
    }

    // 2. Seed Sekolah default jika kosong
    const schoolCount = await School.countDocuments();
    if (schoolCount === 0) {
      const defaultSchools = ['SDN 01 Jaya', 'SMPN 02 Smart', 'SMAN 03 Class'];
      await School.insertMany(defaultSchools.map(name => ({ name })));
      console.log(`[SEED] Default schools created: ${defaultSchools.join(', ')}`);
    }
  } catch (error) {
    console.error('[SEED] Failed to seed initial database data:', error);
  }
}

async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
    // Seed initial admin & schools
    await seedInitialData();
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

