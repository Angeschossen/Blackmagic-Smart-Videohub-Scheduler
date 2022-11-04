import { Stack } from "@fluentui/react";
import { IUpcomingPushButton } from "../../interfaces/PushButton";
import { convertTriggerTime } from "../../modals/pushbuttons/PushButtonScheduleModal";


export const UpcomingTriggers = (props: { scheduledButtons: IUpcomingPushButton[] }) => {
    if (props.scheduledButtons.length === 0) {
        return <p>None today.</p>
    }

    const button: IUpcomingPushButton = props.scheduledButtons[0]
    const next = convertTriggerTime(button.time)
    return (
        <p>Next automated execution: {button.label} at {next.toLocaleTimeString()}</p>
    )
}