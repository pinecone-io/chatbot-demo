/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    FINGERPRINT: process.env.FINGERPRINTJS_API_KEY,
  },
  publicRuntimeConfig: {
    apiUrl: process.env.API_URL || "http://localhost:3000",
  },
};

module.exports = nextConfig;
