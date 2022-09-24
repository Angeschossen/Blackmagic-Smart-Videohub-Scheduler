const net = require('net');

const VIDEOHUB_PORT = 9990;

class Vhub {
    constructor(id, ip, name) {
        this.id = id;
        this.ip = ip;
        this.name = name;
        this.client = undefined;
        this.connecting = false;
    }

    async test() {

    }

    connect() {
        console.log("Attempting connection to videohub.");

        if (this.socket != undefined) {
            throw new Error("Already connected")
        }

        const client = new net.Socket();
        client.connect({
            port: VIDEOHUB_PORT,
            host: this.ip,
        }, () => {
            console.log("Successfully connected.");
            this.client = client;
            this.clearReconnect()
            this.client.write("Hello!");
        });

        client.on("data", async data => {
            console.log("Received: " + data)
            await this.test();
        })

        client.on("close", () => {
            console.log("Connection closed")
            this.reconnect()
        })

        client.on("end", () => {
            console.log("Connection ended")
            this.reconnect()
        })

        client.on("error", console.error)
    }

    reconnect() {
        if (false != this.connecting) {
            return;
        }

        if (this.client != undefined) {
            this.client.removeAllListeners();
            this.client.destroy();
            this.client = undefined
        }

        this.connecting = setInterval(() => {
            this.connect();
        }, 5000);
    }

    clearReconnect() {
        if (false == this.connect) {
            return;
        }

        clearInterval(this.connecting);
        this.connecting = false;
    }
}

module.exports = {
    hubs: [],
    /*
    init: function (obj) {
        hubs = obj;
    },*/
    get: function () {
        return hubs;
    },
    loadData: async function () {
        hubs = []
        hubs.push(new Vhub(1, "127.0.0.1", "Test"));
    },
    connect: function () {
        for (const hub of hubs) {
            hub.reconnect();
        }
    }
}

