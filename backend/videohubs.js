const net = require('net');
const prisma = require('../database/prisma');
const dateutils = require('../components/utils/dateutils');

const ICON_ERROR = "Error";
const ICON_CONNECTION_SUCCESS = "NetworkTower";
const ICON_SUCCESS = "Accept";

const VIDEOHUB_PORT = 9990;
const CONNECTION_HEALT_CHECK_INTERVAL = 60000;

const REQUEST_TIMEOUT = 5000;
const CLIENT_RECONNECT_INTERVAL_LOWEST = 5000;
const CLIENT_RECONNECT_ATTEMPTS_LOWEST = 6; // 30 seconds
const CLIENT_RECONNECT_INTERVAL_LOW = 120000;
const CLIENT_RECONNECT_ATTEMPTS_LOW = 11; // 10 minutes
const CLIENT_RECONNECT_INTERVAL_NORMAL = 300000;

const REQUEST_RECONNECT_GRACE_TIME = 2000;

const PROTOCOL_CONFIGURATION = "CONFIGURATION:"
const PROTOCOL_END_PRELUDE = "END PRELUDE:"
const PROTOCOL_VIDEO_OUTPUT_LOCKS = "VIDEO OUTPUT LOCKS:"

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

function getCorrespondingLines(lines, index) {
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

function checkConnection(host, port, timeout) {
    return new Promise(function (resolve, reject) {
        timeout = timeout || 10000;     // default of 10 seconds
        const timer = setTimeout(function () {
            reject("timeout");
            socket.end();
        }, timeout);

        const socket = net.createConnection(port, host, function () {
            clearTimeout(timer);
            resolve();
            socket.end();
        });

        socket.on('error', function (err) {
            clearTimeout(timer);
            reject(err);
        });
    });
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

    const condition = {
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
    };

    const e = await prisma.client.event.findMany({
        where: condition,
    });

    const arr = [];
    const weeks = Math.max(1, Math.round(differenceDays / 7));
    for (const event of e) {
        event.event_id = event.id;

        if (event.repeat_every_week) { // is repeat
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

                // re check time span
                if (event_start <= date_start && event_end >= date_end || ((event_start >= date_start && event_start <= date_end) && (event_end <= date_end && event_end >= date_start))) {
                    arr.push(eventFinal);
                }

                /*
                if (!inclusive || (date_start >= event_start && date_end <= event_end)) {
                    arr.push(eventFinal);
                } */
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
                    id: this.id, // prisma requires id to start at 1
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
        videohub.info(`Updating routing: ${this.id} ${input_id}`);
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
                } else {
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
        const vid = Number(videohub.data.id);
        const input_id = this.input_id == undefined ? null : this.input_id;
        await prisma.client.output.upsert({
            where: {
                videohubOutput: {
                    videohub_id: vid,
                    id: this.id, // prisma requires id to start at 1
                }
            },
            update: {
                input_id: input_id,
                label: this.label,
            },
            create: {
                id: this.id,
                videohub_id: vid,
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
        this.connectionAttempt = 0;
        this.checkConnectionHealthId = undefined;
    }

    async logActivity(description, icon) {
        await prisma.client.videohubActivity.create({
            data: {
                title: this.data.name,
                description: description,
                icon: icon,
                time: new Date(),
                videohub_id: this.data.id,
            }
        });
    }

    addRequest(request) {
        this.requestQueque.push(request);
    }

    checkConnectionHealth() {
        this.info("Checking connection health.");

        const hub = this;
        checkConnection(this.data.ip, VIDEOHUB_PORT, 5000).then(function () {
            hub.info("Connection is healthy.");
            hub.checkConnectionHealthId = setTimeout(() => {
                hub.checkConnectionHealth();
            }, CONNECTION_HEALT_CHECK_INTERVAL);
        }, async function (err) {
            hub.info("Videohub detected as not reachable.");
            console.error(err);
            await hub.onClose();
        });
    }

    scheduleCheckConnectionHealth() {
        clearTimeout(this.checkConnectionHealthId);
        this.checkConnectionHealth();
    }

    removeRequest(request) {
        let index;
        for (let i = 0; i < this.requestQueque.length; i++) {
            if (this.requestQueque[i] === request) {
                index = i;
                break;
            }
        }

        if (index != undefined) {
            this.requestQueque.splice(index, 1);
            this.info(`Request removed: ${request.output_id} ${request.input_id}`);
        }
    }

    async onClose() {
        clearTimeout(this.checkConnectionHealthId);
        this.clearReconnect();
        await this.reconnect();
    }

    connect(isInitial) {
        this.info(`Attempting connection to videohub (#${this.connectionAttempt}).`);

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
            this.connectionAttempt = 0;
            this.clearReconnect();
            this.scheduleCheckConnectionHealth();
            this.startEventsCheck();

            if (!isInitial) {
                await this.logActivity("Connection established.", ICON_CONNECTION_SUCCESS);
            }
        });

        client.on("data", async data => {
            data = data.toString();
            this.info("Received:\n" + data)
            await this.handle_received(data);
        })

        client.on("close", async () => {
            this.info(`Connection closed (#${this.connectionAttempt})`);
            await this.onClose()
        })

        client.on("end", async () => {
            this.info(`Connection ended (#${this.connectionAttempt})`);
            await this.onClose()
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

    async reconnect() {
        if (false != this.connecting) {
            return;
        }

        if (this.client != undefined) {
            this.client.removeAllListeners();
            this.client.destroy();
            this.client = undefined;
        }

        if (this.data.connected) {
            await this.logActivity("Connection lost.", ICON_ERROR)
        }

        this.data.connected = false;
        this.stopEventsCheck();

        this.connectionAttempt++;
        const delay = this.calculateReconnectTimeout();
        this.info(`Attempting reconnect (#${this.connectionAttempt}) in ${delay} ms.`);
        this.reconnectProccess(delay);
    }

    calculateReconnectTimeout() {
        if (this.connectionAttempt == 1) { // first
            return 0;
        } else if (this.connectionAttempt <= CLIENT_RECONNECT_ATTEMPTS_LOWEST) {
            return CLIENT_RECONNECT_INTERVAL_LOWEST;
        } else if (this.connectionAttempt <= CLIENT_RECONNECT_ATTEMPTS_LOW) {
            return CLIENT_RECONNECT_INTERVAL_LOW;
        } else {
            return CLIENT_RECONNECT_INTERVAL_NORMAL;
        }
    }

    reconnectProccess(timeout) {
        this.connecting = setTimeout(() => {
            this.connect(false);
        }, timeout);
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

            const input = this.data.inputs[shortest_id];
            output.sendRoutingUpdateRequest(this, shortest_id).then(async result => {
                const routing = `input ${input.label} to output ${output.label}.`;

                if (result != undefined) {
                    this.info(`Scheduled routing update failed. Input ${input.id} to output ${output.id}`);
                    await this.logActivity(`Scheduled routing update failed: ${routing}`, ICON_ERROR);
                } else {
                    await this.logActivity(`Scheduled routing update was successful: ${routing}`, ICON_SUCCESS);
                }
            });
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

    async handle_received(text) {
        const lines = getLines(text);

        let found = false;
        for (let i = 0; i < lines.length; i++) {
            if (!found) {
                const res = await this.proccesLine(lines, i);
                if (res != 0) {
                    i += res;
                    found = true;
                }
            } else {
                if (lines[i].length != 0) {
                    continue;
                }

                found = false;
            }
        }
    }

    async proccesLine(lines, index) {
        const text = lines[index];
        if (text.length == 0) {
            return 0;
        }

        switch (text) {
            case PROTOCOL_PREAMPLE: {
                lines = getCorrespondingLines(lines, index);
                this.data.version = getConfigEntry(lines, 0);
                await this.save();
                return 1;
            }

            case PROTOCOL_INPUT_LABELS: {
                // inputs and outputs
                this.data.inputs = [];
                getCorrespondingLines(lines, index).forEach(async line => {
                    const index = line.indexOf(" ");
                    const input = new Input(Number(line.substring(0, index)), line.substring(index + 1));
                    this.data.inputs.push(input);
                    await input.save(this)
                });

                return this.data.inputs.length;
            }

            case PROTOCOL_OUTPUT_LABELS: {
                // inputs and outputs
                this.data.outputs = [];
                getCorrespondingLines(lines, index).forEach(async line => {
                    const index = line.indexOf(" ");
                    const output = new Output(Number(line.substring(0, index)), line.substring(index + 1));
                    this.data.outputs.push(output);
                    await output.save(this)
                });

                return this.data.outputs.length;
            }

            case PROTOCOL_VIDEOHUB_DEVICE: {
                if (this.data.name === this.data.ip) {
                    const entries = getCorrespondingLines(lines, index);
                    this.data.name = getConfigEntry(entries, 2);
                    await this.save();
                }

                return 1;
            }

            case PROTOCOL_VIDEO_OUTPUT_ROUTING: {
                let i = 0;
                for (const line of getCorrespondingLines(lines, index)) {
                    const data = line.split(" ");
                    await this.updateRouting(Number(data[0]), Number(data[1]));
                    i++;
                }

                return i;
            }

            case PROTOCOL_ACKNOWLEDGED: {
                /*
                if (this.requestQueque.length == 0) {
                    throw Error("Got " + PROTOCOL_ACKNOWLEDGED + ", but no request sent.");
                }

                const request = this.requestQueque.shift();
                request.onSuccess.call(); */
                return 1;
            }

            case PROTOCOL_CONFIGURATION: {
                return 1;
            }

            case PROTOCOL_END_PRELUDE: {
                return 1;
            }

            case PROTOCOL_VIDEO_OUTPUT_LOCKS: {
                return 1;
            }

            default: {
                this.warn(`Unknown message. Start: ${text}`);
                return 0;
            }
        }
    }

    async updateRouting(output_id, input_id) {
        const output = this.getOutput(output_id);
        output.updateRouting(this, input_id);

        this.requestQueque = this.requestQueque.filter(req => {
            if (req.output_id == output_id && req.input_id == input_id) {
                request.onSuccess.call(); // remove request and call success
                return false;
            }

            return true;
        });

        await output.save(this);
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
        console.log("Loading data...");
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
                e.outputs[i] = new Output(output.id, output.label); // prisma requires id start at 1 so its off by one

                const input = e.inputs[i];
                e.inputs[i] = new Input(input.id, input.label);
            }

            hubs.push(new Videohub(e));
        });

        console.log("Initial data loaded.");
    },
    connect: async function () {
        for (const hub of hubs) {
            if (hub.isConnected()) {
                throw Error("Already connected");
            }

            hub.reconnect(true);
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

