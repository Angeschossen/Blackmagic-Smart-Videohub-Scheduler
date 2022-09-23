import { PrismaClient } from "@prisma/client";
import express from "express";
import next from "next";

const hubs = [];
const prisma = new PrismaClient();
loadData();

const app = next({ dev: true })
const handler: any = app.getRequestHandler()

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
