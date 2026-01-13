import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 기존 설정 유지
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  },
};

export default nextConfig;