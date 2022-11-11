import { IPushButton } from "./PushButton";

export interface Videohub {
    id: number,
    ip: string,
    name: string,
    version: string,
    inputs: Input[],
    outputs: Output[],
    connected: boolean,
    lastRoutingUpdate?: Date,
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
    id: number,
    videohubId: number,
    outputs: number[],
    button: IPushButton,
    inputs: number[],
    error: string | null | undefined,
    success: boolean,
}

export interface Input {
    id: number,
    label: string,
}

export interface Output {
    id: number,
    input_id: number | null,
    label: string,
}