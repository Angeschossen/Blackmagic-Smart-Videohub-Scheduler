const net = require('net');
const prisma = require('../database/prisma');

const VIDEOHUB_PORT = 9990;

const PROTOCOL_INPUT_LABELS = "INPUT LABELS:"
const PROTOCOL_PREAMPLE = "PROTOCOL PREAMBLE:"
const PROTOCOL_ACKNOWLEDGED = "ACK";
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

class InputChangeRequest {
    constructor(output_id, input_id, callback) {
        this.output_id = output_id;
        this.input_id = input_id;
        this.callback = callback;
    }

    send(videohub) {
        const send = `${PROTOCOL_VIDEO_OUTPUT_ROUTING}\n${this.output_id} ${this.input_id}\n\n`
        videohub.info(`Sending routing update: ${send}`);
        videohub.client.write(send);
        videohub.info("Routing update sent.");
    }
}
class Output {
    constructor(id, label) {
        this.id = id;
        this.label = label;
        this.input_id = undefined;
        this.request = undefined;
    }

    updateRouting(videohub, input_id) {
        videohub.info(`Updating routing: ${input_id} -> ${this.id}`);
        this.input_id = input_id;
        this.request = undefined;
    }

    sendRoutingUpdateRequest(videohub, input_id) {
        this.request = new InputChangeRequest(this.id, input_id, () => {
            this.updateRouting(videohub, input_id);
            this.save(videohub);
        });

        videohub.lastRequest = this.request;
        this.request.send(videohub);
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
        this.lastRequest = undefined;
        this.data.connected = false;
    }

    connect(count) {
        this.info(`Attempting connection to videohub (#${count}).`);

        if (this.socket != undefined) {
            throw new Error("Already connected")
        }

        const client = new net.Socket();
        client.connect({
            port: VIDEOHUB_PORT,
            host: this.data.ip,
        }, async () => {
            this.info("Successfully connected.");
            this.client = client;
            this.data.connected = true;
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

    isConnected() {
        return this.client != undefined || this.connecting||this.data.connected;
    }

    stopEventsCheck() {
        this.info("Stopping check events.");

        if (this.checkEventsId != undefined) {
            clearTimeout(this.checkEventsId);
            this.checkEventsId = undefined;
        }
    }

    reconnect() {
        if (false != this.connecting) {
            return;
        }

        if (this.client != undefined) {
            this.client.removeAllListeners();
            this.client.destroy();
            this.client = undefined;
        }

        this.data.connected = false;
        this.stopEventsCheck();

        let count = 1;
        this.connecting = this.connect(count++);
        this.connecting = setInterval(() => {
            this.connect(count++);
        }, 5000);
    }

    info(msg) {
        console.info(`[#${this.data.id}] ${msg}`);
    }

    warn(msg) {
        console.warn(`[#${this.data.id}] ${msg}`)
    }

    async checkEvents() {
        this.info("Checking events...");

        if (this.client == undefined) {
            throw Error("Not connected");
        }

        if (this.checkEventsId != undefined) {
            throw Error("Check events already running.");
        }

        const date_start = new Date();
        const date_end = new Date(date_start.getTime() + (60 * 1000)); // plus 1 minute

        const events = await prisma.client.event.findMany({
            where: {
                AND: [
                    {
                        videohub_id: this.data.id
                    },
                    {
                        OR: [
                            {
                                AND: [
                                    {
                                        start: {
                                            lte: date_start,
                                        },
                                        end: {
                                            gte: date_end,
                                        }
                                    }
                                ]
                            },
                            {
                                start: {
                                    gte: date_start,
                                    lte: date_end,
                                }
                            },
                            {
                                end: {
                                    lte: date_end,
                                    gte: date_start,
                                }
                            }
                        ]
                    }
                ]
            }
        });

        for (const event of events) {
            const output_id = event.output_id;
            let shortest_id = event.input_id;
            let shortest_duration = event.end - event.start;

            for (const e of events) {
                if (output_id != e.output_id || e === event) {
                    continue;
                }

                const duration = e.end - e.start;
                if (duration < shortest_duration) {
                    shortest_id = e.input_id;
                    shortest_duration = duration;
                }
            }

            const output = this.getOutput(output_id);
            if (output.input_id === shortest_id) {
                continue; // already up to date
            }

            output.sendRoutingUpdateRequest(this, shortest_id);
        }

        this.checkEventsId = setTimeout(async () => {
            this.checkEventsId = undefined;
            await this.checkEvents();
        }, 60000);
    }

    getOutput(id) {
        if (id > this.data.outputs) {
            throw Error("Output does not exist.: " + id);
        }

        return this.data.outputs[id];
    }


    getInput(id) {
        if (id > this.data.inputs) {
            throw Error("Input does not exist.: " + id);
        }

        return this.data.inputs[id];
    }

    async updateRouting(output_id, input_id) {
        const output = this.getOutput(output_id);
        output.updateRouting(this, input_id);
        await output.save(this);
    }

    async handle_received(text) {
        if (text.startsWith(PROTOCOL_PREAMPLE)) {
            lines = getCorrespondingLines(getLines(text), PROTOCOL_PREAMPLE);
            this.data.version = getConfigEntry(lines, 0);
        } else if (text.startsWith(PROTOCOL_VIDEOHUB_DEVICE)) {
            this.loadInitial(text);
            await this.save();
        } else if (text.startsWith(PROTOCOL_VIDEO_OUTPUT_ROUTING)) {
            const lines = getCorrespondingLines(getLines(text), PROTOCOL_VIDEO_OUTPUT_ROUTING);

            for (const line of lines) {
                const data = line.split(" ");
                await this.updateRouting(Number(data[0]), Number(data[1]));
            }
        } else if (text.startsWith(PROTOCOL_ACKNOWLEDGED)) {
            if (this.lastRequest == undefined) {
                throw Error("Got " + PROTOCOL_ACKNOWLEDGED + ", but no request sent.");
            }

            this.lastRequest.callback.call();

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
        getCorrespondingLines(lines, PROTOCOL_INPUT_LABELS).forEach(line => {
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

            const output = this.getOutput(output_id);
            output.updateRouting(this, input_id);
        }

        this.info("Loaded initial data.");
        this.startEventsCheck();
    }

    async startEventsCheck() {
        this.stopEventsCheck();
        await this.checkEvents();
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
        for (const hub of hubs) {
            if (hub.data.id === id) {
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
    connect: async function () {
        for (const hub of hubs) {
            if (hub.isConnected()) {
                throw Error("Already connected");
            }

            hub.reconnect();
        }
    }
}

