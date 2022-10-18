import { CommandBarButton, IContextualMenuItem, IIconProps } from "@fluentui/react";
import React, { useEffect, useState } from "react";
import { getRandomKey } from "../utils/commonutils";
import { Videohub } from "../interfaces/Videohub";
import { useClientSession } from "../auth/ClientAuthentication";
import Permissions from "../../backend/authentication/Permissions";
import { Key } from "readline";
import { Button, Menu, MenuTrigger, MenuList, MenuItemRadio, MenuItem, MenuPopover, MenuProps, DialogTrigger, MenuButton, useId } from "@fluentui/react-components";
import { Clock12Filled } from "@fluentui/react-icons";
import { InputModal } from "../modals/InputModalNew";
import { EditVideohubModal } from "../modals/EditVideohubModalNew";

const videohubIcon: IIconProps = { iconName: 'HardDriveGroup' };

interface InputProps {
    videohubs: Videohub[],
    onSelectVideohub: (videohub: Videohub) => void,
}

export const SelectVideohub = (props: InputProps) => {
    const [modalKey, setModalKey] = React.useState(getRandomKey());
    const [open, setOpen] = React.useState(false);
    const canEdit: boolean = useClientSession(Permissions.PERMISSION_VIDEOHUB_EDIT);
    const [checkedValues, setCheckedValues] = React.useState<Record<string, string[]>>({
        select: props.videohubs.length == 0 ? [] : [props.videohubs[0].id.toString()]
    });

    const onChange: MenuProps['onCheckedValueChange'] = (e, {
        name,
        checkedItems
    }) => {
        setCheckedValues(s => {
            return s ? {
                ...s,
                [name]: checkedItems
            } : {
                [name]: checkedItems
            };
        });
    };

    return (
        <>
            <Menu>
                <MenuTrigger>
                    <MenuButton>Select Videohub</MenuButton>
                </MenuTrigger>
                <MenuPopover>
                    <MenuList checkedValues={checkedValues} onCheckedValueChange={onChange}>
                        {props.videohubs.map(videohub =>
                            <MenuItemRadio key={`videohub_${videohub.id}`} name="select" value={videohub.id.toString()}>
                                {videohub.name}
                            </MenuItemRadio>
                        )}
                        <MenuItem
                            disabled={!canEdit}
                            onClick={() => {
                                setOpen(true)
                                setModalKey(getRandomKey())
                            }}>
                            Add
                        </MenuItem>
                    </MenuList>
                </MenuPopover>
            </Menu>
            <EditVideohubModal
            key={modalKey}
                open={open}
                onOpenChange={(state: boolean) => setOpen(state)}
                videohubs={props.videohubs}
                onVideohubUpdate={(videohub: Videohub) => setOpen(false)}
                title={"Add Videohub"} />
        </>
    );
    /*
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
    ); */
}

export default SelectVideohub;