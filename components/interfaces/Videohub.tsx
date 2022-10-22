
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
    videohub_id: number,
    outputs: number[],
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