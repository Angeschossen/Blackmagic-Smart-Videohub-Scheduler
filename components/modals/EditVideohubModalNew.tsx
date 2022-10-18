import { IModalProps, IStackTokens, Stack, TextField } from "@fluentui/react";
import React from "react";
import { deepCopy, getRandomKey } from "../utils/commonutils";
import { getPostHeader } from "../utils/fetchutils";
import { Videohub } from "../interfaces/Videohub";
import { InputModal, InputModalProps } from "./InputModalNew";
import { useInputStyles } from "../utils/styles";
import { Input, InputProps, Label, useId } from "@fluentui/react-components";
import { Edit } from "@mui/icons-material";

interface Props {
    videohubs: Videohub[],
    edit?: Videohub,
    onVideohubUpdate: (videohub: Videohub) => void,
    open: boolean,
    trigger?: JSX.Element,
    onOpenChange?: (open: boolean) => void,
    title: string,
}

export const EditVideohubModal = (props: Props) => {
    const inputIdIP = useId('ip');
    const inputIdName = useId('name');

    const [ip, setIP] = React.useState(props.edit?.ip);
    const [name, setName] = React.useState(props.edit?.name);
    const styles = useInputStyles();

    const onChangeIP: InputProps['onChange'] = (_ev, data) => {
        setIP(data.value);
    };

    const onChangeName: InputProps['onChange'] = (_ev, data) => {
        setName(data.value);
    };

    return (
        <InputModal
            open={props.open}
            onOpenChange={props.onOpenChange}
            trigger={props.trigger}
            handleSubmit={() => {
                const inputName = name?.toLocaleLowerCase();
                for (const b of props.videohubs) {
                    if (b.name.toLowerCase() === inputName && b != props.edit) {
                        return Promise.resolve("A videohub with this name already exists.");
                    }
                }

                const inputIP = ip;
                if (inputIP == undefined) {
                    return Promise.resolve("You must provide an ip address.");
                }

                for (const b of props.videohubs) {
                    if (b.ip === inputIP && b != props.edit) {
                        return Promise.resolve("A videohub with this ip address already exists.");
                    }
                }

                let videohub: Videohub;
                const nameFinal: string = inputName || inputIP;
                if (props.edit == undefined) {
                    videohub = { id: -1, connected: false, inputs: [], outputs: [], version: 'unkown', ip: inputIP, name: nameFinal }
                } else {
                    videohub = props.edit
                    videohub.ip = inputIP
                    videohub.name = nameFinal
                }

                return fetch('/api/videohubs/update', getPostHeader(videohub)).then(async res => {
                    props.onVideohubUpdate(await res.json());
                }).then(res => undefined);
            }}
            title={props.title}>
            <div className={styles.root}>
                <Label htmlFor={inputIdIP}>IP-Address</Label>
                <Input value={ip} onChange={onChangeIP} id={inputIdIP} />
                <Label htmlFor={inputIdName}>Name</Label>
                <Input value={name} placeholder={"Get from device"} onChange={onChangeName} id={inputIdName} />
            </div>
        </InputModal>
    )
}