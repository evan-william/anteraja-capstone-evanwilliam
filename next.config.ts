import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: { qualities: [75, 82, 84] },
  // Matikan pembuatan file panduan agent otomatis di root project.
  agentRules: false,
  // Memungkinkan CI/QA memakai folder build terpisah saat `.next` sedang
  // dipakai dev server. Default produksi tetap `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
