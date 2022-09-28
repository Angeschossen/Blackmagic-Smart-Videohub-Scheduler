/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
}

/*
const cron = require('node-cron');

cron.schedule('* * * * *', function () {
  console.log('Say scheduled hello')
});*/

module.exports = async (phase) => {
  console.log("Starting at phase:", phase);
  return nextConfig;
};