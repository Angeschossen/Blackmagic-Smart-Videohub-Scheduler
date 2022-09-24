const myModule = require('./test.js');
let val = myModule.hello(); // val is "Hello"   
console.log(val);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
}

const cron = require('node-cron');

cron.schedule('* * * * *', function () {
  console.log('Say scheduled hello')
});


module.exports = (phase) => {
  console.log("Starting at phase:", phase);
  return nextConfig;
};