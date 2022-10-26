import { Stack } from "@fluentui/react";
import { Button, InputProps, Label, useId } from "@fluentui/react-components";
import { Dropdown, InputField, Option } from "@fluentui/react-components/unstable";
import { DeleteFilled, DeleteRegular } from "@fluentui/react-icons";
import { buttonBaseClasses } from "@mui/material";
import { width } from "@mui/system";
import { triggerAsyncId } from "async_hooks";
import React from "react";
import { InputState } from "../../input/HandledInputField";
import { IPushButtonTrigger, PushButton } from "../../interfaces/PushButton";
import { getRandomKey } from "../../utils/commonutils";
import { convert_date_to_utc } from "../../utils/dateutils";
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
    trigger: IPushButtonTrigger,
    onSelectDay: (index: number) => void,
    onChangeTime: (value: string) => void,
    onDelete: () => void,
}) => {
    const [time, setTime] = React.useState<InputState>({ value: props.trigger.time.toLocaleTimeString() })
    const inputDaysId = useId('input_days')
    const inputTimeId = useId('input_time')
    const styles = useInputStyles()

    const onChangeTime: InputProps['onChange'] = (_ev, data) => {
        setTime({ value: data.value })
        props.onChangeTime(data.value)
    }

    function getDayFromValue(value: string) {
        for (const day of days) {
            if (day.label === value) {
                return day
            }
        }
    }

    return (
        <Stack tokens={{ childrenGap: 10 }}>
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
                        defaultSelectedOptions={props.trigger.days.map((day: number) => days[day].label)}
                        placeholder="Select days"
                        onOptionSelect={(_event: any, data: any) => {
                            const val = getDayFromValue(data.optionValue)?.value
                            if (val != undefined) {
                                props.onSelectDay(val)
                            }
                        }}>
                        {days.map(day =>
                            <Option key={`${inputDaysId}_day_${day.value}`} value={day.label}>
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

function collectTriggers(button: PushButton): IPushButtonTrigger[] {
    const triggers: Map<string, IPushButtonTrigger> = new Map()
    for (const trigger of button.triggers) {
        const tr: IPushButtonTrigger | undefined = triggers.get(trigger.id)
        if (tr == undefined) {
            triggers.set(trigger.id, { id: trigger.id, pushbutton_id: button.id, time: trigger.time, days: [trigger.day] })
        } else {
            tr.days.push(trigger.day)
        }
    }

    return Array.from(triggers.values())
}

export function convertTriggerTime(date: string) {
    const index: number = date.indexOf('T')
    if (index === -1) {
        throw Error("Time part not found.")
    }

    const parts: string[] = date.substring(index + 1, index + 6).split(':')

    const d: Date = new Date()
    d.setUTCHours(Number(parts[0]))
    d.setUTCMinutes(Number(parts[1]))
    return d
}

export const PushButtonScheduleModal = (props: { button: PushButton, trigger: JSX.Element, }) => {
    const [triggers, setTriggers] = React.useState<IPushButtonTrigger[]>(props.button.triggers.length == 0 ? [{ id: "null", pushbutton_id: props.button.id, time: new Date(), days: [] }] : collectTriggers(props.button))

    function createTriggerComponent(trigger: IPushButtonTrigger, id: string) {
        if (!(trigger.time instanceof Date)) {
            trigger.time = convertTriggerTime(trigger.time)
        }

        return (
            <Trigger
                key={id}
                trigger={trigger}
                onSelectDay={function (value: number): void {
                    if (trigger.days.indexOf(value) === -1) {
                        trigger.days.push(value)
                    }
                }}
                onChangeTime={((value: string) => {
                    const date: Date = new Date()
                    const d: string[] = value.split(":")
                    date.setHours(Number(d[0]))
                    date.setMinutes(Number(d[1]))
                    trigger.time = date
                })}
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
                const res = await fetch('/api/pushbuttons/setTriggers', getPostHeader({ pushbutton_id: props.button.id, videohub_id: props.button.videohub_id, actions: props.button.actions, triggers: triggers }))
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
                    arr.push({ id: "null", pushbutton_id: props.button.id, time: new Date(), days: [] })
                    setTriggers(arr)
                }}>
                Add Trigger
            </Button>
        </InputModal>
    )
}