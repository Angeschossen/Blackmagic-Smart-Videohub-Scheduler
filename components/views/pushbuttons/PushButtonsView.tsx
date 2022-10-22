import { MessageBarType, ProgressIndicator, Stack } from "@fluentui/react";
import React, { useState } from "react";
import { PushButton } from "../../interfaces/PushButton";
import { RoutingRequest, Videohub } from "../../interfaces/Videohub";
import { getPostHeader } from "../../utils/fetchutils";
import { stackTokens } from "../../utils/styles";
import { BarMessage } from "../../common/Messages";
import { getRandomKey } from "../../utils/commonutils";
import { useViewType } from "../DesktopView";
import { CompoundButton } from "@fluentui/react-components";
import { AlertMessage } from "../../common/AlertMessage";

interface InputProps {
  videohub?: Videohub,
  onRoutingUpdated?: (data: RoutingRequest) => void,
  pushbuttons: PushButton[],
}

export interface RoutingData {
  request?: RoutingRequest,
  statusKey: number,
}

export const PushButtonsList = (props: InputProps) => {
  const isDekstop = useViewType();
  const [requestData, setRequestData] = useState<RoutingData>();

  const getRequestStatus = () => {
    if (requestData?.request == undefined || props.videohub == undefined) {
      return <></>
    }

    if (requestData.request.success) {
      return <AlertMessage key={requestData.statusKey} intent="success" message="Routing update was successful." />;
    } else {
      if (requestData.request.error == undefined) {
        return <ProgressIndicator key={requestData.statusKey} label={`Waiting for Response.`} description="Please wait until the videohub acknowledged the change." />;
      } else {
        return <AlertMessage key={requestData.statusKey} intent="error" message={requestData.request.error} />;
      }
    }
  }

  return (
    <>
      {props.pushbuttons.length == 0 ?
        <p>No buttons setup yet.</p> :
        <>
          <Stack.Item style={{ paddingTop: 10, paddingBottom: 10 }}>
            {getRequestStatus()}
          </Stack.Item>
          <Stack wrap horizontalAlign={isDekstop ? "start" : "center"} horizontal tokens={stackTokens}>
            {props.pushbuttons.map((button, key) => {
              return (
                <Stack.Item key={"pushbutton_" + key}>
                  <CompoundButton key={key} secondaryContent={`Click to execute ${button.actions.length} action(s).`} style={{ backgroundColor: button.color, borderColor: button.color }}
                    onClick={async () => {
                      if (props.videohub == undefined || (requestData?.request != undefined /*&& !currentRequest.success*/)) {
                        return
                      }

                      const inputs: number[] = []
                      const outputs: number[] = []

                      for (const action of button.actions) {
                        outputs.push(action.output_id)
                        inputs.push(action.input_id)
                      }

                      const request: RoutingRequest = {
                        videohub_id: props.videohub.id,
                        outputs: outputs,
                        inputs: inputs,
                        error: undefined,
                        success: false,
                      }

                      setRequestData({ request: request, statusKey: getRandomKey() });

                      const json = await (await fetch('/api/videohubs/routing', getPostHeader(request))).json()
                      console.log(json)
                      const err: string = json.result;

                      console.log("Routing update result: " + (err == undefined ? "success" : err))

                      if (err != undefined) {
                        request.error = `Error: ${err}`
                      } else {
                        request.success = true
                        if (props.onRoutingUpdated != undefined) {
                          props.onRoutingUpdated(request)
                        }
                      }

                      setRequestData({ request: request, statusKey: getRandomKey() })

                      setTimeout(() => {
                        setRequestData({ request: undefined, statusKey: getRandomKey() })
                      }, 2500);
                    }}>
                    {button.label}
                  </CompoundButton>
                </Stack.Item>
              );
            })}
          </Stack>
        </>}
    </>
  );
}