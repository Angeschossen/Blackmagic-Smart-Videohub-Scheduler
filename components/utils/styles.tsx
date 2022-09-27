import { IStackStyles, IStackTokens } from "@fluentui/react";

export const stackTokens: IStackTokens = { childrenGap: 20 };
export const stackStyles: Partial<IStackStyles> = {
    root: {
        position: 'absolute',
        left: '220px',
        bottom: 0,
        right: 0,
        height: '100%',
        maxHeight: '100%'
    }
}
export const commandBarItemStyles: Partial<IStackStyles> = { root: { width: 70, height: 35 } };
