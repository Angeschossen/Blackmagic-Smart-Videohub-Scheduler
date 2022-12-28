import { getColorFromString, Label, Stack } from "@fluentui/react";
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, Button, InputProps, Switch, TextareaProps, ToggleButton, useId } from "@fluentui/react-components";
import { Dropdown, InputField, Option, TextareaField } from "@fluentui/react-components/unstable";
import { CameraSwitchRegular, DatabaseSwitchRegular, DeleteRegular, RouterRegular, SlideHideRegular, TableSwitchRegular, TextboxRegular, TextFieldRegular, VideoSwitchRegular } from "@fluentui/react-icons";
import { PushButton, PushButtonAction } from "@prisma/client";
import React from "react";
import { useGetClientId } from "../../auth/ClientAuthentication";
import { PickColor } from "../../input/ColorPicker";
import { InputState } from "../../input/HandledInputField";
import { IPushButton, IPushbuttonAction } from "../../interfaces/PushButton";
import { hasRoleOutput, User } from "../../interfaces/User";
import { Videohub } from "../../interfaces/Videohub";
import { getRandomKey } from "../../utils/commonutils";
import { getPostHeader } from "../../utils/fetchutils";
import { stackTokens, useInputStyles } from "../../utils/styles";
import { InputModal } from "../InputModalNew";

interface Props {
    onButtonUpdate: (button: IPushButton, action: "create" | "update" | "delete") => void
    videohub: Videohub,
    button?: IPushButton,
    buttons: IPushButton[],
    trigger: JSX.Element,
    user: User,
}

interface Routing {
    actionId?: number,
    input?: number,
    output?: number,
}

function getIdFromValue(ids: { label: string, id: number }[], value: string) {
    for (const entry of ids) {
        if (entry.label === value) {
            return entry.id
        }
    }

    throw Error("Value from name not found")
}

const RoutingComponent = (props: {
    num: number,
    videohub: Videohub,
    routing: Routing,
    onSelectOutput: (index?: number) => void,
    onSelectInput: (index?: number) => void,
    onDelete: () => void,
    user: User,
}) => {
    const key: string | number = props.routing.actionId?.toString() || getRandomKey()
    const inputKey = `${key}_input`
    const outputKey = `${key}_output`
    const styles = useInputStyles()

    return (
        <div className={styles.root}>
            <h3>#{props.num}</h3>
            <Label htmlFor={outputKey}>Output</Label>
            <Dropdown
                key={outputKey}
                defaultSelectedOptions={props.routing.output == undefined ? [] : [props.videohub.outputs[props.routing.output].label]}
                placeholder="Select an output"
                onOptionSelect={(_event: any, data: any) => {
                    props.onSelectOutput(getIdFromValue(props.videohub.outputs, data.optionValue))
                }}>
                {props.videohub.outputs.filter(output => hasRoleOutput(props.user.role, props.videohub.id, output.id)).map(output =>
                    <Option key={`output_${output.id}`} value={output.label}>
                        {output.label}
                    </Option>)}
            </Dropdown>
            <Label htmlFor={inputKey}>Input</Label>
            <Dropdown
                key={inputKey}
                defaultSelectedOptions={props.routing.input == undefined ? [] : [props.videohub.inputs[props.routing.input].label]}
                placeholder="Select an input"
                onOptionSelect={(_event: any, data: any) => {
                    props.onSelectInput(getIdFromValue(props.videohub.inputs, data.optionValue))
                }}>
                {props.videohub.inputs.map(input =>
                    <Option key={`input_${input.id}`} value={input.label}>
                        {input.label}
                    </Option>)}
            </Dropdown>
            <Button
                size="small"
                icon={<DeleteRegular />}
                onClick={() => props.onDelete()}
            />
        </div>
    )
}

export const EditPushButtonModal = (props: Props) => {
    const inputNameId = useId('input_name')
    const inputSortingId = useId('input_sorting')
    const inputDescriptionId = useId('input_description')
    const inputDisplayId = useId('display')
    const styles = useInputStyles()
    const userId = useGetClientId()

    const [name, setName] = React.useState<InputState>({ value: props.button?.label || "" })
    const [routings, setRoutings] = React.useState<Routing[]>(props.button?.actions.map(action => createRouting(action)) || [createRouting(undefined)])
    const [description, setDescription] = React.useState<InputState>({ value: props.button?.description || "" })
    const [color, setColor] = React.useState(props.button?.color)
    const [sorting, setSorting] = React.useState<InputState>({ value: props.button?.sorting.toString() || "0" })

    const [display, setDisplay] = React.useState(props.button == undefined ? true : props.button.display)
    const onDisplayChange = React.useCallback(
        (ev: { currentTarget: { checked: any; }; }) => {
            setDisplay(ev.currentTarget.checked);
        },
        [setDisplay],
    );

    const onChangeName: InputProps['onChange'] = (_ev, data) => {
        setName(validateLabel(data.value))
    }

    const onChangeSorting: InputProps['onChange'] = (_ev, data) => {
        setSorting(validateSorting(data.value))
    }

    const onChangeDescription: TextareaProps['onChange'] = (_ev, data) => {
        setDescription(validateDescription(data.value))
    }

    function createRouting(action?: PushButtonAction) {
        if (action == undefined) {
            return { actionId: undefined, input: undefined, output: undefined }
        } else {
            return { actionId: action.id, input: action.input_id, output: action.output_id }
        }
    }

    function updateRouting(routing: Routing, output?: number, input?: number) {
        const arr = [...routings]
        arr[arr.indexOf(routing)] = { actionId: routing.actionId, output: output, input: input }
        setRoutings(arr)
    }

    function removeRouting(routing: Routing) {
        const arr = [...routings]
        arr.splice(arr.indexOf(routing), 1)
        setRoutings(arr)
    }

    function validateDescription(value: string): InputState {
        if (value.length > 75) {
            return { value: value, validation: { state: "error", message: "Description must be between 0 and 75 characters long." } }
        }

        return { value: value, validation: { state: "success", message: "Input is valid." } }
    }

    function validateSorting(value: string): InputState {
        const sorting = Number(value)
        return sorting < 0 ? {
            value: 0,
            validation: {
                state: "error",
                message: "Sorting can't be lower than 0."
            }
        } : {
            value: sorting,
            validation: {
                state: "success",
                message: "Input is valid"
            }
        }
    }

    function validateLabel(name: string): InputState {
        const input = name.trim().toLocaleLowerCase()
        if (input.length == 0 || input.length > 32) {
            return { value: name, validation: { state: "error", message: "Name must be between 1 and 32 characters." } }
        }

        for (const b of props.buttons) {
            if (b.label.toLowerCase() === input && b.id != props.button?.id) {
                return { value: name, validation: { state: "error", message: "A button with this name already exists." } }
            }
        }

        return { value: name, validation: { state: "success", message: "Input is valid." } }
    }

    return (
        <InputModal
            title={props.button == undefined ? "Create Button" : "Edit Button"}
            trigger={props.trigger}
            additionalTrigger={props.button != undefined ?
                <Button icon={<DeleteRegular />} style={{ backgroundColor: '#ed2b2b' }} onClick={async () => {
                    const button = props.button
                    if (button != undefined) {
                        await fetch('/api/pushbuttons/delete', getPostHeader(button)).then(async (res) => {
                            if (res.status === 200) {
                                props.onButtonUpdate(button, "delete")
                            }
                        })
                    }
                }}>
                    Delete
                </Button>
                : undefined}
            handleSubmit={async () => {
                const actions: IPushbuttonAction[] = []
                for (const action of routings) {
                    if (action.input == undefined || action.output == undefined) {
                        continue
                    }

                    actions.push({
                        id: action.actionId || -1,
                        input_id: action.input, output_id: action.output,
                        pushbutton_id: props.button?.id || -1,
                        videohub_id: props.videohub.id,
                    })
                }

                if (actions.length != 0) {
                    const button: IPushButton = {
                        id: props.button?.id || -1,
                        videohub_id: props.videohub.id,
                        label: name.value,
                        actions: actions,
                        sorting: sorting.value,
                        display: display,
                        color: color,
                        description: description.value,
                        user_id: userId,
                        triggers: props.button?.triggers || [],
                    }

                    const result = await fetch('/api/pushbuttons/update', getPostHeader(button))
                    if (result.status === 200) {
                        const r: PushButton = await result.json()
                        const buttonNew = {
                            ...r,
                            triggers: props.button?.triggers || [],
                            actions: (r as any).actions,
                            color: r.color || undefined,
                        }

                        props.onButtonUpdate(buttonNew, button.id == -1 ? "create" : "update")
                    }

                    return Promise.resolve(undefined)
                }

                return Promise.resolve("Please specify at leat one complete routing with an input and output.")
            }}>
            <Stack horizontal tokens={stackTokens}>
                <Accordion multiple collapsible defaultOpenItems={[1, 3]}>
                    <AccordionItem value={1}>
                        <AccordionHeader size="large" icon={<TextboxRegular />}>General</AccordionHeader>
                        <AccordionPanel>
                            <div className={styles.root}>
                                <Label htmlFor={inputNameId}>Name</Label>
                                <InputField
                                    required
                                    input={{ style: { width: 248 } }}
                                    value={name.value as string}
                                    onChange={onChangeName}
                                    id={inputNameId}
                                    validationState={name.validation?.state}
                                    validationMessage={name.validation?.message}
                                />
                                <Label htmlFor={inputDescriptionId}>Description</Label>
                                <TextareaField
                                    textarea={{ style: { width: 268 } }}
                                    size="small"
                                    value={description.value as string}
                                    onChange={onChangeDescription}
                                    id={inputDescriptionId}
                                    validationState={description.validation?.state}
                                    validationMessage={description.validation?.message}
                                />
                            </div>
                        </AccordionPanel>
                    </AccordionItem>
                    <AccordionItem value={2}>
                        <AccordionHeader size="large" icon={<SlideHideRegular />}>Display</AccordionHeader>
                        <AccordionPanel>
                            <div className={styles.root}>
                                <Label htmlFor={inputDisplayId}>Display</Label>
                                <Switch
                                    checked={display}
                                    id={inputDisplayId}
                                    onChange={onDisplayChange}
                                />
                                <Label htmlFor={inputSortingId}>Sorting</Label>
                                <InputField
                                    required
                                    type="number"
                                    value={sorting.value}
                                    onChange={onChangeSorting}
                                    id={inputSortingId}
                                    validationState={sorting.validation?.state}
                                    validationMessage={sorting.validation?.message}
                                />
                                <Label>Color</Label>
                                <PickColor
                                    color={color == undefined ? undefined : getColorFromString(color)}
                                    onChange={(color) => {
                                        setColor(color.str)
                                    }}
                                />
                            </div>
                        </AccordionPanel>
                    </AccordionItem>
                    <AccordionItem value={3}>
                        <AccordionHeader size="large" icon={<VideoSwitchRegular />}>Routings</AccordionHeader>
                        <AccordionPanel>
                            <Stack tokens={stackTokens}>
                                {routings.map((routing, index) =>
                                    <RoutingComponent
                                        num={index + 1}
                                        user={props.user}
                                        key={`routing_${index}`}
                                        videohub={props.videohub}
                                        routing={routing}
                                        onSelectOutput={function (index?: number | undefined): void {
                                            updateRouting(routing, index, routing.input)
                                        }} onSelectInput={function (index?: number | undefined): void {
                                            updateRouting(routing, routing.output, index)
                                        }}
                                        onDelete={() => {
                                            removeRouting(routing)
                                        }}
                                    />
                                )}
                                <Button
                                    onClick={() => {
                                        const arr = [...routings]
                                        arr.push(createRouting(undefined))
                                        setRoutings(arr)
                                    }}>
                                    Add routing
                                </Button>
                            </Stack>
                        </AccordionPanel>
                    </AccordionItem>
                </Accordion>
            </Stack>
        </InputModal>
    );
}