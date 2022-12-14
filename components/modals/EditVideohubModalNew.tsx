import { Input, InputProps, Label, useId } from "@fluentui/react-components";
import React from "react";
import { Videohub } from "../interfaces/Videohub";
import { getPostHeader } from "../utils/fetchutils";
import { useInputStyles } from "../utils/styles";
import { InputModal } from "./InputModalNew";

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

    const [ip, setIP] = React.useState(props.edit?.ip || "");
    const [name, setName] = React.useState(props.edit?.name || "");
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
            handleSubmit={async () => {
                let inputName: string | undefined = name?.toLocaleLowerCase();
                if (inputName != undefined) {
                    inputName = inputName.trim()

                    if (inputIdName.length > 32) {
                        return Promise.resolve("The name can't be longer than 32 characters.")
                    }

                    for (const b of props.videohubs) {
                        if (b.name.toLowerCase() === inputName && b != props.edit) {
                            return Promise.resolve("A videohub with this name already exists.");
                        }
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
                const nameFinal: string = inputName.length == 0 ? inputIP : inputName
                if (props.edit == undefined) {
                    videohub = { id: -1, connected: false, inputs: [], outputs: [], version: 'unkown', ip: inputIP, name: nameFinal }
                } else {
                    videohub = props.edit
                    videohub.ip = inputIP
                    videohub.name = nameFinal
                }

                await fetch('/api/videohubs/update', getPostHeader(videohub)).then(async res => {
                    if (res.status === 200) {
                        props.onVideohubUpdate(await res.json())
                    }
                })
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