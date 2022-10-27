import { IIconProps } from "@fluentui/react";
import { Menu, MenuButton, MenuItem, MenuItemRadio, MenuList, MenuPopover, MenuProps, MenuTrigger } from "@fluentui/react-components";
import React from "react";
import Permissions from "../../backend/authentication/Permissions";
import { useClientSession } from "../auth/ClientAuthentication";
import { Videohub } from "../interfaces/Videohub";
import { EditVideohubModal } from "../modals/EditVideohubModalNew";
import { getRandomKey } from "../utils/commonutils";

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
    )
}

export default SelectVideohub;