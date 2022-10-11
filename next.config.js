/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
}

module.exports = async (phase) => {
  console.log("Starting at phase:", phase);
  return nextConfig;
};