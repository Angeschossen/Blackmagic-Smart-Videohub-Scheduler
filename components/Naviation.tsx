import { INavLink, INavLinkGroup, INavStyles, Nav } from "@fluentui/react";
import React from 'react';


// icons: https://www.flicon.io/
const navigationsStyles: Partial<INavStyles> = {
    root: {
        height: '100%',
        width: '13vh',
        top: 0,
        bottom: 0,
        horizontal: 'strech',
        position: 'absolute',
        boxSizing: 'border-box',
        border: '1px solid #eee',
        overflowY: 'auto',
        //paddingTop: '3vh',
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

class Navigation extends React.Component<{}, { selectedKey?: string }>  {

    constructor(props: any) {
        super(props);

        this.state = { selectedKey: undefined };
    }

    onLinkClick(item?: INavLink) {
        this.setState({ selectedKey: item?.key });
    }

    render(): React.ReactNode {
        return (
            <div className="ms-Grid-col ms-sm6 ms-md4 ms-lg2">
                < Nav
                    onLinkClick={(_e: any, item?: INavLink) => {
                        this.onLinkClick(item);
                    }}
                    groups={links}
                    selectedKey={this.state.selectedKey}
                    styles={navigationsStyles}
                /></div>
        )
    }
}


export default Navigation;