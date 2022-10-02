import { CommandBarButton, CompoundButton, DefaultButton, IIconProps, mergeStyles, MessageBarType, ProgressIndicator, Stack } from "@fluentui/react";
import React, { useState } from "react";
import { PushButton } from "../interfaces/PushButton";
import { RoutingRequest, Videohub } from "../interfaces/Videohub";
import { getPostHeader } from "../utils/fetchutils";
import { commandBarItemStyles, desktopMinWidth, stackStyles, stackTokens } from "../utils/styles";
import { BarMessage } from "../common/Messages";
import Router from "next/router";
import { getRandomKey } from "../utils/commonutils";
import { threadId } from "worker_threads";
import { useMediaQuery } from "react-responsive";
import { useViewType } from "./DesktopView";

const addIcon: IIconProps = { iconName: 'Add' };

interface InputProps {
    videohub?: Videohub,
    onRoutingUpdated?: () => void,
    pushbuttons: PushButton[],
}

export const PushButtons = (props: InputProps) => {
    const isDekstop = useViewType();
    const [statusKey, setStatusKey] = useState<string | number>();
    const [currentRequest, setCurrentRequest] = useState<RoutingRequest>();

    const getRequestStatus = () => {
        if (currentRequest == undefined || props.videohub == undefined) {
            return <></>
        }

        if (currentRequest.success) {
            return <BarMessage key={statusKey} type={MessageBarType.success} text={"Routing update was successful."} />;
        } else {
            if (currentRequest.error == undefined) {
                const request: RoutingRequest = currentRequest;
                return <ProgressIndicator key={statusKey} label={"Waiting for Response."} description="Please wait until the videohub acknowledged the change." />;
            } else {
                return <BarMessage key={statusKey} type={MessageBarType.error} text={currentRequest.error} />;
            }
        }
    }

    return (
        <Stack>
            <Stack horizontalAlign="start">
                <h1>Push Buttons</h1>
                <DefaultButton
                    text="Edit"
                    onClick={() => {
                        if (props.videohub == undefined) {
                            return;
                        }

                        Router.push({
                            pathname: '../pushbuttons/main',
                            query: { videohub: props.videohub.id },
                        });
                    }}
                />
            </Stack>
            <Stack style={{ paddingTop: 10, paddingBottom: 10 }}>
                {getRequestStatus()}
            </Stack>
            <Stack horizontalAlign={isDekstop ? "start":"center"} wrap horizontal tokens={stackTokens}>
                {props.pushbuttons.map((button, key) => {
                    return (
                        <CompoundButton primary key={key} secondaryText={`Click to execute ${button.actions.length} action(s).`} styles={{ root: { width: '250px', backgroundColor: button.color, borderColor: button.color } }}
                            onClick={async () => {
                                if (props.videohub == undefined || (currentRequest != undefined && !currentRequest.success)) {
                                    return;
                                }

                                let err;
                                let request: RoutingRequest | undefined;
                                for (const action of button.actions) {
                                    request = {
                                        videohub_id: props.videohub.id,
                                        output_id: action.output_id,
                                        input_id: action.input_id,
                                        error: undefined,
                                        success: false,
                                    };

                                    setCurrentRequest(request);
                                    const json = await (await fetch('/api/videohubs/routing', getPostHeader(request))).json();
                                    err = json.result;
                                    if (err != undefined) {
                                        request.error = `Error: ${err} Action: Route input: ${request.input_id} to output: ${request.output_id}`;
                                        setCurrentRequest(request);
                                        break;
                                    } else {
                                        request.success = true;
                                    }
                                }

                                if (err == null) {
                                    setCurrentRequest(request);
                                    setStatusKey(getRandomKey());
                                    if (props.onRoutingUpdated != undefined) {
                                        props.onRoutingUpdated();
                                    }
                                }

                                setTimeout(() => {
                                    setCurrentRequest(undefined);
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