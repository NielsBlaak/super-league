import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // GitHub Pages serves static files only.
  output: "export",
  trailingSlash: true,
  // The deploy workflow sets the base path to "/<repo>". It is empty on a local machine.
  basePath: process.env.PAGES_BASE_PATH || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
