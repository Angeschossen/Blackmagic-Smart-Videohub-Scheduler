import { CommandBarButton, IContextualMenuItem, IIconProps } from "@fluentui/react";
import React from "react";
import { Videohub } from "../Videohub";
const videohubIcon: IIconProps = { iconName: 'HardDriveGroup' };

interface InputProps {
    videohubs: Videohub[],
    onSelectVideohub: (videohub: Videohub) => void,
}

function generateMenuItems(res: Videohub[], onSelectVideohub: (hub: Videohub) => void): IContextualMenuItem[] {
    const menuItems: IContextualMenuItem[] = [];
    for (const hub of res) {
        menuItems.push({
            key: hub.id.toString(),
            text: hub.name,
            iconProps: { iconName: 'Calendar' },
            onClick: () => {
                onSelectVideohub(hub);
            }
        });
    }

    return menuItems;
}


export const SelectVideohub = (p: InputProps) => {
    return (
        <>
            <CommandBarButton
                iconProps={videohubIcon}
                text={"Select Videohub"}
                menuProps={{
                    items: generateMenuItems(p.videohubs, p.onSelectVideohub),
                }}
            />
        </>
    );
}