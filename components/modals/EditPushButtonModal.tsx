import { CommandBarButton, DefaultButton, Dropdown, IDropdownOption, IDropdownStyles, IIconProps, IModalProps, IModalStyles, IStackTokens, Modal, PrimaryButton, Stack } from "@fluentui/react";
import { PropaneSharp } from "@mui/icons-material";
import React from "react";
import { Confirmation, ConfirmationProps } from "../buttons/Confirmation";
import { Videohub } from "../Videohub";

const stackTokens: IStackTokens = { childrenGap: 20 };
const dropdownStyles: Partial<IDropdownStyles> = {
    dropdown: { width: 300 },
};
const addIcon: IIconProps = { iconName: 'Add' };


interface InputProps extends IModalProps {
    optionsInput: IDropdownOption[],
    optionsOutput: IDropdownOption[],
    close: () => void,
    onConfirm: (routings: Routing[]) => void,
}


interface RoutingComponentProps {
    optionsInput: IDropdownOption[],
    optionsOutput: IDropdownOption[],
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
                options={this.props.optionsOutput}
                styles={dropdownStyles}
                onChange={(_event, _option, index) => {
                    this.props.onSelectOutput(index);
                }}
            />
            <Dropdown
                placeholder="Select an input"
                label="Input"
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
    output?: number,
    input?: number,
}
export class EditPushButtonModal extends React.Component<InputProps, { routings: Routing[] }> {

    private routingComponents: RoutingComponent[] = [];

    constructor(props: InputProps) {
        super(props);

        this.state = { routings: [] };

        this.addRoutingComponent = this.addRoutingComponent.bind(this);
        this.setRouting = this.setRouting.bind(this);

        this.addRoutingComponent();
    }

    addRoutingComponent() {
        const id = this.setRouting(undefined, undefined, undefined);
        this.routingComponents.push(new RoutingComponent({
            optionsOutput: this.props.optionsOutput,
            optionsInput: this.props.optionsInput,
            onSelectOutput: (index?: number) => {
                this.setRouting(id, index, this.state.routings[id].input)
            },
            onSelectInput: (index?: number) => {
                this.setRouting(id, this.state.routings[id].output, index)
            }
        }));
    }

    setRouting(routingId?: number, output?: number, input?: number): number {
        const arr: Routing[] = this.state.routings.slice();

        if (routingId == undefined) {
            routingId = arr.length;
            arr.push({ output: output, input: input });
        } else {
            arr[routingId].output = output;
            arr[routingId].input = input;
        }

        this.setState({ routings: arr });
        return routingId;
    }

    render(): React.ReactNode {
        return (
            <Modal isOpen={this.props.isOpen}>
                <Stack tokens={stackTokens} styles={{ root: { margin: '1vh' } }}>
                    <Stack>
                        {this.routingComponents.map((component, index) => {
                            return <React.Fragment key={index}>
                                {component.render()}
                            </React.Fragment>
                        })}
                    </Stack>
                    <DefaultButton text="Add another one" onClick={() => this.addRoutingComponent()} allowDisabledFocus/>
                    <Confirmation
                        onCancel={this.props.close}
                        onConfirm={() => {
                            this.props.close();
                            this.props.onConfirm(this.state.routings);
                        }} />
                </Stack>
            </Modal>
        );
    }
}