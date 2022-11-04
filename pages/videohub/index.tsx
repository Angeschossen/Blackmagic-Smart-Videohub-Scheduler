import { Stack } from '@fluentui/react';
import { Button, Tooltip } from '@fluentui/react-components';
import { EditRegular } from '@fluentui/react-icons';
import Router from 'next/router';
import React, { useEffect } from 'react';
import io from "socket.io-client";
import Permissions from '../../backend/authentication/Permissions';
import { useClientSession } from '../../components/auth/ClientAuthentication';
import { getUserIdFromToken } from '../../components/auth/ServerAuthentication';
import SelectVideohub from '../../components/buttons/SelectVideohubNew';
import { IPushButton, IUpcomingPushButton } from '../../components/interfaces/PushButton';
import { User } from '../../components/interfaces/User';
import { Output, Videohub } from '../../components/interfaces/Videohub';
import { getPostHeader } from '../../components/utils/fetchutils';
import { VideohubPage } from '../../components/videohub/VideohubPage';
import { useViewType } from '../../components/views/DesktopView';
import { OutputsView } from '../../components/views/OutputsView';
import { PushButtonsList } from '../../components/views/pushbuttons/PushButtonsView';
import { ScheduledButtons } from '../../components/views/pushbuttons/UpcomingPushButtonExecutions';
import { retrievePushButtonsServerSide, retrieveScheduledButtons } from '../api/pushbuttons/[pid]';
import { retrieveUserServerSide } from '../api/users/[pid]';
import { getVideohubFromQuery, retrieveVideohubsServerSide } from '../api/videohubs/[pid]';


async function retrievePushButtons(videohub: number): Promise<IPushButton[]> {
  return (await fetch('/api/pushbuttons/get', getPostHeader({ videohub_id: videohub })).then()).json();
}

async function retrieveScheduledButtonsClientSide(videohub: number): Promise<IUpcomingPushButton[]> {
  return (await fetch('/api/pushbuttons/getScheduled', getPostHeader({ videohub_id: videohub })).then()).json()
}

export async function getServerSideProps(context: any) {
  context.res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=120'
  )

  let selected: Videohub | undefined = getVideohubFromQuery(context.query);
  const hubs: Videohub[] = retrieveVideohubsServerSide();

  if (selected == undefined) {
    if (hubs.length != 0) {
      selected = hubs[0];
    }
  }

  const userId: string = await getUserIdFromToken(context.req)
  let buttons: any[]
  let scheduled: IUpcomingPushButton[]
  if (selected != undefined) {
    buttons = await retrievePushButtonsServerSide(context.req, selected.id)
    scheduled = retrieveScheduledButtons(selected.id, userId)
  } else {
    buttons = []
    scheduled = []
  }

  return {
    props: {
      user: JSON.parse(JSON.stringify(await retrieveUserServerSide(userId))),
      videohubs: JSON.parse(JSON.stringify(hubs)),
      videohub: selected == undefined ? 0 : selected.id,
      pushbuttons: JSON.parse(JSON.stringify(buttons)),
      scheduledButtons: JSON.parse(JSON.stringify(scheduled))
    },
  }
}

interface VideohubViewProps {
  videohubs: Videohub[],
  videohub: number,
  pushbuttons: IPushButton[],
  user: User,
  scheduledButtons: IUpcomingPushButton[],
}

export function getVideohub(videohubs: Videohub[], id: number) {
  for (const videohub of videohubs) {
    if (videohub.id === id) {
      return videohub;
    }
  }

  return undefined
}

function canEditPushButtons(canEditPushButtons: boolean, videohub?: Videohub) {
  return videohub != undefined && canEditPushButtons
}

const VideohubView = (props: VideohubViewProps) => {
  const isDekstop = useViewType();
  const [videohub, setVideohub] = React.useState({ videohub: getVideohub(props.videohubs, props.videohub), buttons: props.pushbuttons, scheduledButtons: props.scheduledButtons })
  const [outputs, setOutputs] = React.useState<Output[]>(videohub.videohub == undefined ? [] : videohub.videohub.outputs)
  const socketData = React.useRef<{ socket?: any, onVideohubUpdate: (hub: Videohub) => void, videohubs: Videohub[] }>({
    socket: undefined,
    onVideohubUpdate: onVideohubUpdate,
    videohubs: props.videohubs,
  })

  function onVideohubUpdate(hub: Videohub) {
    setVideohub({ videohub: hub, buttons: videohub.buttons, scheduledButtons: videohub.scheduledButtons })
    setOutputs(hub.outputs)
  }

  useEffect(() => {
    fetch("/api/socket").then(() => {
      if (socketData.current.socket != undefined) {
        return
      }

      socketData.current.socket = io()

      const channel: string = "videohubUpdate";
      console.log(`Subscribing to channel: ${channel}`);
      socketData.current.socket.on(channel, (data: Videohub) => {
        console.log("Received update.")

        for (let i = 0; i < socketData.current.videohubs.length; i++) {
          const videohub: Videohub = socketData.current.videohubs[i]
          if (videohub.id === data.id) {
            socketData.current.videohubs[i] = data
            if (data.id === videohub?.id) {
              socketData.current.onVideohubUpdate(data)
            }

            break
          }
        }
      })

      console.log("Socket setup.")
    })
  }, [])

  async function onSelectVideohub(hub: Videohub) {
    const buttons: IPushButton[] = await retrievePushButtons(hub.id)
    const scheduled: IUpcomingPushButton[] = await retrieveScheduledButtonsClientSide(hub.id)
    setVideohub({ videohub: hub, buttons: buttons, scheduledButtons: scheduled })
  }

  const canEdit: boolean = useClientSession(Permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT)
  return (
    <VideohubPage videohub={videohub.videohub}>
      <Stack horizontal>
        <SelectVideohub
          videohubs={socketData.current.videohubs || []}
          onSelectVideohub={(hub: Videohub) => onSelectVideohub(hub)} />
      </Stack>
      {isDekstop &&
        <Stack.Item>
          <h1>Routing</h1>
          <OutputsView
            outputs={outputs}
            user={props.user}
            videohub={videohub.videohub}
          />
        </Stack.Item>
      }
      <Stack.Item>
        <Stack horizontal style={{ justifyContent: 'space-between' }}>
          <h1>Update Routing</h1>
          {isDekstop &&
            <Stack.Item>
              <ScheduledButtons
                scheduledButtons={videohub.scheduledButtons}
              />
            </Stack.Item>
          }
        </Stack>
        {isDekstop &&
          <Stack.Item>
            <Tooltip content="Here you can create buttons to execute multiple routing updates at once." relationship="description">
              <Button
                icon={<EditRegular />}
                disabled={!canEditPushButtons(canEdit, videohub.videohub)}
                onClick={() => {
                  if (videohub.videohub == undefined) {
                    return
                  }

                  Router.push({
                    pathname: '../pushbuttons',
                    query: { videohub: videohub.videohub.id },
                  });
                }}>
                Edit
              </Button>
            </Tooltip>
          </Stack.Item>}
        <Stack.Item>
          <PushButtonsList
            pushbuttons={videohub.buttons}
            videohub={videohub.videohub}
          />
        </Stack.Item>
      </Stack.Item>
    </VideohubPage>
  )
}

export default VideohubView