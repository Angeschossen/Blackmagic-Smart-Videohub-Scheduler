import { Socket } from "net";
import { TableItem } from "./DataTable";

const HUB_PORT: number = 9990;

export interface Videohub extends TableItem {
    id: number,
    ip: string,
    name: string,
    version: string,
    inputs: Input[],
    outputs: Output[],
    isLoaded: boolean,
}

export interface Input extends TableItem {
    id: number,
    label: string,
}

export interface Output extends TableItem {
    id: number,
    current_input?: Input,
    label: string,
}

function getConfigEntry(lines: string[], index: number): string {
    const line = lines[index];
    return line.substring(line.indexOf(":")+1).trim();
}

function getCorrespondingLines(lines: string[], look: string): string[] {
    let i = 0;
    let found: boolean = false;
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

    const n: string[] = [];
    for (; i < lines.length; i++) {
        const line = lines[i];
        if (line === "") {
            break; // end
        }

        n.push(line);
    }

    return n;
}

function getLines(input: string): string[] {
    const lines: string[] = input.split("\n");

    // trim those lines
    for (let i = 0; i < lines.length; i++) {
        lines[i] = lines[i].trim();
    }

    return lines;
}
const INPUT_LABELS = "INPUT LABELS:", PROTOCOL_PREAMPLE = "PROTOCOL PREAMPLE:", OUTPUT_START = "OUTPUT LABELS:", VIDEO_OUTPUT_ROUTING = "VIDEO OUTPUT ROUTING:", FRIENDLY_NAME = "Friendly name:";
export class IVideohub implements Videohub {
    id: number;
    ip: string;
    version: string = "0";
    name: string;
    inputs: Input[] = [];
    outputs: Output[] = [];
    client?: Socket;
    isLoaded: boolean=false;

    constructor(id: number, ip: string, name: string) {
        this.id = id;
        this.ip = ip;
        this.name = name;
    }

    connect() {
        if (this.client != undefined) {
            return; // already connected
        }

        this.client = new Socket();
        this.client.connect(HUB_PORT, this.ip, () => {
            console.log(`Connection to videohub (${this.ip}) established.`);
        });

        // initial and update
        this.client.on("data", data => {
            const text = data.toString();
            if (text.startsWith(PROTOCOL_PREAMPLE)) { // initial
                console.log("Loading initial data.")
                this.loadInitial(text);
            } else if (text.startsWith(VIDEO_OUTPUT_ROUTING)) {  // update rounting
                const lines: string[] = getLines(text);
                for (const line of getCorrespondingLines(lines, VIDEO_OUTPUT_ROUTING)) {
                    const data: string[] = line.split(" ");
                    this.outputs[Number(data[0])].current_input = this.inputs[Number(data[1])];
                }
            }
        });

        this.client.on("close", () => {
            this.client = undefined;
            console.log(`Connection to videohub (${this.ip}) closed.`)
        })
    }

    loadInitial(text: string) {
        const lines: string[] = getLines(text);

        // ver and name
        this.version = getConfigEntry(lines, 1);
        this.name = getConfigEntry(lines, 6);


        // inputs and outputs
        this.inputs = [];
        for (const line of getCorrespondingLines(lines, INPUT_LABELS)) {
            const index: number = line.indexOf(" ");
            this.inputs.push({
                id: Number(line.substring(0, index)),
                label: line.substring(index + 1),
            });
        }

        this.outputs = [];
        for (const line of getCorrespondingLines(lines, OUTPUT_START)) {
            const index: number = line.indexOf(" ");
            this.outputs.push({
                id: Number(line.substring(0, index)),
                label: line.substring(index + 1),
            });
        }

        for (const line of getCorrespondingLines(lines, VIDEO_OUTPUT_ROUTING)) {
            const data: string[] = line.split(" ");
            this.outputs[Number(data[0])].current_input = this.inputs[Number(data[1])];
        }

        this.isLoaded = true;
    }
}