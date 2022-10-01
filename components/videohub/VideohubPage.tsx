import { Stack } from "@fluentui/react";
import { Videohub } from "../Videohub";
import { VideohubFooter } from "../VideohubFooter"

interface InputProps {
    children: React.ReactNode,
    videohub?: Videohub,
}
export const VideohubPage = (p: InputProps) => {
    return (
        <Stack>
            <Stack.Item style={{justifyContent: 'flex-end',right: 0}}>
                <VideohubFooter videohub={p.videohub} />
            </Stack.Item>
            <Stack style={{ paddingTop: '1vh', paddingLeft: '2vh', paddingRight: '2vh' }}>
                {p.children}
            </Stack>
        </Stack>
    )
}