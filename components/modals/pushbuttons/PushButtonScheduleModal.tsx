import { Stack } from "@fluentui/react";
import { Button, InputProps, Label, useId } from "@fluentui/react-components";
import { Dropdown, InputField, Option } from "@fluentui/react-components/unstable";
import { AddRegular, DeleteRegular } from "@fluentui/react-icons";
import React from "react";
import { InputState } from "../../input/HandledInputField";
import { IPushButton, IPushButtonTrigger } from "../../interfaces/PushButton";
import { convertDateToLocal } from "../../utils/dateutils";
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
    num: number,
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
                <h3>#{props.num}</h3>
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
                        style={{ maxWidth: 200 }}
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
                    <Button
                        size="small"
                        icon={<DeleteRegular />}
                        onClick={() => props.onDelete()}
                    />
                </div>
            </Stack.Item>
        </Stack>
    )
}

function collectTriggers(button: IPushButton): IPushButtonTrigger[] {
    const triggers: Map<string, IPushButtonTrigger> = new Map()
    for (const trigger of button.triggers) {
        const tr: IPushButtonTrigger | undefined = triggers.get(trigger.id)
        const time: Date = convertDateToLocal(trigger.time)
        const day: number = time.getDay()

        if (tr == undefined) {
            triggers.set(trigger.id, { id: trigger.id, pushbutton_id: button.id, time: time, days: [day] })
        } else {
            if (tr.days.indexOf(day) === -1) {
                tr.days.push(day) // because of (x,y,z) key (action)
            }
        }
    }

    return Array.from(triggers.values())
}

function getDefaultDate() {
    const date: Date = new Date()
    date.setSeconds(0)
    date.setMinutes(0)
    return date
}

export const PushButtonScheduleModal = (props: { button: IPushButton, trigger: JSX.Element, }) => {
    const [triggers, setTriggers] = React.useState<IPushButtonTrigger[]>(props.button.triggers.length == 0 ? [{ id: "null", pushbutton_id: props.button.id, time: getDefaultDate(), days: [] }] : collectTriggers(props.button))

    function createTriggerComponent(trigger: IPushButtonTrigger, index: number) {
        if (!(trigger.time instanceof Date)) {
            trigger.time = convertDateToLocal(trigger.time)
        }

        return (
            <Trigger
                num={index + 1}
                key={`trigger_${index}`}
                trigger={trigger}
                onSelectDay={function (value: number): void {
                    const index: number = trigger.days.indexOf(value)
                    if (index === -1) {
                        trigger.days.push(value)
                    } else {
                        trigger.days.splice(index, 1)
                    }
                }}
                onChangeTime={((value: string) => {
                    const date: Date = new Date()
                    const d: string[] = value.split(":")
                    date.setHours(Number(d[0]))
                    date.setMinutes(Number(d[1]))
                    date.setSeconds(d.length > 2 ? Number(d[2]) : 0)

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
            description="You can add multiple triggers for each button. However, they can only be executed when the videohub is reachable."
            handleSubmit={async function (): Promise<string | undefined> {
                const res = await fetch('/api/pushbuttons/setTriggers', getPostHeader({ pushbutton_id: props.button.id, videohub_id: props.button.videohub_id, actions: props.button.actions, triggers: triggers }))
                if (res.status != 200) {
                    return Promise.resolve("Failed")
                }

                return Promise.resolve(undefined)
            }}>
            <Stack tokens={stackTokens}>
                {triggers.map((trigger, index) => createTriggerComponent(trigger, index))}
            </Stack>
            <Button
                icon={<AddRegular />}
                onClick={() => {
                    const arr = [...triggers]
                    arr.push({ id: "null", pushbutton_id: props.button.id, time: getDefaultDate(), days: [] })
                    setTriggers(arr)
                }}>
                Add Trigger
            </Button>
        </InputModal>
    )
}