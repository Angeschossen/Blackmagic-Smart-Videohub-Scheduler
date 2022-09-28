const next = require('next')
const express = require('express')
const videohubs = require('./components/interfaces/videohub/videohubs');

const app = next({ dev: false })
const handler = app.getRequestHandler()

app.prepare().then(async _res => {
    await videohubs.loadData()
    videohubs.connect()

    const server = express()
    server.all('*', handler)

    server.listen(3000)
}).catch(error => {
    console.log(error);
});
