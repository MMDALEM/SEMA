import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL = process.env.API_URL || 'http://localhost:4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ریشه‌ی monorepo — جلوی هشدار «multiple lockfiles» را می‌گیرد
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
  // همه درخواست‌های /api به سرور API پروکسی می‌شوند تا کوکی‌ها same-origin بمانند
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
