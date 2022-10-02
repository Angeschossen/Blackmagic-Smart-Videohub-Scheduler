import { IModalProps, IStackTokens, MessageBarType, Modal, Stack } from "@fluentui/react";
import { minHeight } from "@mui/system";
import React from "react";
import { Confirmation } from "../buttons/Confirmation";
import { BarMessage } from "../common/Messages";

const stackTokens: IStackTokens = { childrenGap: 20 };
interface InputProps extends IModalProps {
    children?: React.ReactNode,
    onCancel: () => void,
    onConfirm: () => string | undefined,
    modalKey: number | undefined,
}

export default class InputModal extends React.Component<InputProps, { open?: boolean, error?: string }> {

    private mounted: boolean = false;

    constructor(props: InputProps) {
        super(props);

        this.state = { open: props.isOpen };
    }

    componentDidMount() {
        if (this.mounted) {
            return false;
        }

        this.mounted = true;
        return true;
    }

    close() {
        this.setState({ open: false, error: undefined });
    }

    render(): React.ReactNode {
        return (
            <Modal
                isOpen={this.state.open}
                key={this.props.modalKey}>
                <Stack tokens={stackTokens} styles={{ root: { padding: '2vh' } }}>
                    {this.props.children}

                    {this.state.error != undefined &&
                        <BarMessage text={this.state.error} type={MessageBarType.error}></BarMessage>
                    }
                    <Confirmation
                        onCancel={() => {
                            this.close();
                            this.props.onCancel();
                        }}
                        onConfirm={() => {
                            const err: string | undefined = this.props.onConfirm();
                            if (err == undefined) {
                                this.close();
                            } else {
                                this.setState({ error: err });
                            }
                        }} />
                </Stack>
            </Modal>
        );
    }
}