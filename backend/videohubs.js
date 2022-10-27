const net = require('net');
const prismadb = require('../database/prisma');
const emit = require('./socketio').emit;
const pushbuttons = require('./pushbuttons');
const { retrievescheduledButton } = require('./pushbuttons');

const ICON_ERROR = "Error";
const ICON_SUCCESS = "Accept";
const ICON_CONNECTION_SUCCESS = "NetworkTower";

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
        timeout = timeout || 10000; // default of 10 seconds
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

class InputChangeRequest {
    constructor(outputs, inputs, onSuccess) {
        this.outputs = outputs;
        this.inputs = inputs;
        this.onSuccess = onSuccess;
        this.result = false;
        this.ackList = new Array(outputs.length);
    }

    /*
    ack(output, input) {
        let count = 0;

        for (let i = 0; i < this.outputs.length; i++) {
            // it can happen that a push button has two identical routing updates, if we don't use found, the request will never complete.
            if (this.outputs[i] === output && this.inputs[i] === input) {
                this.ackList[i] = true;
                count++;
            } else {
                if (this.ackList[i] === true) {
                    count++;
                }
            }
        }

        if (count >= this.ackList.length) {
            this.onSuccess();
            return true;
        }

        return false;
    } */

    send(videohub) {
        let send = `${PROTOCOL_VIDEO_OUTPUT_ROUTING}`
        for (let i = 0; i < this.outputs.length; i++) {
            send += `\n${this.outputs[i]} ${this.inputs[i]}`;
        }

        send += '\n\n';

        videohub.info(`Sending routing update: ${send}`);
        videohub.client.write(send);
        videohub.addRequest(this)
        videohub.info("Routing update sent.");
    }
}

class Output {
    constructor(videohub, id) {
        this.id = id;
        this.input_id = undefined
        this.scheduledTrigger = undefined
        this.videohub = videohub
    }

    /*
    stopSchedule() {
        clearTimeout(this.scheduledTrigger)
    } 

    async scheduleNextTrigger(date) {
        this.stopSchedule()

        const next = await this.retrieveUpcomingTriggers(date)
        if (next.length == 0) {
            return
        }

        const trigger = next[0]
        const hour = trigger.time.getUTCHours()
        const minutes = trigger.time.getUTCMinutes()
        const seconds = trigger.time.getUTCSeconds()

        const now = new Date()
        trigger.time.setTime(now.getTime())
        trigger.time.setHours(hour)
        trigger.time.setMinutes(minutes)
        trigger.time.setSeconds(seconds)

        // diff
        const diff = trigger.time - convert_date_to_utc(now)
        this.videohub.info(`Next trigger for output ${this.id} is in ${diff / 1000} second(s).`)

        this.scheduledTrigger = setTimeout(async () => {
            const actions = await prismadb.pushButtonAction.findMany({
                where: {
                    pushbutton_id: trigger.pushbutton_id
                },
                select: {
                    output_id: true,
                    input_id: true,
                }
            })

            if (actions.length === 0) {
                this.videohub.info("Scheduled button doesn't exist any longer.")
                return
            }

            const outputs = []
            const inputs = []
            for (const action of actions) {
                outputs.push(action.output_id)
                inputs.push(action.input_id)
            }

            console.log(outputs)

            this.videohub.sendRoutingUpdateRequest(outputs, inputs).then(async result => {
                if (result != undefined) {
                    await this.videohub.logActivity(`Scheduled routing update failed.`, ICON_ERROR);
                } else {
                    await this.videohub.logActivity(`Scheduled routing update was successful.`, ICON_SUCCESS);
                }

                // go to next
                //this.scheduleNextTrigger(new Date())
            })
        }, 2000)
    }

    async retrieveUpcomingTriggers(date) {
        const time = new Date(date)
        return await prismadb.pushButtonTrigger.findMany({
            where: {
                videohub_id: this.videohub.data.id,
                output_id: this.id,
                day: time.getDay(),
                time: {
                    gte: time
                }
            },
            orderBy: {
                time: 'asc'
            }
        }).then(res => {
            return res.map(tr => {
                //tr.time = new Date(tr.time.toString()+" UTC")
                return tr
            })
        })
    } */

    updateRouting(input_id) {
        this.videohub.info(`Updating routing: ${this.id} ${input_id}`);
        this.input_id = input_id;
    }

    async save(label) {
        const vid = Number(this.videohub.data.id);
        const input_id = this.input_id == undefined ? null : this.input_id;
        await prismadb.output.upsert({
            where: {
                videohub_output: {
                    videohub_id: vid,
                    id: this.id, // prisma requires id to start at 1
                }
            },
            update: {
                input_id: input_id,
                label: label,
            },
            create: {
                id: this.id,
                videohub_id: vid,
                input_id: input_id,
                label: label,
            }
        })
    }
}

class Videohub {
    constructor(data) {
        this.client = undefined
        this.connecting = false
        this.data = data
        this.requestQueque = []
        this.outputs = new Array(0)
        this.inputs = []
        this.data.connected = false
        this.connectionAttempt = 0
        this.checkConnectionHealthId = undefined
        this.data.lastRoutingUpdate = new Date()
        this.scheduledButtons = []
    }

    async scheduleButtons() {
        this.info("Scheduling buttons...")
        this.stopScheduledButtons()
        this.scheduledButtons = await pushbuttons.retrieveScheduledButtonsToday(this)

        for (const button of this.scheduledButtons) {
            await button.handleScheduleNextTrigger(new Date())
        }

        this.info(`Buttons scheduled: ${this.scheduledButtons.length}`)
    }

    /*
    async retrieveUpcomingTriggers(date, output_id) {
        const output = this.getOutput(output_id)
        if (output == undefined) {
            return []
        }

        return output.retrieveUpcomingTriggers(date)
    } */

    async handleButtonReSchedule(buttonId) {
        for (const button of this.scheduledButtons) {
            if (button.id === buttonId) {
                await button.handleScheduleNextTrigger(new Date())
                return
            }
        }

        const button = await retrievescheduledButton(this, buttonId, new Date())
        if (button != undefined) {
            this.scheduledButtons.push(button)
            button.handleScheduleNextTrigger(new Date())
        }
    }

    sendRoutingUpdateRequest(outputs, inputs) {
        this.info(`Trying to send routing update: ${outputs} - ${inputs}`)

        // prepare
        let _resolve;
        let request;
        request = new InputChangeRequest(outputs, inputs, () => {
            this.info(`Request was successful: ${outputs} ${inputs}`);

            // currently not needed
            /*
            for (let i = 0; i < outputs.length; i++) {
                const output = this.getOutput(outputs[i])
                output.updateRouting(this, inputs[i]);
                output.save(this);
            } */

            request.result = true
            this.removeRequest(request);
            _resolve(undefined);
        });

        // register and send
        if (!this.data.connected) {
            setTimeout(() => {
                if (this.data.connected) {
                    request.send(this);
                } else {
                    _resolve("Videohub isn't reachable. Is it running?");
                }
            }, REQUEST_RECONNECT_GRACE_TIME);
        } else {
            request.send(this)
        }

        // handle res with timeout
        const promise = new Promise((resolve) => {
            _resolve = resolve;
            setTimeout(() => {
                if (!request.result) {
                    this.info(`Request timed out: ${outputs} ${inputs}`);
                    resolve("Request timed out.");
                } else {
                    resolve(undefined);
                }

                this.removeRequest(request);

            }, REQUEST_TIMEOUT);
        });

        return promise;
    }

    onUpdate() {
        emit("videohubUpdate", this.data);
    }

    async logActivity(description, icon) {
        await prismadb.videohubActivity.create({
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
        this.requestQueque.push(request)
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
            this.info(`Request removed: ${request.outputs} ${request.inputs}`);
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
            await this.scheduleButtons();
            this.onUpdate()

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

    stopScheduledButtons() {
        this.info("Stopping button schedules.")

        this.scheduledButtons.forEach(button => {
            button.stopSchedule()
        })

        this.scheduledButtons = []
    }

    async reconnect() {
        if (false != this.connecting) {
            return;
        }

        if (this.client != undefined) {
            this.client.removeAllListeners();
            this.client.destroy();
            this.client = undefined;

            // stop schedules
            this.stopScheduledButtons()
        }

        const wasConnected = this.data.connected;
        this.data.connected = false;

        if (wasConnected) {
            this.onUpdate();
            await this.logActivity("Connection lost.", ICON_ERROR)
        }

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

    getOutput(id) {
        return this.outputs[id];
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
                await this.save()
                return 1;
            }

            case PROTOCOL_INPUT_LABELS: {
                // inputs and outputs
                this.data.inputs = [];
                for (const line of getCorrespondingLines(lines, index)) {
                    const index = line.indexOf(" ");
                    const id = Number(line.substring(0, index));
                    const label = line.substring(index + 1);

                    await prismadb.input.upsert({
                        where: {
                            videohub_input: {
                                videohub_id: this.data.id,
                                id: id, // prisma requires id to start at 1
                            }
                        },
                        create: {
                            id: id,
                            videohub_id: this.data.id,
                            label: label,
                        },
                        update: {
                            label: label,
                        }
                    });

                    this.data.inputs.push({ id: id, label: label });
                }

                return this.data.inputs.length;
            }

            case PROTOCOL_OUTPUT_LABELS: {
                // inputs and outputs
                this.data.outputs = []
                for (const line of getCorrespondingLines(lines, index)) {
                    const index = line.indexOf(" ")
                    const id = Number(line.substring(0, index))
                    const label = line.substring(index + 1)

                    const output = this.getOutput(id)
                    if (output != undefined) {
                        await output.save(label)
                    }

                    this.data.outputs.push({ id: id, label: label, input_id: undefined })
                }

                return this.data.outputs.length
            }

            case PROTOCOL_VIDEOHUB_DEVICE: {
                const entries = getCorrespondingLines(lines, index);

                if (this.data.name === this.data.ip) {
                    this.data.name = getConfigEntry(entries, 2);
                    await this.save()
                }

                const outputs = Number(getConfigEntry(entries, 6))
                if (outputs === 12 || outputs === 20 || outputs === 40) {
                    if (this.outputs.length === 0) {
                        this.outputs = new Array(outputs)
                        for (let i = 0; i < this.outputs.length; i++) {
                            const output = new Output(this, i)
                            this.outputs[i] = output
                            output.save("Unknown")
                            //output.scheduleNextTrigger(new Date())
                        }

                        this.info(`Setup ${this.outputs.length} outputs.`)
                    }
                } else {
                    throw Error(`Invalid amount of outputs: ${outputs}`)
                }

                return entries.length;
            }

            case PROTOCOL_VIDEO_OUTPUT_ROUTING: {
                let i = 0;
                for (const line of getCorrespondingLines(lines, index)) {
                    const data = line.split(" ")
                    await this.updateRouting(Number(data[0]), Number(data[1]));
                    i++;
                }

                this.onUpdate();
                return i;
            }

            case PROTOCOL_ACKNOWLEDGED: {
                const request = this.requestQueque.shift()
                if (request == undefined) {
                    throw Error("Got " + PROTOCOL_ACKNOWLEDGED + ", but no request sent.")
                }

                request.onSuccess()
                return 1
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
        const output = this.getOutput(output_id)
        if (output == undefined) {
            return
        }

        const outputData = this.data.outputs[output_id]
        outputData.input_id = input_id
        output.updateRouting(input_id)

        /*
        this.requestQueque = this.requestQueque.filter(req => {
            return !req.ack(output_id, input_id) // remove request and call success 
        })*/

        this.data.lastRoutingUpdate = new Date()
        output.save(outputData.label)
    }

    async save() {
        this.info("Saving...");
        await prismadb.videohub.update({
            where: {
                id: this.data.id,
            },
            data: {
                name: this.data.name,
            }
        })

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

function scheduleButtons() {
    const now = new Date()
    const night = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1, // the next day, ...
        0, 0, 0 // ...at 00:00:00 hours
    )

    const diff = night.getTime() - now.getTime()
    console.log(`Midnight is in ${diff / 1000} second(s).`)
    setTimeout(async function () {
        for (const hub of module.exports.getClients()) {
            await hub.scheduleButtons()
        }

        scheduleButtons()
    }, diff)
}

if (global.videohubs == undefined) {
    global.videohubs = []
}

module.exports = {
    getClients: function () {
        return global.videohubs
    },
    getClient: function (id) {
        for (const client of module.exports.getClients()) {
            if (client.data.id === id) {
                return client;
            }
        }
    },
    async retrieveUpcomingTriggers(date, videohub) {
        for (const client of module.exports.getClients()) {
            if (client.data.id === videohub) {
                return await client.retrieveUpcomingTriggers(date)
            }
        }

        return []
    },
    getVideohubs: function () {
        return module.exports.getClients().map(client => client.data);
    },
    getVideohub: function (id) {
        for (const hub of module.exports.getClients()) {
            if (hub.data.id === id) {
                return hub.data;
            }
        }

        return undefined;
    },
    setup: async function () {
        if (module.exports.getClients().length != 0) {
            throw Error("Already initialized")
        }

        console.log("Loading data...")
        const arr = await prismadb.videohub.findMany({
            include: {
                inputs: true,
                outputs: true,
            }
        });

        arr.forEach((e) => {
            // turn into objects
            for (let i = 0; i < e.outputs.length; i++) {
                const output = e.outputs[i]
                e.outputs[i] = { id: output.id, label: output.label, input_id: undefined }
                const input = e.inputs[i];
                e.inputs[i] = { id: input.id, label: input.label }
            }

            global.videohubs.push(new Videohub(e))
        })

        console.log("Connecting to videohubs.");
        for (const hub of module.exports.getClients()) {
            if (hub.isConnected()) {
                throw Error("Already connected");
            }

            hub.reconnect(true)
        }

        scheduleButtons()
    },
    sendRoutingUpdate: function (request) {
        const videohubClient = module.exports.getClient(request.videohub_id);
        if (videohubClient == undefined) {
            throw Error("Client not found: " + request.videohub_id);
        }

        return videohubClient.sendRoutingUpdateRequest(request.outputs, request.inputs);
    },
    handleButtonReSchedule: async function (videohubId, buttonId) {
        const videohubClient = module.exports.getClient(videohubId);
        if (videohubClient == undefined) {
            throw Error("Client not found: " + videohubId);
        }

        await videohubClient.handleButtonReSchedule(buttonId)
    }

    /*
    scheduleNextTrigger: async function (videohub_id, output_id, date) {
        const videohubClient = module.exports.getClient(videohub_id);
        if (videohubClient == undefined) {
            throw Error("Client not found: " + videohub_id);
        }

        const output = videohubClient.getOutput(output_id)
        if (output == undefined) {
            return
        }

        await output.scheduleNextTrigger(date)
    } */
}

