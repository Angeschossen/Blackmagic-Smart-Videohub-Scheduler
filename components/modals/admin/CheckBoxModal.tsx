import { Stack } from "@fluentui/react";
import { Button, Checkbox, CheckboxOnChangeData, MenuList, MenuProps } from "@fluentui/react-components";
import React, { ChangeEvent, useEffect } from "react";
import { Role } from "../../interfaces/User";
import { Videohub } from "../../interfaces/Videohub";
import { getPostHeader } from "../../utils/fetchutils";
import { useInputStyles } from "../../utils/styles";
import { InputModal } from "../InputModalNew";


export interface CheckboxChoice {
    value: string,
    label: string
}

interface Props {
    defaultChecked: string[],
    choices: CheckboxChoice[],
    handleSubmit: (checked: string[]) => Promise<string | undefined>,
    title: string,
    trigger: JSX.Element,
    description?: string,
}

export const CheckBoxModal = (props: Props) => {
    const [checkedValues, setCheckedValues] = React.useState<string[]>(props.defaultChecked);
    const styles = useInputStyles();


    const handleSelected = (id: string) => {
        setCheckedValues(prev => [...prev, id]);
    };

    const handleUnSelected = (index: number) => {
        if (index != -1) {
            setCheckedValues([
                ...checkedValues.slice(0, index),
                ...checkedValues.slice(index + 1, checkedValues.length)
            ]);
        }
    }

    return (
        <InputModal
            description={props.description}
            title={props.title}
            trigger={props.trigger}
            handleSubmit={async function (): Promise<string | undefined> {
                return props.handleSubmit(checkedValues);
            }}>
            <div className={styles.root}>
                {props.choices.map(choice =>
                    <Checkbox key={`checkbox_${choice.value}`} checked={checkedValues.indexOf(choice.value) != -1} label={choice.label} onChange={(_ev: ChangeEvent<HTMLInputElement>, data: CheckboxOnChangeData) => {
                        if (data.checked) {
                            handleSelected(choice.value)
                        } else {
                            handleUnSelected(checkedValues.indexOf(choice.value))
                        }
                    }} />)}
            </div>
        </InputModal>
    )
}