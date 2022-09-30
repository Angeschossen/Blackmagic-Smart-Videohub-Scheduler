import { Stack } from "@fluentui/react";
import { Videohub } from "../Videohub";
import { VideohubFooter } from "../VideohubFooter"

interface InputProps {
    children: React.ReactNode,
    videohub?: Videohub,
}
export const VideohubPage = (p: InputProps) => {
    return (
        <>
            <VideohubFooter videohub={p.videohub} />
            <Stack style={{ paddingTop: '1vh', paddingLeft: '2vh', paddingRight: '2vh'}}>
                {p.children}
            </Stack>
        </>
    )
}