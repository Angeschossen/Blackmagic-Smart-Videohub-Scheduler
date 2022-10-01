import { IModalProps, IStackTokens, Stack, TextField } from "@fluentui/react";
import React from "react";
import InputModal from "../modals/InputModal";
import { deepCopy, getRandomKey } from "../utils/commonutils";
import { getPostHeader } from "../utils/fetchutils";
import { Videohub } from "../interfaces/Videohub";

const stackTokens: IStackTokens = { childrenGap: 20 };

interface InputProps extends IModalProps {
    videohubs: Videohub[],
    edit?: Videohub,
    onConfirm: (videohub: Videohub) => void,
}

export default class EditVideohubModal extends React.Component<InputProps, { edit?: Videohub, modalId?: number }> {
    private ip?: string;
    private name?: string;

    constructor(props: InputProps) {
        super(props);

        this.state = { edit: props.edit != undefined ? deepCopy(props.edit) as Videohub : undefined }
    }

    validateIPAddress(input?: string): string | undefined {
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


    validateName(input?: string): string | undefined {
        if (input != undefined) {
            input = input.toLowerCase();
            for (const b of this.props.videohubs) {
                if (b.name.toLowerCase() === input && b != this.state.edit) {
                    return "A videohub with this name already exists.";
                }
            }
        }

        return undefined;
    }

    render(): React.ReactNode {
        const inst: EditVideohubModal = this;
        return (
            <InputModal
                modalKey={getRandomKey()}
                isOpen={this.props.isOpen}
                onCancel={function (): void {
                    // nothing, just cancel
                }}
                onConfirm={function (): string | undefined {
                    let err = inst.validateIPAddress(inst.ip);
                    if (err != undefined) {
                        return err;
                    }

                    err = inst.validateName(inst.name);
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
                                name: inst.name == undefined ? inst.ip : inst.name,
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
                        return this.validateIPAddress(value);
                    }}
                />
                <TextField label="Name"
                    placeholder="Get from device"
                    onChange={(_e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, val?: string) => {
                        this.ip = val;
                    }}
                    defaultValue={this.state.edit == undefined ? undefined : this.state.edit.name}
                    validateOnLoad={false}
                    validateOnFocusOut={true}
                    onGetErrorMessage={(value: string) => {
                        return this.validateName(value);
                    }}
                />
            </InputModal>
        );
    }
}