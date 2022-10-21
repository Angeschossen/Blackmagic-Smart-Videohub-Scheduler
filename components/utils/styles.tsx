import { IDropdownStyles, IStackStyles, IStackTokens } from "@fluentui/react";
import { makeStyles, shorthands } from "@fluentui/react-components";

export const desktopMinWidth = 700;
export const dropdownStyles: Partial<IDropdownStyles> = {
    dropdown: { width: 150 },
};
export const stackTokens: IStackTokens = { childrenGap: 30 };
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

export const useInputStyles = makeStyles({
  root: {
    // Stack the label above the field
    display: 'flex',
    flexDirection: 'column',
    // Use 2px gap below the label (per the design system)
    ...shorthands.gap('2px'),
  }
});