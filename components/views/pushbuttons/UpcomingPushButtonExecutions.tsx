import { Stack } from "@fluentui/react";
import { ClockRegular } from "@fluentui/react-icons";
import { AlertMessage } from "../../common/AlertMessage";
import { IUpcomingPushButton } from "../../interfaces/PushButton";
import { convertTriggerTime } from "../../modals/pushbuttons/PushButtonScheduleModal";


export const ScheduledButtons = (props: { scheduledButtons: IUpcomingPushButton[] }) => {
    if (props.scheduledButtons.length === 0) {
        return undefined
    }

    const button: IUpcomingPushButton = props.scheduledButtons[0]
    return (
        <AlertMessage
            icon={<ClockRegular />}
            message={`Next automated execution: ${button.label} at ${convertTriggerTime(button.time).toLocaleTimeString()}`} />
    )
}