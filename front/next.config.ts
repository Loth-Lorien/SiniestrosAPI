import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configuración de webpack para mejor compatibilidad
  webpack: (config, { isServer }) => {
    // Optimizaciones adicionales si es necesario
    return config;
  },
};

export default nextConfig;
