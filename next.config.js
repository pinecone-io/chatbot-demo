/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  env: {
    FINGERPRINT: process.env.FINGERPRINTJS_API_KEY,
  },
  publicRuntimeConfig: {
    apiUrl: process.env.API_URL || "http://localhost:3000",
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
};

module.exports = nextConfig;
