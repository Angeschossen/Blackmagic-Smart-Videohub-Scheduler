import { DefaultButton, Dropdown, getColorFromString, IColor, IDropdownOption, IDropdownStyles, IIconProps, IModalProps, IModalStyles, IStackTokens, Label, Modal, PrimaryButton, Stack, TextField } from "@fluentui/react";
import { PushButtonAction } from "@prisma/client";
import React, { RefObject } from "react";
import { deepCopy, getRandomKey } from "../utils/commonutils";
import { getPostHeader } from "../utils/fetchutils";
import { Confirmation } from "../buttons/Confirmation";
import { PushButton, PushbuttonAction } from "../interfaces/PushButton";
import { Videohub } from "../Videohub";
import InputModal from "./InputModal";
import { PickColor } from "../input/ColorPicker";
import { threadId } from "worker_threads";

const stackTokens: IStackTokens = { childrenGap: 20 };
const dropdownStyles: Partial<IDropdownStyles> = {
    dropdown: { width: 300 },
};


interface InputProps extends IModalProps {
    optionsInput: IDropdownOption[],
    optionsOutput: IDropdownOption[],
    videohub: Videohub,
    button?: PushButton,
    buttons: PushButton[],
    onConfirm: (button: PushButton) => void,
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
        </Stack >;
    }
}

export class EditPushButtonModal extends React.Component<InputProps, { label?: string, modalKey?: number, isOpen?: boolean }> {

    private routingComponents: RoutingComponent[] = [];
    private mounted: boolean = false;
    private button: PushButton;
    private label?: string;
    private color?: IColor;

    constructor(props: InputProps) {
        super(props);

        this.button = props.button == undefined ? {
            id: -1,
            videohub_id: props.videohub.id,
            label: undefined,
            actions: []
        } : deepCopy(props.button);

        this.state = { modalKey: getRandomKey(), isOpen: this.props.isOpen };
        this.label = this.button.label;
        this.color = this.button.color==undefined ? undefined : getColorFromString(this.button.color);

        this.addActionComponent = this.addActionComponent.bind(this);
        this.validateButtonLabel = this.validateButtonLabel.bind(this);
        this.setRouting = this.setRouting.bind(this);
    }

    componentDidMount() {
        if (this.mounted) {
            return;
        }

        this.mounted = true;

        if (this.button.actions.length != 0) {
            for (const action of this.button.actions) {
                this.addActionComponent(false, action);
            }
        } else {
            this.addActionComponent(true, undefined);
        }

        this.setState({ label: this.button.label });
    }

    addActionComponent(initial: boolean, action?: PushButtonAction) {
        let key: number | undefined;
        if (action == undefined) {
            key = this.setRouting(undefined, undefined, undefined);
            action = this.button.actions[key];
        } else {
            for (let i = 0; i < this.button.actions.length; i++) {
                if (this.button.actions[i].id === action.id) {
                    key = i;
                    break;
                }
            }

            if (key == undefined) {
                throw Error("Could not find action.");
            }
        }

        this.routingComponents.push(new RoutingComponent({
            required: initial,
            optionsOutput: this.props.optionsOutput,
            optionsInput: this.props.optionsInput,
            onSelectOutput: (index?: number) => {
                this.setRouting(key, index, undefined);
            },
            routing: action,
            onSelectInput: (index?: number) => {
                this.setRouting(key, undefined, index);
            }
        }));
    }

    setRouting(index?: number, output?: number, input?: number): number {
        if (index == undefined) {
            index = this.button.actions.length;
            this.button.actions.push({
                id: -1,
                output_id: output == undefined ? -1 : output,
                input_id: input == undefined ? -1 : input,
                videohub_id: this.props.videohub.id,
                pushbutton_id: this.button.id,
            });
        } else {
            const action: PushButtonAction = this.button.actions[index];
            if (output != undefined) {
                action.output_id = output;
            }

            if (input != undefined) {
                action.input_id = input;
            }
        }

        return index;
    }

    validateButtonLabel(input: string): string | undefined {
        if (input.length > 42) {
            return "Name can't be longer than 42 characters.";
        }

        input = input.toLowerCase();
        for (const b of this.props.buttons) {
            if (b.label.toLowerCase() === input && b.id != this.button.id) {
                return "A button with this name already exists.";
            }
        }

        return undefined;
    }

    render(): React.ReactNode {
        const inst: EditPushButtonModal = this;
        return (
            <InputModal
                modalKey={this.state.modalKey}
                isOpen={this.state.isOpen}
                onCancel={function (): void {
                    // just let it close
                }} onConfirm={function (): string | undefined {
                    if (inst.label == undefined) {
                        return "Please insert a name.";
                    }

                    const err = inst.validateButtonLabel(inst.label);
                    if (err != undefined) {
                        return err;
                    }

                    const actions: PushbuttonAction[] = [];
                    for (const action of inst.button.actions) {
                        if (action.input_id == -1 || action.output_id == -1) {
                            continue;
                        }

                        actions.push(action);
                    }

                    if (actions.length != 0) {
                        inst.button.label = inst.label;
                        inst.button.actions = actions;
                        inst.button.color = inst.color == undefined ? undefined : inst.color.str;
                        inst.props.onConfirm(inst.button);
                        return undefined;
                    }

                    return "Please specify at leat one complete routing with an input and output.";
                }}>
                <Stack tokens={stackTokens}>
                    <TextField label="Name" required
                        onChange={(_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, val?: string) => {
                            this.label = val;
                        }}
                        defaultValue={this.button == undefined ? undefined : this.button.label}
                        validateOnLoad={false}
                        validateOnFocusOut={true}
                        onGetErrorMessage={(value: string) => {
                            return this.validateButtonLabel(value);
                        }}
                    />
                    <Label>Color</Label>
                    <PickColor
                        color={this.color}
                        onChange={(color) => {
                            this.color = color;
                        }}
                    />
                    <Stack>
                        {this.routingComponents.map((component, index) => {
                            return <React.Fragment key={index}>
                                {component.render()}
                            </React.Fragment>
                        })}
                    </Stack>
                    <DefaultButton text="Add routing" onClick={() => {
                        this.addActionComponent(false, undefined);
                        this.forceUpdate();
                    }} allowDisabledFocus />
                    {this.button.id != -1 &&
                        <DefaultButton text="Delete" style={{ backgroundColor: '#e61c1c' }} onClick={() => {
                            fetch('/api/pushbuttons/delete', getPostHeader({ videohub_id: this.props.videohub.id, id: this.button.id })).then(async (res) => {
                                const json = await res.json();
                                if (json.result) {
                                    this.props.onDelete(this.button.id);
                                    this.setState({ modalKey: getRandomKey(), isOpen: false });
                                }
                            });
                        }} allowDisabledFocus />}
                </Stack>
            </InputModal>
        );
    }
}