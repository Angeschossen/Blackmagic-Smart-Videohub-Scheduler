import { ClockRegular } from "@fluentui/react-icons";
import React from "react";
import { AlertMessage } from "../../common/AlertMessage";
import { IUpcomingPushButton } from "../../interfaces/PushButton";
import { convertDateToLocal } from "../../utils/dateutils";


export const ScheduledButtons = (props: { scheduledButtons: IUpcomingPushButton[] }) => {
    if (props.scheduledButtons.length === 0) {
        return <></>
    }

    const button: IUpcomingPushButton = props.scheduledButtons[0]
    return (
        <AlertMessage
            icon={<ClockRegular />}
            message={`Next automated execution: ${button.label} at ${convertDateToLocal(button.time).toLocaleTimeString()}`} />
    )
}