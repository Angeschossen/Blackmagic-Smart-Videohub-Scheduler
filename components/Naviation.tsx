import { INavLink, INavLinkGroup, INavStyles, Nav } from "@fluentui/react";
import { signIn } from "next-auth/react";
import React, { useState } from 'react';
import MediaQuery, { useMediaQuery } from "react-responsive";
import Permissions from "../backend/authentication/Permissions";
import { useClientSession } from "./auth/ClientAuthentication";
import { desktopMinWidth } from "./utils/styles";
import { useViewType } from "./views/DesktopView";


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

const baseLinks: INavLink[] = [

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
        name: 'Videohubs',
        url: '/videohub',
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
    }
]



export const Navigation = () => {
    const isDekstop = useViewType();
    const [selectedKey, setSelectedKey] = useState<string | undefined>();
    const canEditRoles = React.useRef(useClientSession(Permissions.PERMISSION_ROLE_EDIT))
    const canEditUsers = React.useRef(useClientSession(Permissions.PERMISSION_USER_EDIT))
    const [links, setLinks] = React.useState(baseLinks)

    React.useEffect(() => {
        const arr = [...baseLinks]
        if (canEditRoles.current && canEditUsers.current) {
            arr.push(

                {
                    name: 'Admin',
                    url: '/admin',
                    key: 'admin',
                    iconProps: {
                        iconName: 'Settings',
                        styles: {
                            root: {
                                fontSzize: 40,
                                color: '#106ebe',
                            }
                        }
                    }
                }
            )
        }

        setLinks(arr)
    }, [])

    return (
        < Nav
            onLinkClick={(_e: any, item?: INavLink) => {
                if (item?.key != undefined) {
                    setSelectedKey(item.key);
                }
            }}
            groups={[
                {
                    links: links
                }
            ]}
            selectedKey={selectedKey}
            styles={isDekstop ? style : styleMobile}
        />
    )
}
