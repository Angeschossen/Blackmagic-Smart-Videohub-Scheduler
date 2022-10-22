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
    buttons = await retrievePushButtonsServerSide(selected.id);
  } else {
    buttons = [];
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
  const socketio: any = React.useRef();
  const isDekstop = useViewType();
  const [videohub, setVideohub] = React.useState({ videohub: getVideohub(props.videohubs, props.videohub), buttons: props.pushbuttons })
  const [outputs, setOutputs] = React.useState<Output[]>(videohub.videohub == undefined ? [] : videohub.videohub.outputs)

  function onVideohubUpdate(hub: Videohub) {
    setVideohub({ videohub: hub, buttons: videohub.buttons })
    setOutputs(hub.outputs)
  }

  useEffect(() => {
    fetch("/api/socket").then(() => {
      if (socketio.current != undefined) {
        return;
      }

      socketio.current = io();

      const channel: string = "videohubUpdate";
      console.log(`Subscribing to channel: ${channel}`);
      socketio.current.on(channel, (data: Videohub) => {
        console.log("Received update.");

        for (let i = 0; i < props.videohubs.length; i++) {
          const videohub: Videohub = props.videohubs[i];
          if (videohub.id === data.id) {
            props.videohubs[i] = data;
            if (data.id === videohub?.id) {
              onVideohubUpdate(data);
            }

            break;
          }
        }
      });

      console.log("Socket setup.")
    });
  }, []);

  function onSelectVideohub(hub: Videohub) {
    retrievePushButtons(hub.id).then(pushbuttons => {
      setVideohub({ videohub: hub, buttons: pushbuttons })
    });
  }

  return (
    <VideohubPage videohub={videohub.videohub}>
      <Stack horizontal>
        <SelectVideohub
          videohubs={props.videohubs || []}
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
          disabled={videohub == undefined || !useClientSession(Permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT)}
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