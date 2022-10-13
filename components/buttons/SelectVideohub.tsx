import { CommandBarButton, IContextualMenuItem, IIconProps } from "@fluentui/react";
import React, { useEffect, useState } from "react";
import EditVideohubModal from "../modals/EditVideohubModal";
import { getRandomKey } from "../utils/commonutils";
import { Videohub } from "../interfaces/Videohub";
import { useClientSession } from "../auth/ClientAuthentication";
import Permissions from "../../backend/authentication/Permissions";
import { Key } from "readline";
const videohubIcon: IIconProps = { iconName: 'HardDriveGroup' };

interface InputProps {
    videohubs: Videohub[],
    onSelectVideohub: (videohub: Videohub) => void,
}

//  { open?: boolean, modal?: number }
export const SelectVideohub = (props: InputProps) => {

    const [modalData, setModalData] = useState<{ modalKey: number, isOpen: boolean }>({ modalKey: getRandomKey(), isOpen: false });
    const canEdit: boolean = useClientSession(Permissions.PERMISSION_VIDEOHUB_EDIT);

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
                    setModalData({ modalKey: getRandomKey(), isOpen: true });
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
            <EditVideohubModal
                isOpen={modalData.isOpen}
                videohubs={props.videohubs}
                onConfirm={function (videohub: Videohub): void {
                    props.videohubs.push(videohub);
                }}
                modalKey={modalData.modalKey}
                close={function (): void {
                    setModalData({ modalKey: getRandomKey(), isOpen: false });
                }} />
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