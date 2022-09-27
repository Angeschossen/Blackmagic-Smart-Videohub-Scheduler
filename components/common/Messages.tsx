import { MessageBar, MessageBarType } from "@fluentui/react";

interface MessageBarProps {
    text: string,
    type: MessageBarType,
}

export const BarMessage = (p: MessageBarProps) => (
    <MessageBar
        messageBarType={p.type}
        isMultiline={false}
        dismissButtonAriaLabel="Close"
    >
        {p.text}
    </MessageBar>
);