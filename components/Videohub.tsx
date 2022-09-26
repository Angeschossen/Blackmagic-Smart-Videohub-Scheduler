import { TableItem } from "./DataTable";

export interface Videohub extends TableItem {
    id: number,
    ip: string,
    name: string,
    version: string,
    inputs: Input[],
    outputs: Output[],
    connected: boolean,
}

export interface Input extends TableItem {
    id: number,
    label: string,
}

export interface Output extends TableItem {
    id: number,
    input_id: number | null,
    label: string,
}

function getConfigEntry(lines: string[], index: number): string {
    const line = lines[index];
    return line.substring(line.indexOf(":") + 1).trim();
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