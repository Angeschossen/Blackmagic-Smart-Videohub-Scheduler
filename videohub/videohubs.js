const { textAlign } = require('@mui/system');
const { info } = require('console');
const net = require('net');
const { threadId } = require('worker_threads');
const prisma = require('../database/prisma');

const VIDEOHUB_PORT = 9990;

const PROTOCOL_INPUT_LABELS = "INPUT LABELS:"
const PROTOCOL_PREAMPLE = "PROTOCOL PREAMPLE:"
const PROTOCOL_VIDEOHUB_DEVICE = "VIDEOHUB DEVICE:"
const PROTOCOL_OUTPUT_LABELS = "OUTPUT LABELS:"
const PROTOCOL_VIDEO_OUTPUT_ROUTING = "VIDEO OUTPUT ROUTING:"
const PROTOCOL_FRIENDLY_NAME = "Friendly name:"
const PROTOCOL_LATEST_VERSION = "2.8"

function getLines(input) {
    lines = input.split("\n");

    // thrim those lines
    for (let i = 0; i < lines.length; i++) {
        lines[i] = lines[i].trim();
    }

    return lines;
}

function getConfigEntry(lines, index) {
    const line = lines[index];
    return line.substring(line.indexOf(":") + 1).trim();
}

function getCorrespondingLines(lines, look) {
    let index = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i] === look) {
            index = i;
            break;
        }
    }

    if (index == -1) {
        throw SyntaxError("Entry not found in videohub response: " + look);
    }

    const arr = [];
    for (let i = index + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line === "") {
            break; // end
        }

        arr.push(line);
    }

    return arr;
}

class Input {
    constructor(id, label) {
        this.id = id;
        this.label = label;
    }

    async save(videohub) {
        await prisma.client.input.upsert({
            where: {
                videohubInput: {
                    videohub_id: videohub.data.id,
                    id: this.id,
                }
            },
            create: {
                id: this.id,
                videohub_id: videohub.data.id,
                label: this.label,
            },
            update: {
                label: this.label,
            }
        });
    }
}

class Output {
    constructor(id, label) {
        this.id = id;
        this.label = label;
        this.input_id = undefined;
    }

    update_routing(videohub,input_id) {
        videohub.info(`Updating routing: ${input_id} -> ${this.id}`);

        if (!videohub.validate_relation(this.id, input_id)) {
            return false;
        }

        this.input_id = input_id;
        return true;
    }

    async save(videohub) {
        const input_id = this.input_id == undefined ? null : this.input_id;
        await prisma.client.output.upsert({
            where: {
                videohubOutput: {
                    videohub_id: videohub.data.id,
                    id: this.id,
                }
            },
            update: {
                input_id: input_id,
                label: this.label,
            },
            create: {
                id: this.id,
                videohub_id: videohub.data.id,
                input_id: input_id,
                label: this.label,
            }
        });
    }
}

class Videohub {
    constructor(data) {
        this.client = undefined;
        this.connecting = false;
        this.data = data;

        this.info(data);
    }

    async test() {

    }

    connect() {
        this.info("Attempting connection to videohub.");

        if (this.socket != undefined) {
            throw new Error("Already connected")
        }

        const client = new net.Socket();
        client.connect({
            port: VIDEOHUB_PORT,
            host: this.data.ip,
        }, () => {
            this.info("Successfully connected.");
            this.client = client;
            this.clearReconnect()
            //this.client.write("Hello!");
        });

        client.on("data", async data => {
            data = data.toString();
            this.info("Received:\n" + data)
            this.handle_received(data);
        })

        client.on("close", () => {
            this.info("Connection closed")
            this.reconnect()
        })

        client.on("end", () => {
            this.info("Connection ended")
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

        this.connecting = this.connect();
        this.connecting = setInterval(() => {
            this.connect();
        }, 5000);
    }

    info(msg) {
        console.info(`[#${this.data.id}] ${msg}`);
    }

    warn(msg) {
        console.warn(`[#${this.data.id}] ${msg}`)
    }

    validate_relation(output_id, input_id) {
        if (output_id >= this.data.outputs.length) {
            this.warn("Output not loaded: " + output_id);
            return false;
        }

        if (input_id >= this.data.inputs.length) {
            this.warn("Input not loaded: " + input_id);
            return false;
        }

        return true;
    }

    async update_routing(output_id, input_id) {
        if (!this.validate_relation(output_id, input_id)) {
            return false;
        }

        const output = this.data.outputs[output_id];
        if (!output.update_routing(this, input_id)) {
            return false;
        }

        await output.save();
    }

    async handle_received(text) {
        if (text.startsWith(PROTOCOL_PREAMPLE)) {
            lines = getCorrespondingLines(getLines(text), PROTOCOL_PREAMPLE);
            this.data.version = lines[1];
        } else if (text.startsWith(PROTOCOL_VIDEOHUB_DEVICE)) {
            this.info("Initial")
            this.loadInitial(text);
            await this.save();
        } else if (text.startsWith(PROTOCOL_VIDEO_OUTPUT_ROUTING)) {
            const lines = getCorrespondingLines(getLines(text), PROTOCOL_VIDEO_OUTPUT_ROUTING);

            for (const line in lines) {
                const data = line.split(" ");
                await this.update_routing(Number(data[0]), Number(data[1]));
            }
        } else {
            this.warn("Unknown message.");
        }
    }

    loadInitial(text) {
        this.info("Loading initial data.");

        const lines = getLines(text);

        // name
        this.data.name = getConfigEntry(lines, 3);

        // inputs and outputs
        this.data.inputs = [];
        getCorrespondingLines(lines, PROTOCOL_INPUT_LABELS).forEach(line=>{
            const index = line.indexOf(" ");

            this.data.inputs.push(new Input(Number(line.substring(0, index)), line.substring(index + 1)));
        });

        this.data.outputs = [];
        for (const line of getCorrespondingLines(lines, PROTOCOL_OUTPUT_LABELS)) {
            const index = line.indexOf(" ");
            this.data.outputs.push(new Output(Number(line.substring(0, index)), line.substring(index + 1)));
        }

        // mapping
        for (const line of getCorrespondingLines(lines, PROTOCOL_VIDEO_OUTPUT_ROUTING)) {
            const data = line.split(" ");

            const output_id = Number(data[0]);
            const input_id = Number(data[1]);
            if(!this.validate_relation(output_id, input_id)){
                continue;
            }

            const output = this.data.outputs[output_id];
            //output.update_routing(input_id);
        }

        this.info("Loaded initial data.");
    }

    async save() {
        this.info("Saving...");
        await prisma.client.videohub.update({
            where: {
                id: this.data.id,
            },
            data: {
                name: this.data.name,
            }
        });

        this.data.inputs.forEach(async e => {
            await e.save(this);
        });

        this.data.outputs.forEach(async e => {
            await e.save(this);
        });

        this.info("Saved.");
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
    getClients: function () {
        return hubs;
    },
    getVideohubs: function () {
        const arr = [];
        hubs.forEach(e => {
            arr.push(e.data);
        });

        return arr;
    },
    getVideohub: function (id) {
        for(const hub of hubs){
            if(hub.data.id === id){
                return hub.data;
            }
        }
 
        return undefined;
    },
    loadData: async function () {
        hubs = [];

        const arr = await prisma.client.videohub.findMany({
            include: {
                inputs: true,
                outputs: true,
            }
        });

        arr.forEach((e) => {
            hubs.push(new Videohub(e));
        });
    },
    connect: function () {
        for (const hub of hubs) {
            hub.reconnect();
        }
    }
}

