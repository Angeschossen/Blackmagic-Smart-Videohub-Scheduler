import { CommandBarButton, IContextualMenuItem, IIconProps } from "@fluentui/react";
import React, { useEffect, useState } from "react";
import EditVideohubModal from "../modals/EditVideohubModal";
import { getRandomKey } from "../utils/commonutils";
import { Videohub } from "../interfaces/Videohub";
import { useClientSession } from "../auth/ClientAuthentication";
import Permissions from "../../backend/authentication/Permissions";
import { Key } from "readline";
import { Button, Menu, MenuTrigger, MenuList, MenuItemRadio, MenuItem, MenuPopover, MenuProps, DialogTrigger } from "@fluentui/react-components";
import { Clock12Filled } from "@fluentui/react-icons";
import { InputModal } from "../modals/InputModalNew";

const videohubIcon: IIconProps = { iconName: 'HardDriveGroup' };

interface InputProps {
    videohubs: Videohub[],
    onSelectVideohub: (videohub: Videohub) => void,
}

export const SelectVideohub = (props: InputProps) => {

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

    console.log(open)
    return (
        <>
            <Menu>
                <MenuTrigger>
                    <Button>Select Videohub</Button>
                </MenuTrigger>
                <MenuPopover>
                    <MenuList checkedValues={checkedValues} onCheckedValueChange={onChange}>
                        {props.videohubs.map(videohub =>
                            <MenuItemRadio key={`videohub_${videohub.id}`} name="select" value={videohub.id.toString()}>
                                {videohub.name}
                            </MenuItemRadio>
                        )}
                        <DialogTrigger>
                            <MenuItem
                                disabled={!canEdit}
                                onClick={() => {
                                    setOpen(true)
                                }}>
                                Add
                            </MenuItem>
                        </DialogTrigger>
                    </MenuList>
                </MenuPopover>
            </Menu>
            <InputModal
                open={open}
                onOpenChange={(_e, data) => { setOpen(data.open) }}
                onConfirm={function (obj?: any): string | undefined {
                    throw new Error("Function not implemented.");
                }}
                title={"Add Videohub"}>
            </InputModal>
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