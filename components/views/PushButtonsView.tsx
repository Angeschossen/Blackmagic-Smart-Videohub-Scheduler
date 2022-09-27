import { CompoundButton, ProgressIndicator, Stack } from "@fluentui/react";
import React from "react";
import { PushButton } from "../interfaces/PushButton";
import { RoutingRequest, Videohub } from "../Videohub";
import { getPostHeader } from "../../utils/fetchutils";
import { stackTokens } from "../../utils/styles";

interface InputProps {
    videohub?: Videohub,
}

export default class PushButtons extends React.Component<InputProps, { pushbuttons: PushButton[], currentRequest?: RoutingRequest }>{
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

    render() {
        return (
            <Stack tokens={stackTokens}>
                <Stack tokens={stackTokens}>
                    <h1>Push Buttons</h1>
                    {this.state.currentRequest != undefined && <ProgressIndicator label="Waiting for Response" description="Please wait until the videohub acknowledged the change." />}
                </Stack>
                <Stack horizontal tokens={stackTokens}>
                    {this.state.pushbuttons.map((button, _key) => {
                        return (
                            <CompoundButton primary secondaryText="Click to execute."
                                onClick={async () => {
                                    if (this.props.videohub == undefined || this.state.currentRequest != undefined) {
                                        return;
                                    }

                                    let fail: RoutingRequest;
                                    for (const action of button.actions) {
                                        const request: RoutingRequest = {
                                            videohub_id: this.props.videohub.id,
                                            output_id: action.output_id,
                                            input_id: action.input_id,
                                        }

                                        this.setState({ currentRequest: request });
                                        const json = await (await fetch('/api/videohubs/routing', getPostHeader(request))).json();
                                        if (!json.result) {
                                            fail = request;
                                            break;
                                        }
                                    }

                                    this.setState({ currentRequest: undefined });
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