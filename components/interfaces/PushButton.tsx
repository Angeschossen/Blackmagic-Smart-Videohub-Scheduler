export interface PushButton {
    id: number,
    videohub_id: number,
    label: string,
    actions: PushbuttonAction[],
    color?: string
}

export interface PushbuttonAction{
    id: number,
    pushbutton_id: number,
    videohub_id: number,
    output_id: number,
    input_id: number,
}