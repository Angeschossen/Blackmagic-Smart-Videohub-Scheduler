const next = require('next')
const express = require('express')

loadData();

const hubs = [];

const app = next({ dev: true })
const handler = app.getRequestHandler()

app.prepare().then(_res => {
    const server = express()

    server.all('*', handler)

    server.listen(3000)
    console.log("ON")
}).catch(error => {
    console.log(error);
});

function loadData() {

}