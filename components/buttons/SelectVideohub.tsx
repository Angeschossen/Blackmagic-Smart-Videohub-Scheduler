import { CommandBarButton, IContextualMenuItem, IIconProps } from "@fluentui/react";
import React, { useEffect, useState } from "react";
import EditVideohubModal from "../modals/EditVideohubModal";
import { getRandomKey } from "../utils/commonutils";
import { Videohub } from "../interfaces/Videohub";
import { useClientSession } from "../auth/ClientAuthentication";
import Permissions from "../../backend/authentication/Permissions";
const videohubIcon: IIconProps = { iconName: 'HardDriveGroup' };

interface InputProps {
    videohubs: Videohub[],
    onSelectVideohub: (videohub: Videohub) => void,
}

//  { open?: boolean, modal?: number }
export const SelectVideohub = (props: InputProps) => {

    const [isOpen, setIsOpen] = useState(false);
    const [modalKey, setModalKey] = useState<number>(getRandomKey());

    useEffect(() => {
        setModalKey(getRandomKey());
    }, [isOpen])

    const canEdit = useClientSession(Permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT);

    function generateMenuItems(): IContextualMenuItem[] {
        const menuItems: IContextualMenuItem[] = [];
        for (const hub of props.videohubs) {
            menuItems.push({
                key: hub.id.toString(),
                text: hub.name,
                iconProps: { iconName: 'Calendar' },
                onClick: () => {
                    props.onSelectVideohub(hub);
                }
            });
        }

        if (canEdit) {
            menuItems.push({
                key: "add",
                text: "Add",
                iconProps: { iconName: 'Add' },
                onClick: () => {
                    setIsOpen(true);
                }
            });
        }

        return menuItems;
    }

    if (!canEdit && props.videohubs.length == 0) {
        return <></>;
    }

    return (
        <>
            {isOpen &&
                <EditVideohubModal
                    key={modalKey}
                    isOpen={true}
                    videohubs={props.videohubs}
                    onConfirm={function (videohub: Videohub): void {
                        props.videohubs.push(videohub);
                    }} />
            }
            <CommandBarButton
                iconProps={videohubIcon}
                text={"Select Videohub"}
                menuProps={{
                    items: generateMenuItems(),
                }}
            />
        </>
    );
}

export default SelectVideohub;