import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Sin configuraciones exóticas: desplegable en Vercel tal cual.
  // El análisis de URLs se ejecuta en una Route Handler con runtime Node.js.
};

export default nextConfig;
