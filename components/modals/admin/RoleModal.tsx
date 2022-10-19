import { Input, InputProps, Label, useId } from "@fluentui/react-components";
import React from "react";
import { Role } from "../../interfaces/User"
import { getPostHeader } from "../../utils/fetchutils";
import { useInputStyles } from "../../utils/styles";
import { InputModal } from "../InputModalNew"

interface Props {
    role?: Role,
    roles: Role[],
    trigger: JSX.Element,
    onRoleUpdate: (role: Role)=>void,
}

export const RoleModal = (props: Props) => {
    const styles = useInputStyles();
    const inputIdIP = useId('ip');

    const [name, setName] = React.useState<string>("");

    const onChangeName: InputProps['onChange'] = (_ev, data) => {
        if (data.value.length < 32) {
            setName(data.value);
        }
    };

    return (
        <InputModal
            trigger={props.trigger}
            title={props.role == undefined ? "Create Role" : "Edit Role"}
            handleSubmit={function (): Promise<string | undefined> {
                if (name == undefined) {
                    return Promise.resolve("You must provide a name.");
                }

                for (const role of props.roles) {
                    if (role.name === name) {
                        return Promise.resolve("A role with this name already exists.");
                    }
                }

                let role: Role;
                if (props.role == undefined) {
                    role = { id: -1, name: name, outputs: [], permissions: [] };
                } else {
                    role = props.role;
                    role.name = name;
                }

                return fetch('/api/roles/upsert', getPostHeader({ role: role })).then(async res => {
                    const json = await res.json();
                    console.log(json);
                    props.onRoleUpdate({id: json.id, name: json.name, outputs: role.outputs, permissions: role.permissions})
                    return undefined;
                })
            }}>
            <div className={styles.root}>
                <Label htmlFor={inputIdIP}>Name</Label>
                <Input value={name} onChange={onChangeName} id={inputIdIP} />
            </div>
        </InputModal>
    )
}