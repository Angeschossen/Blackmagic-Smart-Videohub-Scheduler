"use strict";

const next = require('next')
const express = require('express')
const { PrismaClient } = require('@prisma/client');
const net_1 = require("net");

const HUB_PORT = 9990;
const videohubs = [];
const prisma = new PrismaClient();
loadData();

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

function getConfigEntry(lines, index) {
    var line = lines[index];
    return line.substring(line.indexOf(":") + 1).trim();
}

function getCorrespondingLines(lines, look) {
    var i = 0;
    var found = false;
    for (; i < lines.length; i++) {
        if (lines[i] === look) {
            found = true;
            i++;
            break;
        }
    }
    if (!found) {
        throw new SyntaxError("Entry not found in videohub response: " + look);
    }
    var n = [];
    for (; i < lines.length; i++) {
        var line = lines[i];
        if (line === "") {
            break; // end
        }
        n.push(line);
    }
    return n;
}

function getLines(input) {
    var lines = input.split("\n");
    // trim those lines
    for (var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].trim();
    }
    return lines;
}

var INPUT_LABELS = "INPUT LABELS:", PROTOCOL_PREAMPLE = "PROTOCOL PREAMPLE:", OUTPUT_START = "OUTPUT LABELS:", VIDEO_OUTPUT_ROUTING = "VIDEO OUTPUT ROUTING:", FRIENDLY_NAME = "Friendly name:";
var Videohub = /** @class */ (function () {
    function Videohub(id, ip, name) {
        this.version = "0";
        this.inputs = [];
        this.outputs = [];
        this.isLoaded = false;
        this.id = id;
        this.ip = ip;
        this.name = name;
    }
    Videohub.prototype.connect = function () {
        var _this = this;
        if (this.client != undefined) {
            return; // already connected
        }
        this.client = new net_1.Socket();
        this.client.connect(HUB_PORT, this.ip, function () {
            console.log("Connection to videohub (".concat(_this.ip, ") established."));
        });
        // initial and update
        this.client.on("data", function (data) {
            var text = data.toString();
            if (text.startsWith(PROTOCOL_PREAMPLE)) { // initial
                console.log("Loading initial data.");
                _this.loadInitial(text);
            }
            else if (text.startsWith(VIDEO_OUTPUT_ROUTING)) { // update rounting
                var lines = getLines(text);
                for (var _i = 0, _a = getCorrespondingLines(lines, VIDEO_OUTPUT_ROUTING); _i < _a.length; _i++) {
                    var line = _a[_i];
                    var data_1 = line.split(" ");
                    _this.outputs[Number(data_1[0])].current_input = _this.inputs[Number(data_1[1])];
                }
            }
        });
        this.client.on("close", function () {
            _this.client = undefined;
            console.log("Connection to videohub (".concat(_this.ip, ") closed."));
        });
    };
    Videohub.prototype.loadInitial = function (text) {
        var lines = getLines(text);
        // ver and name
        this.version = getConfigEntry(lines, 1);
        this.name = getConfigEntry(lines, 6);
        // inputs and outputs
        this.inputs = [];
        for (var _i = 0, _a = getCorrespondingLines(lines, INPUT_LABELS); _i < _a.length; _i++) {
            var line = _a[_i];
            var index = line.indexOf(" ");
            this.inputs.push({
                id: Number(line.substring(0, index)),
                label: line.substring(index + 1),
            });
        }
        this.outputs = [];
        for (var _b = 0, _c = getCorrespondingLines(lines, OUTPUT_START); _b < _c.length; _b++) {
            var line = _c[_b];
            var index = line.indexOf(" ");
            this.outputs.push({
                id: Number(line.substring(0, index)),
                label: line.substring(index + 1),
            });
        }
        for (var _d = 0, _e = getCorrespondingLines(lines, VIDEO_OUTPUT_ROUTING); _d < _e.length; _d++) {
            var line = _e[_d];
            var data = line.split(" ");
            this.outputs[Number(data[0])].current_input = this.inputs[Number(data[1])];
        }
        this.isLoaded = true;
    };
    return Videohub;
}());

async function loadData() {
    await prisma.videohub.findMany().then(r => {
        var arr = [];
        for (var _i = 0, r_1 = r; _i < r_1.length; _i++) {
            var hub = r_1[_i];
            var h = getVideohub(hub.id);
            if (h == undefined) {
                var n = new Videohub(hub.id, hub.ip, hub.name);
                h = n;
                videohubs.push(n);
                h.connect(); // new videohub
            }

            arr.push(h);
        }

        setTimeout(this.loadData(), 5000);
    });
}

function getVideohub(id) {
    for (var _i = 0, videohubs_1 = videohubs; _i < videohubs_1.length; _i++) {
        var hub = videohubs_1[_i];
        if (hub.id === id) {
            return hub;
        }
    }
}

