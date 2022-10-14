import { IDropdownStyles, IStackStyles, IStackTokens, ITextFieldStyles } from "@fluentui/react";

export const desktopMinWidth = 700;
export const dropdownStyles: Partial<IDropdownStyles> = {
    dropdown: { width: 150 },
};
export const stackTokens: IStackTokens = { childrenGap: 10 };
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
