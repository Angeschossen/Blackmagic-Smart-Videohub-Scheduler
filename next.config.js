/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
}

module.exports = async (phase) => {
  console.log("Starting at phase:", phase);

  if (phase === "phase-production-server" || phase === "phase-development-server") {
    const backend = require('./backend/backend');
    await backend.setup();
  }

  return nextConfig;
};