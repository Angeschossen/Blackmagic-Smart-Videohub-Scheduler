import { Stack, IStackStyles } from '@fluentui/react';
import React, { Key, useEffect, useState } from 'react';
import Router from 'next/router'
import { getVideohubFromQuery, retrieveVideohubsServerSide } from '../api/videohubs/[pid]';
import { Output, Videohub } from '../../components/interfaces/Videohub';
import DataTable, { DataTableColumn, DataTableItem } from '../../components/DataTableNew';
import { getRandomKey } from '../../components/utils/commonutils';
import { PushButton } from '../../components/interfaces/PushButton';
import { retrievePushButtonsServerSide } from '../api/pushbuttons/[pid]';
import { VideohubPage } from '../../components/videohub/VideohubPage';
import SelectVideohub from '../../components/buttons/SelectVideohubNew';
import { useViewType } from '../../components/views/DesktopView';
import { useSession } from 'next-auth/react';
import { useClientSession } from '../../components/auth/ClientAuthentication';
import Permissions from '../../backend/authentication/Permissions';
import io from "socket.io-client";
import { TableCellLayout } from "@fluentui/react-components/unstable";
import { Button } from '@fluentui/react-components';
import { Clock12Filled } from '@fluentui/react-icons';
import OutputView from './events';
import { OutputsView } from '../../components/views/OutputsView';
import { User } from '../../components/interfaces/User';
import { retrieveUserServerSide } from '../api/users/[pid]';
import { getUserIdFromToken } from '../../components/auth/ServerAuthentication';
import { PushButtonsList } from '../../components/views/pushbuttons/PushButtonsView';
import { Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';


export function getPostHeader(e: any): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify(e),
  };
}

async function retrievePushButtons(videohub: number): Promise<PushButton[]> {
  return (await fetch('/api/pushbuttons/get', getPostHeader({ videohub_id: videohub })).then()).json();
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

  let buttons: PushButton[];
  if (selected != undefined) {
    buttons = await retrievePushButtonsServerSide(context.req, selected.id)
  } else {
    buttons = []
  }

  return {
    props: {
      user: JSON.parse(JSON.stringify(await retrieveUserServerSide(await getUserIdFromToken(context.req)))),
      videohubs: JSON.parse(JSON.stringify(hubs)),
      videohub: selected == undefined ? 0 : selected.id,
      pushbuttons: JSON.parse(JSON.stringify(buttons)),
    },
  }
}

interface VideohubViewProps {
  videohubs: Videohub[],
  videohub: number,
  pushbuttons: PushButton[],
  user: User,
}

export function getVideohub(videohubs: Videohub[], id: number) {
  for (const videohub of videohubs) {
    if (videohub.id === id) {
      return videohub;
    }
  }

  return undefined;
}

const VideohubView = (props: VideohubViewProps) => {
  const isDekstop = useViewType();
  const [videohub, setVideohub] = React.useState({ videohub: getVideohub(props.videohubs, props.videohub), buttons: props.pushbuttons })
  const [outputs, setOutputs] = React.useState<Output[]>(videohub.videohub == undefined ? [] : videohub.videohub.outputs)
  const socketData = React.useRef<{ socket?: any, onVideohubUpdate: (hub: Videohub) => void, videohubs: Videohub[] }>({
    socket: undefined,
    onVideohubUpdate: onVideohubUpdate,
    videohubs: props.videohubs,
  })

  function onVideohubUpdate(hub: Videohub) {
    setVideohub({ videohub: hub, buttons: videohub.buttons })
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

  function onSelectVideohub(hub: Videohub) {
    retrievePushButtons(hub.id).then(pushbuttons => {
      setVideohub({ videohub: hub, buttons: pushbuttons })
    });
  }

  const canEditPushButtons: boolean = useClientSession(Permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT)
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
        <h1>Push Buttons</h1>
        <Button
          disabled={videohub == undefined||canEditPushButtons}
          onClick={() => {
            if (videohub.videohub == undefined) {
              return
            }

            Router.push({
              pathname: '../pushbuttons/main',
              query: { videohub: videohub.videohub.id },
            });
          }}>
          Edit
        </Button>
        <PushButtonsList
          pushbuttons={videohub.buttons}
          videohub={videohub.videohub}
        />
      </Stack.Item>
    </VideohubPage>
  )
}

export default VideohubView