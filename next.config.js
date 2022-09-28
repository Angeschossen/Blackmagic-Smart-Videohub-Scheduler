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
  const videohubs = require('./components/interfaces/videohub/videohubs');
  await videohubs.loadData()
  videohubs.connect();
  console.log("Init done.");
  return nextConfig;
};