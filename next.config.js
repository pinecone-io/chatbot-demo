/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {
    apiUrl: process.env.API_URL || "http://localhost:3000",
  },
};

module.exports = nextConfig;
