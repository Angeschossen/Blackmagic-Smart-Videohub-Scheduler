import { CommandBarButton, IContextualMenuItem, IIconProps } from "@fluentui/react";
import React from "react";
import EditVideohubModal from "../modals/EditVideohubModal";
import { getRandomKey } from "../utils/commonutils";
import { Videohub } from "../Videohub";
const videohubIcon: IIconProps = { iconName: 'HardDriveGroup' };

interface InputProps {
    videohubs: Videohub[],
    onSelectVideohub: (videohub: Videohub) => void,
}

export default class SelectVideohub extends React.Component<InputProps, { open?: boolean, modal?: number }> {

    constructor(props: InputProps) {
        super(props);

        this.state = { open: false };
    }

    generateMenuItems(): IContextualMenuItem[] {
        const menuItems: IContextualMenuItem[] = [];
        for (const hub of this.props.videohubs) {
            menuItems.push({
                key: hub.id.toString(),
                text: hub.name,
                iconProps: { iconName: 'Calendar' },
                onClick: () => {
                    this.props.onSelectVideohub(hub);
                }
            });
        }

        menuItems.push({
            key: "add",
            text: "Add",
            iconProps: { iconName: 'Add' },
            onClick: () => {
                this.setState({ open: true, modal: getRandomKey() });
            }
        });

        return menuItems;
    }

    render() {
        const inst: SelectVideohub = this;
        return (
            <>
                {this.state.open &&
                    <EditVideohubModal
                        key={this.state.modal}
                        isOpen={true}
                        videohubs={this.props.videohubs}
                        onConfirm={function (videohub: Videohub): void {
                            inst.props.videohubs.push(videohub);
                        }} />
                }
                <CommandBarButton
                    iconProps={videohubIcon}
                    text={"Select Videohub"}
                    menuProps={{
                        items: this.generateMenuItems(),
                    }}
                />
            </>
        );
    }
}