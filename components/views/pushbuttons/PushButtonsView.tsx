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
import { ProgressField } from "@fluentui/react-field";

interface InputProps {
  videohub?: Videohub,
  onRoutingUpdated?: (data: RoutingRequest) => void,
  pushbuttons: PushButton[],
}

interface RequestState {
  state?: "success" | "error",
  message?: string,
  value?: number,
  hint?: string,
}

export interface RoutingData {
  request?: RoutingRequest,
  statusKey: number,
}

const getRequestState = (props: { request?: RoutingRequest }): RequestState => {
  if (props.request != undefined) {
    if (props.request.success) {
      return { state: "success", message: "Routing update was successful.", value: 1, hint: undefined }
    } else if (props.request.error != undefined) {
      return { state: "error", message: props.request.error, value: 0, hint: undefined }
    }
  }

  return { state: undefined, message: undefined, value: undefined, hint: "Please wait until the videohub acknowledged the change." }
}

const RequestStatus = (props: { request?: RoutingRequest }) => {
  if (props.request == undefined) {
    return <></>
  }

  const state = getRequestState(props)
  return <ProgressField
    label={state.state != "error" ? `Waiting for Response: ${props.request.button.label}` : "Last Button failed."}
    hint={state.hint}
    validationMessage={state.message}
    validationState={state.state}
    value={state.value}
  />
}

export const PushButtonsList = (props: InputProps) => {
  const isDekstop = useViewType();
  const [request, setRequest] = useState<RoutingRequest>()

  const isRequestComplete = () => {
    return request == undefined || request.success || request.error != undefined
  }

  return (
    <>
      {props.pushbuttons.length == 0 ?
        <p>No buttons setup yet.</p> :
        <>
          <Stack.Item style={{ paddingTop: 10, paddingBottom: 10 }}>
            <RequestStatus
              request={request}
            />
          </Stack.Item>
          <Stack wrap horizontalAlign={isDekstop ? "start" : "center"} horizontal tokens={stackTokens}>
            {props.pushbuttons.map((button, key) => {
              return (
                <Stack.Item key={"pushbutton_" + key}>
                  <CompoundButton disabled={!isRequestComplete()} key={key} secondaryContent={button.description || `Click to execute ${button.actions.length} action(s).`} style={{ backgroundColor: button.color }}
                    onClick={async () => {
                      if (props.videohub == undefined || !isRequestComplete()) {
                        return
                      }

                      const inputs: number[] = []
                      const outputs: number[] = []

                      for (const action of button.actions) {
                        outputs.push(action.output_id)
                        inputs.push(action.input_id)
                      }

                      const req: RoutingRequest = {
                        id: getRandomKey(),
                        button: button,
                        videohub_id: props.videohub.id,
                        outputs: outputs,
                        inputs: inputs,
                        error: undefined,
                        success: false,
                      }

                      setRequest(req)

                      const json = await (await fetch('/api/videohubs/routing', getPostHeader(req))).json()
                      const err: string = json.result;

                      if (err != undefined) {
                        req.error = `Error: ${err}`
                      } else {
                        req.success = true
                        if (props.onRoutingUpdated != undefined) {
                          props.onRoutingUpdated(req)
                        }
                      }

                      setRequest({ ...req })

                      /*
                      setTimeout(() => {
                        if (req.id === request?.id) {
                          setRequest(undefined)
                        }
                      }, 5000); */
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