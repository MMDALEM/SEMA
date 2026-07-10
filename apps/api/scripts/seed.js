/**
 * ساخت کاربر مدیر اولیه.
 * اجرا:  npm run seed   (داخل apps/api)
 */
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { generateUniqueCode } from '../src/utils/codes.js';

async function main() {
  await mongoose.connect(env.mongoUri);

  const existing = await User.findOne({ role: 'ADMIN' });
  if (existing) {
    console.log('ℹ️ کاربر مدیر از قبل وجود دارد:');
    console.log(`   نام: ${existing.firstName} ${existing.lastName}`);
    console.log(`   کد یکتا: ${existing.uniqueCode}`);
    await mongoose.disconnect();
    return;
  }

  const admin = await User.create({
    firstName: process.env.SEED_ADMIN_FIRSTNAME || 'مدیر',
    lastName: process.env.SEED_ADMIN_LASTNAME || 'سیستم',
    phone: process.env.SEED_ADMIN_PHONE || '09120000000',
    role: 'ADMIN',
    position: 'مدیر سیستم',
    uniqueCode: generateUniqueCode(),
  });

  console.log('✅ کاربر مدیر ساخته شد:');
  console.log(`   نام: ${admin.firstName} ${admin.lastName}`);
  console.log(`   شماره: ${admin.phone}`);
  console.log(`   کد یکتای ورود: ${admin.uniqueCode}`);
  console.log('   (با این کد وارد شوید؛ کد OTP در حالت توسعه در ترمینال API چاپ می‌شود)');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
