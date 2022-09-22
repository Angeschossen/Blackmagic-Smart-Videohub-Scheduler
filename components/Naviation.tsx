import { INavLinkGroup, INavStyles, Nav } from "@fluentui/react";
import React, { useEffect } from 'react';

// icons: https://www.flicon.io/
const links: INavLinkGroup[] = [
    {
        links: [
            {
                name: 'Home',
                url: '/',
                key: 'key1',
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
                key: 'key2',
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

const navigationsStyles: Partial<INavStyles> = {
    root: {
        height: '100%',
        width: '200px',
        top: 0,
        bottom: 0,
        horizontal: 'strech',
        position: 'absolute',
        boxSizing: 'border-box',
        border: '1px solid #eee',
        overflowY: 'auto',
        paddingTop: '2vh',
    }
}


const Navigation = () => {
    return (
        <div>
            < Nav
                groups={links}
                initialSelectedKey={"key1"}
                styles={navigationsStyles}
            /></div>
    )
}


export default Navigation;