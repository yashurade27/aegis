/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack(config, { isServer, dev }) {
    config.experiments = { ...config.experiments, asyncWebAssembly: false };
    return config;
  },
};

module.exports = nextConfig;
