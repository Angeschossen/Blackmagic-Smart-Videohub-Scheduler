import { IStackStyles, MessageBar, MessageBarType, Stack } from "@fluentui/react";
import { useEffect } from "react";
import { render } from "react-dom"
import { AlertMessage } from "./common/AlertMessage";
import { Videohub } from "./interfaces/Videohub"
import { useForceUpdate } from "./utils/hooks";

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
            return <AlertMessage intent="warning" message="The videohub is currently not reachable. Therefore, it can't be controlled and shown data might be outdated." />
        }
    }
}

export const VideohubFooter = (p: InputProps) => {
    return <Stack.Item style={{position: 'sticky', top: 0}}>{getStatusComponent(p.videohub)}</Stack.Item>
}