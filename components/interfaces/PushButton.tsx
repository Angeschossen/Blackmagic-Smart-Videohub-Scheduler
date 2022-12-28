import { PushButtonTrigger } from "@prisma/client";

export interface IPushButton {
    id: number,
    videohub_id: number,
    label: string,
    sorting: number,
    display: boolean,
    description: string,
    actions: IPushbuttonAction[],
    color?: string
    user_id: string,
    triggers: PushButtonTrigger[],
}

export interface IUpcomingPushButton {
    id: number, 
    cancelled: boolean,
    label: string,
    time: string,
    userId: string,
}

export interface IPushButtonTrigger {
    id: string,
    pushbutton_id: number,
    time: Date,
    days: number[]
}

export interface IPushbuttonAction {
    id: number,
    pushbutton_id: number,
    videohub_id: number,
    output_id: number,
    input_id: number,
}