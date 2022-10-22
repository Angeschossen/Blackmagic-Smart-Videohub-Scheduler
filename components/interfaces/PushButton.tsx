export interface PushButton {
    id: number,
    videohub_id: number,
    label: string,
    description: string,
    actions: PushbuttonAction[],
    color?: string
    user_id: string,
}

export interface PushbuttonAction {
    id: number,
    pushbutton_id: number,
    videohub_id: number,
    output_id: number,
    input_id: number,
}