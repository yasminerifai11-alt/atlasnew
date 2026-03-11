/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@atlas-command/types", "@atlas-command/db"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // MapLibre GL requires this for SSR
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "maplibre-gl": "maplibre-gl/dist/maplibre-gl.js",
    };
    return config;
  },
};

module.exports = nextConfig;
