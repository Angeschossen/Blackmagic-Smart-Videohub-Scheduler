import { Stack } from "@fluentui/react";
import { AlertMessage } from "./common/AlertMessage";
import { Videohub } from "./interfaces/Videohub";

interface InputProps {
    videohub?: Videohub,
}

function getStatusComponent(videohub?: Videohub) {
    if (videohub == undefined) {
        return <AlertMessage intent="info" message="No videohub setup yet." />
    } else {
        if (videohub.connected) {
            return <AlertMessage intent="success" message="The videohub is reachable and can be controlled." />
        } else {
            return <AlertMessage intent="warning" message="The videohub is currently unavailable. Therefore it cannot be controlled." />
        }
    }
}

export const VideohubFooter = (p: InputProps) => {
    return <Stack.Item style={{position: 'sticky', top: 0}}>{getStatusComponent(p.videohub)}</Stack.Item>
}