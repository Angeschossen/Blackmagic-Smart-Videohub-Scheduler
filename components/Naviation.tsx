import { INavLink, INavLinkGroup, INavStyles, Nav } from "@fluentui/react";
import React, { useState } from 'react';
import MediaQuery, { useMediaQuery } from "react-responsive";
import { desktopMinWidth } from "./utils/styles";
import { evaluateViewType } from "./views/DesktopView";


// icons: https://www.flicon.io/
const styleMobile: Partial<INavStyles> = {
    root: {
        width: '40px',
        top: 0,
        bottom: 0,
        horizontal: 'strech',
        position: 'fixed',
        boxSizing: 'border-box',
        border: '1px solid #eee',
    }
}

const style: Partial<INavStyles> = {
    root: {
        width: '140px',
        top: 0,
        bottom: 0,
        horizontal: 'strech',
        position: 'fixed',
        boxSizing: 'border-box',
        border: '1px solid #eee',
    }
}

const links: INavLinkGroup[] = [
    {
        links: [
            {
                name: 'Home',
                url: '/',
                key: 'home',
                iconProps: {
                    iconName: 'Home',
                    styles: {
                        root: {
                            fontSzize: 40,
                            color: '#106ebe',
                        }
                    }
                }
            },
            {
                name: 'Videohub',
                url: '/videohub/main',
                key: 'videohub',
                iconProps: {
                    iconName: 'TVMonitorSelected',
                    styles: {
                        root: {
                            fontSzize: 40,
                            color: '#106ebe',
                        }
                    }
                }
            },
        ],
    }
];


export const Navigation = () => {
    const isDekstop = evaluateViewType();
    const [selectedKey, setSelectedKey] = useState<string|undefined>();

    return (
        < Nav
            onLinkClick={(_e: any, item?: INavLink) => {
                if (item?.key != undefined) {
                    setSelectedKey(item.key);
                }
            }}
            groups={links}
            selectedKey={selectedKey}
            styles={isDekstop ? style : styleMobile}
        />
    )
}
