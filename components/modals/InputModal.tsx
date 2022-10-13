import { IModalProps, IStackTokens, MessageBarType, Modal, Stack } from "@fluentui/react";
import { minHeight } from "@mui/system";
import React from "react";
import { Confirmation } from "../buttons/Confirmation";
import { BarMessage } from "../common/Messages";

const stackTokens: IStackTokens = { childrenGap: 20 };
interface InputProps extends IModalProps, InputModalProps {
    children?: React.ReactNode,
    onCancel: () => void,
    onConfirm: (obj?: any) => string | undefined,
}

export interface InputModalProps {
    modalKey: number | undefined,
    isOpen?: boolean,
    close: () => void,
}

export const InputModal = (props: InputProps) => {
    const [data, setData] = React.useState<{ error?: string }>({ error: undefined });

    function close() {
        props.close();
    }

    return (
        <Modal
            isOpen={props.isOpen}
            key={props.modalKey}>
            <Stack tokens={stackTokens} styles={{ root: { padding: '2vh' } }}>
                {props.children}
                {data.error != undefined &&
                    <BarMessage text={data.error} type={MessageBarType.error}></BarMessage>
                }
                <Confirmation
                    onCancel={() => {
                        close();
                        props.onCancel();
                    }}
                    onConfirm={() => {
                        const err: string | undefined = props.onConfirm();
                        if (err == undefined) {
                            close();
                        } else {
                            setData({ error: err });
                        }
                    }} />
            </Stack>
        </Modal>
    );
}