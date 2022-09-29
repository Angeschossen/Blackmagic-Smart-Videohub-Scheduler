const next = require('next')
const express = require('express')
const dotenv = require('dotenv');

const config = dotenv.config();
const app = next({ dev: config.parsed.NODE_ENV === "development" })
const handler = app.getRequestHandler()

app.prepare().then(async _res => {
    const videohubs = require('../videohubs');
    await videohubs.loadData();
    videohubs.connect();

    const server = express()
    server.all('*', handler)

    const port = config.parsed.PORT;
    server.listen(port);
    console.log(`Listening on port ${port}.`);

}).catch(error => {
    console.log(error);
});
