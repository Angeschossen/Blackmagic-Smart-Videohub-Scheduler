const { CollectionsOutlined } = require('@mui/icons-material');
const net = require('net');
const { start } = require('repl');
const prisma = require('../database/prisma');
const dateutils = require('../utils/dateutils');

const VIDEOHUB_PORT = 9990;

const REQUEST_TIMEOUT= 5000;
const REQUEST_RECONNECT_GRACE_TIME= 2000;

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

async function retrieveEvents(videohub_id, output_id, date_start, date_end, inclusive) {
    const filter_base = output_id == undefined ?
        {
            videohub_id: videohub_id,
        } :
        {
            videohub_id: videohub_id,
            output_id: output_id,
        };


    const differenceDays = dateutils.dateDiffInDays(date_start, date_end);

    const start_DayOfWeek = date_start.getDay();
    const end_DayOfWeek = date_end.getDay();

    const filter_repeat = differenceDays >= 6 ? {
        repeat_every_week: true
    } : {
        repeat_every_week: true,
        day_of_week: {
            gte: start_DayOfWeek,
            lte: end_DayOfWeek,
        }
    };

    const e = await prisma.client.event.findMany({
        where: {
            AND: [
                filter_base,
                {
                    OR: [
                        filter_repeat,
                        {
                            start: {
                                lte: date_start,
                            },
                            end: {
                                gte: date_end,
                            }
                        },
                        {
                            start: {
                                gte: date_start,
                                lte: date_end,
                            },
                            end: {
                                lte: date_end,
                                gte: date_start,
                            }

                        },
                    ]
                }
            ]
        }
    });

    const arr = [];
    const weeks = Math.max(1, Math.round(differenceDays / 7));
    for (const event of e) {
        event.event_id = event.id;

        if (event.repeat_every_week != undefined) { // is repeat
            let event_start = new Date(event.start);
            let event_end = new Date(event.end);

            // initial
            let startIndex;
            if (!dateutils.isSameWeek(event_start, date_start)) { // adjust?
                startIndex = 0;
                const event_duration = event_end.getTime() - event_start.getTime();
                event_start = adjustDate(date_start, event_start, event.day_of_week);
                event_end = new Date(event_start.getTime() + event_duration);
            } else {
                startIndex = 0;
            }

            for (let i = startIndex; i < weeks; i++) {
                const eventFinal = Object.assign({}, event);
                eventFinal.event_id = event.id + "_" + (i + 1);
                eventFinal.start = event_start;
                eventFinal.end = event_end;

                event_start = new Date(eventFinal.start);
                event_end = new Date(eventFinal.end);
                event_start.setDate(event_start.getDate() + 7);
                event_end.setDate(event_end.getDate() + 7);

                if (!inclusive || (date_start >= event_start && date_end <= event_end)) {
                    arr.push(eventFinal);
                }
            }
        } else {
            arr.push(event); // always add
        }
    }

    return arr;
}

function adjustDate(fromDate, date, weekDay) {
    const newDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
    dateutils.setDayOfWeek(newDate, weekDay);
    return newDate;
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
    constructor(output_id, input_id, onSuccess) {
        this.output_id = output_id;
        this.input_id = input_id;
        this.onSuccess = onSuccess;
        this.result = false;
    }

    send(videohub) {
        const send = `${PROTOCOL_VIDEO_OUTPUT_ROUTING}\n${this.output_id} ${this.input_id}\n\n`
        videohub.info(`Sending routing update: ${send}`);
        videohub.client.write(send);
        videohub.requestQueque.push(this);
        videohub.info("Routing update sent.");
    }
}
class Output {
    constructor(id, label) {
        this.id = id;
        this.label = label;
        this.input_id = undefined;
    }

    updateRouting(videohub, input_id) {
        videohub.info(`Updating routing: ${input_id} -> ${this.id}`);
        this.input_id = input_id;
    }

    sendRoutingUpdateRequest(videohub, input_id) {
        // prepare
        let _resolve;
        let request;
        request = new InputChangeRequest(this.id, input_id, () => {
            this.updateRouting(videohub, input_id);
            this.save(videohub);
            request.result = true;
            videohub.removeRequest(request);
            _resolve(undefined);
        });

        // register and send
        if (!videohub.data.connected) {
            setTimeout(() => {
                if (videohub.data.connected) {
                    request.send(videohub);
                }else{
                    _resolve("Videohub not reachable.");
                }
            }, REQUEST_RECONNECT_GRACE_TIME);
        } else {
            request.send(videohub);
        }

        // handle res with timeout
        const promise = new Promise((resolve) => {
            _resolve = resolve;
            setTimeout(() => {
                videohub.removeRequest(request);
                resolve(request.result ? undefined : "Request timed out.");
            }, REQUEST_TIMEOUT);
        });

        return promise;
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
        this.requestQueque = [];
        this.data.connected = false;
    }

    addRequest(request) {
        this.requestQueque.push(request);
    }
    
    removeRequest(request) {
        let index;
        for (let i = 0; i < this.requestQueque.length; i++) {
            if (this.requestQueque === request) {
                index = i;
                break;
            }
        }

        if (index != undefined) {
            this.requestQueque.splice(index, 1);
        }
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
        return this.client != undefined || this.connecting || this.data.connected;
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
        }, 30000);
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

        const events = await retrieveEvents(this.data.id, undefined, date_start, date_end, true);
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
            if (this.requestQueque.length == 0) {
                throw Error("Got " + PROTOCOL_ACKNOWLEDGED + ", but no request sent.");
            }

            const request = this.requestQueque.shift();
            request.onSuccess.call();

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
    getClient: function (id) {
        for (const client of hubs) {
            if (client.data.id === id) {
                return client;
            }
        }
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
            // turn into objects
            for (let i = 0; i < e.outputs.length; i++) {
                const output = e.outputs[i]
                e.outputs[i] = new Output(output.id, output.label);

                const input = e.inputs[i];
                e.inputs[i] = new Input(input.id, input.label);
            }

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
    },
    retrieveEvents: retrieveEvents,
    sendRoutingUpdate: function (request) {
        const videohubClient = module.exports.getClient(request.videohub_id);
        if (videohubClient == undefined) {
            throw Error("Client not found: " + request.videohub_id);
        }

        const output = videohubClient.getOutput(request.output_id);
        return output.sendRoutingUpdateRequest(videohubClient, request.input_id);
    }
}

