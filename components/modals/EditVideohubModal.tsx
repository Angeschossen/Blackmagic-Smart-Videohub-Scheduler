import { CommandBarButton, IContextualMenuItem, IIconProps, IModalProps, Modal, TextField } from "@fluentui/react";
import React from "react";
import InputModal from "../modals/InputModal";
import { deepCopy } from "../utils/commonutils";
import { getPostHeader } from "../utils/fetchutils";
import { Videohub } from "../Videohub";
const videohubIcon: IIconProps = { iconName: 'HardDriveGroup' };

interface InputProps extends IModalProps {
    videohubs: Videohub[],
    edit?: Videohub,
    onConfirm: (videohub: Videohub) => void,
}

export default class EditVideohubModal extends React.Component<InputProps, { edit?: Videohub, modalId?: number }> {
    private ip?: string;

    constructor(props: InputProps) {
        super(props);

        this.state = { edit: props.edit != undefined ? deepCopy(props.edit) as Videohub : undefined }
    }

    validateButtonLabel(input?: string): string | undefined {
        if (input == undefined) {
            return "You must provide an ip address.";
        }

        input = input.toLowerCase();
        for (const b of this.props.videohubs) {
            if (b.ip.toLowerCase() === input && b != this.state.edit) {
                return "A videohub with this ip address already exists.";
            }
        }

        return undefined;
    }

    render(): React.ReactNode {
        const inst: EditVideohubModal = this;
        return (
            <InputModal
                isOpen={this.props.isOpen}
                onCancel={function (): void {
                    // nothing, just cancel
                }}
                onConfirm={function (): string | undefined {
                    const err = inst.validateButtonLabel(inst.ip);
                    if (err != undefined) {
                        return err;
                    }

                    if (inst.ip != undefined) {
                        let videohub: Videohub | undefined = inst.state.edit;
                        if (videohub != undefined) {
                            videohub.ip = inst.ip;
                        } else {
                            videohub = {
                                id: -1,
                                ip: inst.ip,
                                name: inst.ip,
                                version: "unkown",
                                inputs: [],
                                outputs: [],
                                connected: false
                            };
                        }

                        fetch('/api/videohubs/update', getPostHeader(videohub)).then(async res => {
                            inst.props.onConfirm(await res.json());
                        });
                    }

                    return undefined;
                }}
            >
                <TextField label="IP Address" required
                    onChange={(_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, val?: string) => {
                        this.ip = val;
                    }}
                    defaultValue={this.state.edit == undefined ? undefined : this.state.edit.ip}
                    validateOnLoad={false}
                    validateOnFocusOut={true}
                    onGetErrorMessage={(value: string) => {
                        return this.validateButtonLabel(value);
                    }}
                />
            </InputModal>
        );
    }
}