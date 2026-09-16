import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Matikan pembuatan file panduan agent otomatis di root project.
  agentRules: false,
};

export default nextConfig;
