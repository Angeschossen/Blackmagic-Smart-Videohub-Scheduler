import { IModalProps, IStackTokens, Modal, Stack } from "@fluentui/react";
import React from "react";
import { Confirmation } from "../buttons/Confirmation";

const stackTokens: IStackTokens = { childrenGap: 20 };
interface InputProps extends IModalProps {
    children?: React.ReactNode,
    onCancel: () => void,
    onConfirm: () => string | undefined,
}

export default class EditPushButtonModal extends React.Component<InputProps, { open?: boolean }> {

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

    render(): React.ReactNode {
        return (
            <>
                {this.state.open &&
                    <Modal isOpen={true}>
                        <Stack tokens={stackTokens} styles={{ root: { margin: '1vh' } }}>
                            {this.props.children}
                            <Confirmation
                                onCancel={() => {
                                    this.setState({ open: false });
                                    this.props.onCancel();
                                }}
                                onConfirm={() => {
                                    if (this.props.onConfirm() == undefined) {
                                        this.setState({ open: false });
                                    }
                                }} />
                        </Stack>
                    </Modal>
                }
            </>
        );
    }
}