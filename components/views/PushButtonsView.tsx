import { CommandBarButton, CompoundButton, DefaultButton, IIconProps, mergeStyles, MessageBarType, ProgressIndicator, Stack } from "@fluentui/react";
import React from "react";
import { PushButton } from "../interfaces/PushButton";
import { RoutingRequest, Videohub } from "../Videohub";
import { getPostHeader } from "../utils/fetchutils";
import { commandBarItemStyles, stackStyles, stackTokens } from "../utils/styles";
import { BarMessage } from "../common/Messages";
import Router from "next/router";
import { getRandomKey } from "../utils/commonutils";
import { threadId } from "worker_threads";

const addIcon: IIconProps = { iconName: 'Add' };

interface InputProps {
    videohub?: Videohub,
    onRoutingUpdated?: () => void,
}

export default class PushButtons extends React.Component<InputProps, { pushbuttons: PushButton[], statusKey?: number, currentRequest?: RoutingRequest }>{
    private mounted: boolean = false;
    constructor(props: InputProps) {
        super(props);

        this.state = { pushbuttons: [] };
    }

    componentDidMount() {
        if (this.mounted) {
            return;
        }

        this.mounted = true;

        if (this.props.videohub != undefined) {
            fetch('/api/pushbuttons/get', getPostHeader({ videohub_id: this.props.videohub.id })).then(res => {
                res.json().then(json => {
                    this.setState({ pushbuttons: json });
                });
            });
        }
    }

    getRequestStatus() {
        if (this.state.currentRequest == undefined) {
            return <></>
        }

        if (this.state.currentRequest.success) {
            return <BarMessage key={this.state.statusKey} type={MessageBarType.success} text={"Routing update was successful."}/>;
        } else {
            if (this.state.currentRequest.error == undefined) {
                return <ProgressIndicator key={this.state.statusKey} label="Waiting for Response" description="Please wait until the videohub acknowledged the change." />;
            } else {
                return <BarMessage key={this.state.statusKey} type={MessageBarType.error} text={this.state.currentRequest.error} />;
            }
        }
    }

    render() {
        return (
            <Stack>
                <Stack >
                    <h1>Push Buttons</h1>
                    <Stack horizontal>
                        <DefaultButton
                            text="Edit"
                            onClick={() => {
                                if (this.props.videohub == undefined) {
                                    return;
                                }

                                Router.push({
                                    pathname: '../pushbuttons/main',
                                    query: { videohub: this.props.videohub.id },
                                });
                            }}
                        />
                    </Stack>
                </Stack>
                <Stack style={{ paddingTop: 10, paddingBottom: 10 }}>
                    {this.getRequestStatus()}
                </Stack>
                <Stack horizontal tokens={stackTokens}>
                    {this.state.pushbuttons.map((button, key) => {
                        return (
                            <CompoundButton primary key={key} secondaryText="Click to execute."
                                onClick={async () => {
                                    if (this.props.videohub == undefined || this.state.currentRequest != undefined) {
                                        return;
                                    }

                                    let err;
                                    let request: RoutingRequest | undefined;
                                    for (const action of button.actions) {
                                        request = {
                                            videohub_id: this.props.videohub.id,
                                            output_id: action.output_id,
                                            input_id: action.input_id,
                                            error: undefined,
                                            success: false,
                                        };

                                        this.setState({ currentRequest: request });
                                        const json = await (await fetch('/api/videohubs/routing', getPostHeader(request))).json();
                                        err = json.result;
                                        if (err != undefined) {
                                            request.error = `Error: ${err} Action: Route input: ${request.input_id} to output: ${request.output_id}`;
                                            this.setState({ currentRequest: request });
                                            break;
                                        } else {
                                            request.success = true;
                                        }
                                    }

                                    if (err == null) {
                                        this.setState({ currentRequest: request, statusKey: getRandomKey() });
                                        if (this.props.onRoutingUpdated != undefined) {
                                            this.props.onRoutingUpdated();
                                        }
                                    }

                                    setTimeout(() => {
                                        this.setState({ currentRequest: undefined });
                                    }, 3500);
                                }}>
                                {button.label}
                            </CompoundButton>
                        );
                    })}
                </Stack>
            </Stack>
        );
    }
}