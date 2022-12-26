import { Stack } from "@fluentui/react";
import { Videohub } from "../interfaces/Videohub";
import { stackTokens } from "../utils/styles";
import { VideohubFooter } from "../VideohubFooter";

interface InputProps {
    children: React.ReactNode,
    videohub?: Videohub,
}

export const videohubPageStyle = { paddingBottom: '1vh', paddingTop: '1vh', paddingLeft: '2vh', paddingRight: '2vh' };

export const VideohubPage = (p: InputProps) => {

    return (
        <div>
            <Stack style={videohubPageStyle} tokens={stackTokens}>
                <VideohubFooter videohub={p.videohub} />
                {p.children}
            </Stack>
        </div>
    )
}