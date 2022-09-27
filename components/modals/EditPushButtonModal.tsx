import { CommandBarButton, DefaultButton, Dropdown, IDropdownOption, IDropdownStyles, IIconProps, IModalProps, IModalStyles, IStackTokens, Modal, PrimaryButton, Stack, TextField } from "@fluentui/react";
import { PropaneSharp } from "@mui/icons-material";
import { buttonProperties } from "office-ui-fabric-react";
import React from "react";
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
    buttons: PushButton[],
    button?: PushButton,
    close: () => void,
    onConfirm: (name: string, actions: PushbuttonAction[]) => void,
}


interface RoutingComponentProps {
    optionsInput: IDropdownOption[],
    optionsOutput: IDropdownOption[],
    routing: Routing,
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
                selectedKey={this.props.routing == undefined ? undefined : this.props.routing.output}
                options={this.props.optionsOutput}
                styles={dropdownStyles}
                onChange={(_event, _option, index) => {
                    this.props.onSelectOutput(index);
                }}
            />
            <Dropdown
                placeholder="Select an input"
                label="Input"
                selectedKey={this.props.routing == undefined ? undefined : this.props.routing.input}
                options={this.props.optionsInput}
                styles={dropdownStyles}
                onChange={(_event, _option, index) => {
                    this.props.onSelectInput(index);
                }}
            />
        </Stack >;
    }
}

export interface Routing {
    id: number,
    output?: number,
    input?: number,
}

export class EditPushButtonModal extends React.Component<InputProps, { label?: string, routings: Routing[] }> {

    private routingComponents: RoutingComponent[] = [];
    private mounted: boolean = false;
    constructor(props: InputProps) {
        super(props);

        this.state = { routings: [] };
        this.addRoutingComponent = this.addRoutingComponent.bind(this);
        this.validateButtonLabel = this.validateButtonLabel.bind(this);
        this.setRouting = this.setRouting.bind(this);
    }

    componentDidMount() {
        if (this.mounted) {
            return;
        }

        this.mounted = true;

        if (this.props.button == undefined) {
            this.addRoutingComponent(false, undefined, undefined, undefined);
        } else {
            for (const action of this.props.button.actions) {
                this.addRoutingComponent(true, action.id, action.output_id, action.input_id);
            }

            this.setState({ label: this.props.button.label });
        }
    }

    addRoutingComponent(push: boolean, id?: number, output?: number, input?: number) {
        id = this.setRouting(push, id, output, input);
        this.routingComponents.push(new RoutingComponent({
            routing: { id: id, input: input, output: output },
            optionsOutput: this.props.optionsOutput,
            optionsInput: this.props.optionsInput,
            onSelectOutput: (index?: number) => {
                this.setRouting(false, id, index, undefined);
            },
            onSelectInput: (index?: number) => {
                this.setRouting(false, id, undefined, index);
            }
        }));
    }

    setRouting(push: boolean, routingId?: number, output?: number, input?: number): number {
        const arr: Routing[] = this.state.routings.slice();

        if (routingId == undefined || push) {
            if (push) {
                if (routingId == undefined) {
                    throw Error("Routing id must be set if push true.");
                }
            } else {
                routingId = arr.length;
            }

            arr.push({ id: routingId, output: output, input: input });
        } else {
            if (output != undefined) {
                arr[routingId].output = output;
            }

            if (input != undefined) {
                arr[routingId].input = input;
            }
        }

        this.setState({ routings: arr });
        return routingId;
    }

    validateButtonLabel(input: string): string {
        input = input.toLowerCase();
        for (const b of this.props.buttons) {
            if (b.label.toLowerCase() === input && b != this.props.button) {
                return "A button with this name already exists.";
            }
        }

        return "";
    }

    render(): React.ReactNode {
        return (
            <Modal isOpen={this.props.isOpen}>
                <Stack tokens={stackTokens} styles={{ root: { margin: '1vh' } }}>
                    <TextField label="Required" required
                        onChange={(_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, val?: string) => {
                            this.setState({ label: val });
                        }}
                        value={this.props.button == undefined ? undefined : this.props.button.label}
                        validateOnLoad={false}
                        validateOnFocusOut={true}
                        onGetErrorMessage={(value: string) => {
                            console.log("GGET")
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
                    <DefaultButton text="Add another one" onClick={() => this.addRoutingComponent(false)} allowDisabledFocus />
                    <Confirmation
                        onCancel={this.props.close}
                        onConfirm={() => {
                            console.log(this.state);
                            if (this.state.label != undefined) {
                                if (!this.validateButtonLabel(this.state.label)) {
                                    return;
                                }

                                if (this.props.button == null) {
                                    const actions: PushbuttonAction[] = [];
                                    for (const r of this.state.routings) {
                                        if (r.input == undefined || r.output == undefined) {
                                            continue;
                                        }

                                        actions.push({
                                            id: -1,
                                            pushbutton_id: -1,
                                            videohub_id: this.props.videohub.id,
                                            output_id: r.output,
                                            input_id: r.input,
                                        });
                                    }

                                    if (actions.length != 0) {
                                        this.props.onConfirm(this.state.label, actions);
                                    } else {
                                        return;
                                    }
                                }else{
                                    this.props.button.label = this.state.label;
                                }
                            }


                            this.props.close();
                        }} />
                </Stack>
            </Modal>
        );
    }
}