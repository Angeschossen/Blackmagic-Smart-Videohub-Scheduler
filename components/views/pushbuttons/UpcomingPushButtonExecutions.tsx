import { ArrowSyncCheckmarkRegular, CalendarCancel16Filled, CalendarCancelRegular, CheckmarkRegular, CheckRegular, ClockRegular, DeleteRegular, DoorArrowRightFilled, TrayItemRemoveRegular } from "@fluentui/react-icons";
import React from "react";
import { AlertMessage } from "../../common/AlertMessage";
import { IUpcomingPushButton } from "../../interfaces/PushButton";
import { Videohub } from "../../interfaces/Videohub";
import { convertDateToLocal } from "../../utils/dateutils";
import { getPostHeader } from "../../utils/fetchutils";


export const ScheduledButtons = (props: { videohub: Videohub, scheduledButtons: IUpcomingPushButton[] }) => {
    if (props.scheduledButtons.length === 0) {
        return <></>
    }

    const button: IUpcomingPushButton = props.scheduledButtons[0]
    console.log(button)
    return (
        <AlertMessage
            icon={<ClockRegular />}
            message={`${button.cancelled ? "Cancelled" : "Scheduled"}: ${button.label} at ${convertDateToLocal(button.time).toLocaleTimeString()}`}
            action={
                {
                    icon: button.cancelled ? <CheckmarkRegular /> : <DeleteRegular />,
                    onClick: async () => {
                        await fetch('/api/pushbuttons/cancel', getPostHeader({ videohub_id: props.videohub.id, buttonId: button.id, cancel: !button.cancelled }))
                    }
                }
            } />
    )
}