import { Stack, IStackStyles, IContextualMenuItem } from '@fluentui/react';
import React, { Key, useEffect, useState } from 'react';
import Router from 'next/router'
import { getVideohubFromQuery, retrieveVideohubsServerSide } from '../api/videohubs/[pid]';
import { RoutingRequest, Videohub } from '../../components/interfaces/Videohub';
import DataTable from '../../components/DataTable';
import { getRandomKey } from '../../components/utils/commonutils';
import { PushButton } from '../../components/interfaces/PushButton';
import { retrievePushButtonsServerSide } from '../api/pushbuttons/[pid]';
import { VideohubPage } from '../../components/videohub/VideohubPage';
import SelectVideohub from '../../components/buttons/SelectVideohub';
import { PushButtons, RoutingData } from '../../components/views/PushButtonsView';
import { useViewType } from '../../components/views/DesktopView';
import { useSession } from 'next-auth/react';
import { useClientSession } from '../../components/auth/ClientAuthentication';
import Permissions from '../../backend/authentication/Permissions';
import { RequestData } from 'next/dist/server/web/types';
import { convert_date_to_utc } from '../../components/utils/dateutils';
import { stackTokens } from '../../components/utils/styles';
import io from "socket.io-client";
import { Socket } from 'net';

const stackStyles: Partial<IStackStyles> = { root: { height: 44 } };

export function getPostHeader(e: any): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify(e),
  };
}


async function retrieveVideohubs(): Promise<Videohub[]> {
  return (await fetch('/api/videohubs/get').then()).json();
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
      videohubs: JSON.parse(JSON.stringify(hubs)),
      videohub: selected == undefined ? 0 : selected.id,
      pushbuttons: JSON.parse(JSON.stringify(buttons)),
    } as VideohubViewProps,
  }
}

function getItems(videohub?: Videohub): any[] {
  const cloned: any[] = [];

  if (videohub != undefined) {
    for (const output of videohub.outputs) {
      cloned.push({
        id: output.id,
        Output: output.label,
        Input: (output.input_id == undefined ? "None" : videohub.inputs[output.input_id].label),
      });
    }
  }

  return cloned;
}


interface VideohubViewProps {
  videohubs: Videohub[],
  videohub: number,
  pushbuttons: PushButton[],
}

interface VideohubData {
  currentVideohub?: Videohub,
  videohubs: Videohub[],
  pushButtons: PushButton[],
}

export function getVideohub(videohubs: Videohub[], id: number) {
  for (const videohub of videohubs) {
    if (videohub.id === id) {
      return videohub;
    }
  }

  return undefined;
}

interface Keys {
  tableKey: Key,
  pushbuttonsKey: Key,
}


export const VideohubView = (props: VideohubViewProps) => {
  const socketio: any = React.useRef();
  const isDekstop = useViewType();
  const { data: session } = useSession();
  const [keys, setKeys] = useState<Keys>({ tableKey: "table_0", pushbuttonsKey: "buttons_0" });
  const videohubData = React.useRef(buildVideohubData(props));
  const [tableUpdate, setTableUpdate] = useState<number>(getRandomKey());

  function buildVideohubData(p: VideohubViewProps): VideohubData {
    const videohub: Videohub | undefined = getVideohub(p.videohubs, p.videohub);
    return { currentVideohub: videohub, videohubs: p.videohubs, pushButtons: p.pushbuttons };
  }

  function onVideohubUpdate(videohub: Videohub) {
    setTableUpdate(getRandomKey());
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
  
        for (let i = 0; i < videohubData.current.videohubs.length; i++) {
          const videohub: Videohub = videohubData.current.videohubs[i];
          if (videohub.id === data.id) {
            videohubData.current.videohubs[i] = data;
            if (data.id === videohubData.current.currentVideohub?.id) {
              onVideohubUpdate(data);
            }
  
            break;
          }
        }
      });

      console.log("Socket setup.")
    });
  }, []);

  async function retrieveData(): Promise<any[] | undefined> {
    let videohub: Videohub | undefined;
    for (const hub of videohubData.current.videohubs) {
      if (videohubData.current.currentVideohub == undefined || hub.id === videohubData.current.currentVideohub.id) {
        videohub = hub;
        break;
      }
    }

    if (videohub == undefined) {
      return [];
    }

    if (videohubData.current.currentVideohub?.id != videohub.id || videohubData.current.currentVideohub?.connected != videohub.connected) {
      onSelectVideohub(videohubData.current.videohubs, videohub);
      return undefined; // since it updates all
    }

    return getItems(videohub);
  }

  function updateView(data: VideohubData) {
    console.log("Update view");
    videohubData.current = data;
    setKeys({ tableKey: getRandomKey(), pushbuttonsKey: getRandomKey() });
  }

  function onSelectVideohub(videohubs: Videohub[], hub: Videohub) {
    retrievePushButtons(hub.id).then(pushbuttons => {
      updateView(buildVideohubData({ videohubs: videohubs, videohub: hub.id, pushbuttons: pushbuttons }));
    });
  }

  const canEdit: boolean = useClientSession(Permissions.PERMISSION_VIDEOHUB_OUTPUT_SCHEDULE);

  // Here we use a Stack to simulate a command bar.
  // The real CommandBar control also uses CommandBarButtons internally.
  return (
    <VideohubPage videohub={videohubData.current.currentVideohub}>
      <Stack tokens={stackTokens}>
        <Stack horizontal styles={stackStyles}>
          <SelectVideohub
            videohubs={videohubData.current.videohubs || []}
            onSelectVideohub={(hub: Videohub) => onSelectVideohub(videohubData.current.videohubs, hub)} />
        </Stack>
        <h1>Routing</h1>
        {isDekstop && session != undefined &&
          <DataTable
            key={keys.tableKey}
            tableUpdate={tableUpdate}
            controlcolumns={canEdit ? [
              {
                key: "edit",
                onClick(_event, item) {
                  if (videohubData.current.currentVideohub == undefined) {
                    throw Error("Videohub is undefined");
                  }

                  Router.push({
                    pathname: './events',
                    query: { videohub: videohubData.current.currentVideohub.id, output: item.id },
                  });
                },
                text: "Schedule"
              }
            ] : []}
            getData={() => retrieveData()} />}
        <PushButtons
          key={keys.pushbuttonsKey}
          pushbuttons={videohubData.current.pushButtons || []}
          videohub={videohubData.current.currentVideohub}
        />
      </Stack>
    </VideohubPage>
  );
}

export default VideohubView