import { TableItem } from "../DataTable";

export interface Videohub extends TableItem {
    id: number,
    ip: string,
    name: string,
    version: string,
    inputs: Input[],
    outputs: Output[],
    connected: boolean,
}

export interface VideohubActivity {
    id: number,
    videohub_id: number,
    title: string,
    description?: string,
    time: Date,
    icon: string,
}

export interface RoutingRequest {
    videohub_id: number,
    output_id: number,
    input_id: number,
    error: string|null|undefined,
    success: boolean,
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