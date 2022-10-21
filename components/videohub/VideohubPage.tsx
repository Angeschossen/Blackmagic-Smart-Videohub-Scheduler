import { Stack } from "@fluentui/react";
import Login from "../auth/Login";
import { ProtectedPage } from "../common/ProtectedPage";
import { Videohub } from "../interfaces/Videohub";
import { stackTokens } from "../utils/styles";
import { VideohubFooter } from "../VideohubFooter"

interface InputProps {
    children: React.ReactNode,
    videohub?: Videohub,
}

export const videohubPageStyle = { paddingBottom: '1vh', paddingTop: '1vh', paddingLeft: '2vh', paddingRight: '2vh' };

export const VideohubPage = (p: InputProps) => {

    return (
            <Stack>
                <Stack.Item style={{ justifyContent: 'flex-end', right: 0 }}>
                    <VideohubFooter videohub={p.videohub} />
                </Stack.Item>
                <Stack style={videohubPageStyle} tokens={stackTokens}>
                    {p.children}
                </Stack>
            </Stack>
    )
}