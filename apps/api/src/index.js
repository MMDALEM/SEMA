import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';

async function main() {
  await connectDb();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`🚀 SEMA API روی پورت ${env.port} در حال اجراست`);
  });
}

main().catch((err) => {
  console.error('خطا در راه‌اندازی سرور:', err);
  process.exit(1);
});
