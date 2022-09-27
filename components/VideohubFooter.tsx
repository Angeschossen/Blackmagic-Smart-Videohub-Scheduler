import { MessageBar, MessageBarType } from "@fluentui/react";
import { render } from "react-dom"
import { Videohub } from "./Videohub"

interface InputProps {
    videohub?: Videohub
}

interface MessageBarProps {
    text: string
}
const VideohubOffline = (p: MessageBarProps) => (
    <MessageBar
        messageBarType={MessageBarType.error}
        isMultiline={false}
        dismissButtonAriaLabel="Close"
    >
        {p.text}
    </MessageBar>
);

const VideohubOnline = () => (
    <MessageBar
        messageBarType={MessageBarType.success}
        isMultiline={false}
    >
        The videohub is reachable and can be controlled.
    </MessageBar>
);

function getStatusComponent(videohub?: Videohub) {
    if (videohub == undefined) {
        return <VideohubOffline text="No videohub setup yet." />
    } else {
        if (videohub.connected) {
            return <VideohubOnline />;
        } else {
            return <VideohubOffline text="The videohub is currently not reachable. Therefore, it can't be controlled and shown data might be outdated." />
        }
    }
}

export const VideohubFooter = (p: InputProps) => {
    return getStatusComponent(p.videohub);
}