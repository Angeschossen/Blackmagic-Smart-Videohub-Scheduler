const next = require('next')
const express = require('express')
const videohubs = require('./videohubs');

const app = next({ dev: true })
const handler = app.getRequestHandler()

app.prepare().then(async _res => {
    await videohubs.loadData()
    videohubs.connect()

    const server = express()
    server.all('*', handler)

    server.listen(3000)
    console.log(videohubs.get())
}).catch(error => {
    console.log(error);
});
