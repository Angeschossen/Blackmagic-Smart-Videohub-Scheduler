import { Stack } from "@fluentui/react";
import { Button, InputProps, Label, useId } from "@fluentui/react-components";
import { Dropdown, InputField, Option } from "@fluentui/react-components/unstable";
import { DeleteFilled, DeleteRegular } from "@fluentui/react-icons";
import { buttonBaseClasses } from "@mui/material";
import { width } from "@mui/system";
import React from "react";
import { InputState } from "../../input/HandledInputField";
import { PushButton, PushButtonTrigger } from "../../interfaces/PushButton";
import { getRandomKey } from "../../utils/commonutils";
import { getPostHeader } from "../../utils/fetchutils";
import { stackTokens, useInputStyles } from "../../utils/styles";
import { InputModal } from "../InputModalNew";

interface Day {
    label: string,
    value: number
}

const days: Day[] = [
    {
        label: 'Sunday',
        value: 0,
    },
    {
        label: 'Monday',
        value: 1,
    },
    {
        label: 'Tuesday',
        value: 2,
    },
    {
        label: 'Wednesday',
        value: 3,
    },
    {
        label: 'Thursday',
        value: 4,
    },
    {
        label: 'Friday',
        value: 5,
    },
    {
        label: 'Saturday',
        value: 6,
    }
]

const Trigger = (props: {
    id: string,
    trigger: PushButtonTrigger,
    onSelectDay: (index: number) => void,
    onDelete: () => void,
}) => {
    const date = new Date(props.trigger.time)
    const [time, setTime] = React.useState<InputState>({ value: date.toLocaleTimeString() || "" })
    const inputDaysId = useId('input_days')
    const inputTimeId = useId('input_time')
    const styles = useInputStyles()

    const onChangeTime: InputProps['onChange'] = (_ev, data) => {
        setTime({ value: data.value })

        const date: Date = new Date()
        const d: string[] = data.value.split(":")
        date.setHours(Number(d[0]))
        date.setMinutes(Number(d[1]))
        props.trigger.time = date.toUTCString()
    }

    function getDayFromValue(value: string) {
        for (const day of days) {
            if (day.label === value) {
                return day
            }
        }
    }

    return (
        <Stack key={props.id} tokens={{ childrenGap: 10 }}>
            <Stack.Item>
                <div className={styles.root}>
                    <Label htmlFor={inputTimeId}>Time</Label>
                    <InputField
                        type="time"
                        value={time.value}
                        onChange={onChangeTime}
                        id={inputTimeId}
                        validationState={time.validation?.state}
                        validationMessage={time.validation?.message}
                    />
                </div>
            </Stack.Item>
            <Stack.Item>
                <div className={styles.root}>
                    <Label htmlFor={inputDaysId}>Days</Label>
                    <Dropdown
                        multiselect
                        id={inputDaysId}
                        defaultSelectedOptions={props.trigger.days.map(day => days[day.day].label)}
                        placeholder="Select days"
                        onOptionSelect={(_event: any, data: any) => {
                            const val = getDayFromValue(data.optionValue)?.value
                            if (val != undefined) {
                                props.onSelectDay(val)
                            }
                        }}>
                        {days.map(day =>
                            <Option key={`input_${day.value}`} value={day.label}>
                                {day.label}
                            </Option>)}
                    </Dropdown>
                </div>
            </Stack.Item>
            <Stack.Item>
                <Button
                    size="small"
                    icon={<DeleteRegular />}
                    onClick={() => props.onDelete()}
                />
            </Stack.Item>
        </Stack>
    )
}
export const PushButtonScheduleModal = (props: { button: PushButton, trigger: JSX.Element, }) => {
    const [triggers, setTriggers] = React.useState<PushButtonTrigger[]>(props.button.triggers.length == 0 ? [{ id: -1, pushbutton_id: props.button.id, time: "", days: [] }] : props.button.triggers)

    function createTriggerComponent(trigger: PushButtonTrigger, id: string) {
        return (
            <Trigger
                id={id}
                trigger={trigger}
                onSelectDay={function (value: number): void {
                    trigger.days.push({ day: value, pushbutton_id: props.button.id, pushbuttontrigger_id: trigger.id });
                }}
                onDelete={function (): void {
                    const index = triggers.indexOf(trigger)
                    if (index != -1) {
                        const arr = [...triggers]
                        arr.splice(index, 1)
                        setTriggers(arr)
                    }
                }} />
        )
    }
    return (
        <InputModal
            {...props}
            title={"Triggers"}
            trigger={props.trigger}
            handleSubmit={async function (): Promise<string | undefined> {
                const b: PushButton = props.button
                b.triggers = triggers
                const res = await fetch('/api/pushbuttons/update', getPostHeader(b))
                if (res.status != 200) {
                    return Promise.resolve("Failed")
                }

                return Promise.resolve(undefined)
            }}>
            <Stack tokens={stackTokens}>
                {triggers.map((trigger, index) => createTriggerComponent(trigger, `trigger_${index}`))}
            </Stack>
            <Button
                onClick={() => {
                    const arr = [...triggers]
                    arr.push({ id: -1, pushbutton_id: props.button.id, time: "", days: [] })
                    setTriggers(arr)
                }}>
                Add Trigger
            </Button>
        </InputModal>
    )
}