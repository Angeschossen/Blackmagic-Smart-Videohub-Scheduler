import { CommandBarButton, DefaultButton, Dropdown, IDropdownOption, IDropdownStyles, IIconProps, IModalProps, IModalStyles, IStackTokens, Modal, PrimaryButton, Stack, TextField } from "@fluentui/react";
import { PropaneSharp } from "@mui/icons-material";
import { PushButtonAction } from "@prisma/client";
import { buttonProperties } from "office-ui-fabric-react";
import React from "react";
import { deepCopy } from "../../utils/commonutils";
import { getPostHeader } from "../../utils/fetchutils";
import { Confirmation, ConfirmationProps } from "../buttons/Confirmation";
import { PushButton, PushbuttonAction } from "../interfaces/PushButton";
import { Videohub } from "../Videohub";

const stackTokens: IStackTokens = { childrenGap: 20 };
const dropdownStyles: Partial<IDropdownStyles> = {
    dropdown: { width: 300 },
};
const addIcon: IIconProps = { iconName: 'Add' };


interface InputProps extends IModalProps {
    optionsInput: IDropdownOption[],
    optionsOutput: IDropdownOption[],
    videohub: Videohub,
    button?: PushButton,
    buttons: PushButton[],
    close: () => void,
    onConfirm: (button: PushButton) => void,
    onDelete: (buttonId: number) => void,
}


interface RoutingComponentProps {
    optionsInput: IDropdownOption[],
    optionsOutput: IDropdownOption[],
    routing: PushbuttonAction,
    onSelectOutput: (index?: number) => void,
    onSelectInput: (index?: number) => void,
}

class RoutingComponent extends React.Component<RoutingComponentProps, {}>{
    constructor(props: RoutingComponentProps) {
        super(props);
    }

    render(): React.ReactNode {
        return <Stack horizontal tokens={stackTokens}>
            <Dropdown
                placeholder="Select an output"
                label="Output"
                defaultSelectedKey={this.props.routing == undefined ? undefined : this.props.routing.output_id}
                options={this.props.optionsOutput}
                styles={dropdownStyles}
                onChange={(_event, _option, index) => {
                    this.props.onSelectOutput(index);
                }}
            />
            <Dropdown
                placeholder="Select an input"
                label="Input"
                defaultSelectedKey={this.props.routing == undefined ? undefined : this.props.routing.input_id}
                options={this.props.optionsInput}
                styles={dropdownStyles}
                onChange={(_event, _option, index) => {
                    this.props.onSelectInput(index);
                }}
            />
        </Stack >;
    }
}

export class EditPushButtonModal extends React.Component<InputProps, {}> {

    private routingComponents: RoutingComponent[] = [];
    private mounted: boolean = false;
    private button: PushButton;
    private label?: string;

    constructor(props: InputProps) {
        super(props);

        this.button = props.button == undefined ? {
            id: -1,
            videohub_id: props.videohub.id,
            label: undefined,
            actions: []
        } : deepCopy(props.button);

        this.label = this.button.label;
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
                this.addActionComponent(action);
            }
        } else {
            this.addActionComponent(undefined);
        }

        this.setState({ label: this.button.label });
    }

    addActionComponent(action?: PushButtonAction) {
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
        console.log(index);
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
        input = input.toLowerCase();
        for (const b of this.props.buttons) {
            if (b.label.toLowerCase() === input && b.id != this.button.id) {
                return "A button with this name already exists.";
            }
        }

        return undefined;
    }

    render(): React.ReactNode {
        return (
            <Modal isOpen={this.props.isOpen}>
                <Stack tokens={stackTokens} styles={{ root: { margin: '1vh' } }}>
                    <TextField label="Required" required
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
                    <Stack>
                        {this.routingComponents.map((component, index) => {
                            return <React.Fragment key={index}>
                                {component.render()}
                            </React.Fragment>
                        })}
                    </Stack>
                    <DefaultButton text="Add routing" onClick={() => {
                        this.addActionComponent(undefined);
                        this.forceUpdate();
                    }} allowDisabledFocus />
                    {this.button.id != -1 && <DefaultButton text="Delete" style={{ backgroundColor: '#e8453a' }} onClick={() => {
                        fetch('/api/pushbuttons/delete', getPostHeader({ videohub_id: this.props.videohub.id, id: this.button.id })).then(async (res) => {
                            const json = await res.json();
                            if (json.result) {
                                this.props.onDelete(this.button.id);
                                this.props.close();
                            }
                        });
                    }} allowDisabledFocus />}
                    <Confirmation
                        onCancel={this.props.close}
                        onConfirm={() => {
                            if (this.label == undefined) {
                                return;
                            }

                            if (this.validateButtonLabel(this.label) != undefined) {
                                return;
                            }

                            const actions: PushbuttonAction[] = [];
                            for (const action of this.button.actions) {
                                if (action.input_id == -1 || action.output_id == -1) {
                                    continue;
                                }

                                actions.push(action);
                            }

                            console.log(actions)
                            if (actions.length != 0) {
                                this.button.label = this.label;
                                this.button.actions = actions;
                                console.log(this.button);
                                this.props.onConfirm(this.button);
                            } else {
                                return;
                            }


                            this.props.close();
                        }} />
                </Stack>
            </Modal>
        );
    }
}