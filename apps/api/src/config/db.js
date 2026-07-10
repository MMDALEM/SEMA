import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb() {
  mongoose.set('strictQuery', true);
  // جلوگیری از تزریق عملگرهای مونگو در کوئری‌ها
  mongoose.set('sanitizeFilter', true);
  await mongoose.connect(env.mongoUri);
  console.log('✅ اتصال به MongoDB برقرار شد');
}
