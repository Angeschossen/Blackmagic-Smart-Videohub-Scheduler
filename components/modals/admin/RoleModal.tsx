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
    onRoleCreate?: (role: Role) => void,
    onRoleUpdate?: (role: Role) => void,
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
                    return Promise.resolve("You must provide a name.")
                }

                if (name.length == 0 || name.length > 32) {
                    return Promise.resolve("The name must be between 1 and 32 characters long.")
                }

                for (const role of props.roles) {
                    if (role.name === name) {
                        return Promise.resolve("A role with this name already exists.")
                    }
                }

                let role: Role;
                let create: boolean;
                if (props.role == undefined) {
                    role = { id: -1, name: name, outputs: [], permissions: [], editable: true };
                    create = true
                } else {
                    role = props.role;
                    role.name = name;
                    create = false
                }

                return fetch('/api/roles/upsert', getPostHeader({ role: role })).then(async res => {
                    const json = await res.json();

                    const resRole: Role = { id: json.id, name: json.name, outputs: role.outputs, permissions: role.permissions, editable: json.editable }
                    console.log(create)
                    if (create) {
                        if (props.onRoleCreate != undefined) {
                            props.onRoleCreate(resRole)
                        }
                    } else {
                        if (props.onRoleUpdate != undefined) {
                            props.onRoleUpdate(resRole)
                        }
                    }

                    return undefined;
                })
            }}>
            <div className={styles.root}>
                <Label htmlFor={inputIdIP}>Name</Label>
                <Input value={name} onChange={onChangeName} id={inputIdIP} />
            </div>
        </InputModal >
    )
}