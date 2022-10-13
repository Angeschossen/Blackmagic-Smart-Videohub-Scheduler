import { DefaultButton, Dropdown, getColorFromString, IColor, IDropdownOption, IDropdownStyles, IIconProps, IModalProps, IModalStyles, IStackTokens, Label, Modal, PrimaryButton, Stack, TextField } from "@fluentui/react";
import { PushButtonAction } from "@prisma/client";
import React, { Key, RefObject, useEffect } from "react";
import { deepCopy, getRandomKey } from "../utils/commonutils";
import { getPostHeader } from "../utils/fetchutils";
import { Confirmation } from "../buttons/Confirmation";
import { PushButton, PushbuttonAction } from "../interfaces/PushButton";
import { Videohub } from "../interfaces/Videohub";
import { PickColor } from "../input/ColorPicker";
import { dropdownStyles, stackTokens } from "../utils/styles";
import { useForceUpdate } from "../utils/hooks";
import { InputModal, InputModalProps } from "./InputModal";




interface InputProps {
    onConfirm: (button: PushButton) => void;
    isOpen: boolean | undefined;
    optionsInput: IDropdownOption[],
    optionsOutput: IDropdownOption[],
    modalKey: number,
    videohub: Videohub,
    button?: PushButton,
    buttons: PushButton[],
    close: () => void,
    onDelete: (buttonId: number) => void,
}


interface RoutingComponentProps {
    optionsInput: IDropdownOption[],
    optionsOutput: IDropdownOption[],
    routing: PushbuttonAction,
    required: boolean,
    onSelectOutput: (index?: number) => void,
    onSelectInput: (index?: number) => void,
}

class RoutingComponent extends React.Component<RoutingComponentProps, {}>{
    constructor(props: RoutingComponentProps) {
        super(props);
    }

    render(): React.ReactNode {
        return <Stack horizontal wrap tokens={stackTokens}>
            <Dropdown
                required={this.props.required}
                placeholder="Select an input"
                label="Input"
                defaultSelectedKey={this.props.routing == undefined ? undefined : this.props.routing.input_id}
                options={this.props.optionsInput}
                styles={dropdownStyles}
                onChange={(_event, _option, index) => {
                    this.props.onSelectInput(index);
                }}
            />
            <Dropdown
                required={this.props.required}
                placeholder="Select an output"
                label="Output"
                defaultSelectedKey={this.props.routing == undefined ? undefined : this.props.routing.output_id}
                options={this.props.optionsOutput}
                styles={dropdownStyles}
                onChange={(_event, _option, index) => {
                    this.props.onSelectOutput(index);
                }}
            />
        </Stack>;
    }
}

export const EditPushButtonModal = (props: InputProps) => {

    const forceUpdate = useForceUpdate();
    const button = React.useRef<PushButton>(props.button == undefined ? {
        id: -1,
        videohub_id: props.videohub.id,
        label: undefined,
        actions: [],
    } : deepCopy(props.button));

    const routingComponents = React.useRef<RoutingComponent[]>([]);
    if (routingComponents.current.length == 0) {
        if (button.current.actions.length != 0) {
            for (const action of button.current.actions) {
                addActionComponent(false, action);
            }
        } else {
            addActionComponent(true, undefined);
        }
    }

    function addActionComponent(initial: boolean, action?: PushButtonAction) {
        let key: number | undefined;
        let ac;
        if (action == undefined) {
            key = setRouting(undefined, undefined, undefined);
            ac = button.current.actions[key];
        } else {
            ac = action;
            for (let i = 0; i < button.current.actions.length; i++) {
                if (button.current.actions[i].id === action.id) {
                    key = i;
                    break;
                }
            }

            if (key == undefined) {
                throw Error("Could not find action.");
            }
        }

        routingComponents.current.push(new RoutingComponent({
            required: initial,
            optionsOutput: props.optionsOutput,
            optionsInput: props.optionsInput,
            onSelectOutput: (index?: number) => {
                setRouting(key, index, undefined);
            },
            routing: ac,
            onSelectInput: (index?: number) => {
                setRouting(key, undefined, index);
            }
        }));
    }

    function setRouting(index?: number, output?: number, input?: number): number {
        let i;
        if (index == undefined) {
            i = button.current.actions.length;
            button.current.actions.push({
                id: -1,
                output_id: output == undefined ? -1 : output,
                input_id: input == undefined ? -1 : input,
                videohub_id: props.videohub.id,
                pushbutton_id: button.current.id,
            });
        } else {
            i = index;
            const action: PushButtonAction = button.current.actions[index];
            if (output != undefined) {
                action.output_id = output;
            }

            if (input != undefined) {
                action.input_id = input;
            }
        }

        return i;
    }

    function validateButtonLabel(input: string): string | undefined {
        if (input.length > 42) {
            return "Name can't be longer than 42 characters.";
        }

        if(input.trim().length < 1){
            return "Name is too short."
        }

        input = input.toLowerCase();
        for (const b of props.buttons) {
            if (b.label.toLowerCase() === input && b.id != button.current.id) {
                return "A button with this name already exists.";
            }
        }

        return undefined;
    }

    return (
        <InputModal
            modalKey={props.modalKey}
            isOpen={props.isOpen}
            onCancel={function (): void {
                // just close
            }} onConfirm={function (): string | undefined {
                if (button.current.label == undefined) {
                    return "Please insert a name.";
                }

                const err = validateButtonLabel(button.current.label);
                if (err != undefined) {
                    return err;
                }

                const actions: PushbuttonAction[] = [];
                for (const action of button.current.actions) {
                    if (action.input_id == -1 || action.output_id == -1) {
                        continue;
                    }

                    actions.push(action);
                }

                if (actions.length != 0) {
                    button.current.actions = actions;
                    props.onConfirm(button.current);
                    return undefined;
                }

                return "Please specify at leat one complete routing with an input and output.";
            }}
            close={props.close}>
            <Stack horizontal tokens={stackTokens}>
                <Stack tokens={stackTokens}>
                    <TextField label="Name" required
                        onChange={(_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, val?: string) => {
                            button.current.label = val||"";
                        }}
                        defaultValue={button.current.label}
                        validateOnLoad={false}
                        validateOnFocusOut={true}
                        onGetErrorMessage={(value: string) => {
                            return validateButtonLabel(value);
                        }}
                    />
                    <Label>Color</Label>
                    <Stack horizontal horizontalAlign="center">
                        <PickColor
                            color={button.current.color != undefined ? getColorFromString(button.current.color) : undefined}
                            onChange={(color) => {
                                button.current.color = color.str;
                            }}
                        />
                    </Stack>
                </Stack>
                <Stack wrap>
                    {routingComponents.current.map((component, index) => {
                        return <React.Fragment key={index}>
                            {component.render()}
                        </React.Fragment>
                    })}
                </Stack>
            </Stack>
            <DefaultButton text="Add routing" onClick={() => {
                addActionComponent(false, undefined);
                forceUpdate();
            }} allowDisabledFocus />
            {button.current.id != -1 &&
                <DefaultButton text="Delete" style={{ backgroundColor: '#ff6666' }} onClick={() => {
                    fetch('/api/pushbuttons/delete', getPostHeader({ videohub_id: props.videohub.id, id: button.current.id })).then(async (res) => {
                        const json = await res.json();
                        if (json.result) {
                            props.onDelete(button.current.id);
                            props.close();
                        }
                    });
                }} allowDisabledFocus />}
        </InputModal>
    );
}