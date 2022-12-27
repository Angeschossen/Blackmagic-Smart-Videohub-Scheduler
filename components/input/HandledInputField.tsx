import { InputProps, Label } from "@fluentui/react-components";
import { InputField, InputFieldProps } from "@fluentui/react-components/unstable";
import React from "react";
import { useInputStyles } from "../utils/styles";


export interface InputState {
    value: any,
    validation?: {
        state: "success" | "error",
        message: string,
    }
}

export const HandledInputField = (props: { id: string, value: string, onChangeInput: (value: string) => string | undefined } & InputFieldProps) => {
    const [data, setData] = React.useState<{ error?: string, value: string }>({ error: undefined, value: props.value })
    const styles = useInputStyles()

    const onChangeInput: InputProps['onChange'] = (_ev, data) => {
        setData({ error: props.onChangeInput(data.value), value: data.value })
    }

    return (
        <div className={styles.root}>
            <Label htmlFor={props.id}>Name</Label>
            <InputField
                value={data.value}
                onChange={onChangeInput}
                id={props.id}
                validationState={data.error == undefined ? "success" : "error"}
                validationMessage={data.error == undefined ? data.value.trim().length != 0 ? "The name is valid." : undefined : data.error}
            />
        </div>
    )
}