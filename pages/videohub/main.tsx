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

function getItems(videohub: Videohub): any[] {
  const cloned: any[] = [];
  for (const output of videohub.outputs) {
    cloned.push({
      id: output.id,
      Output: output.label,
      Input: (output.input_id == undefined ? "None" : videohub.inputs[output.input_id].label),
    });
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
  function buildVideohubData(p: VideohubViewProps): VideohubData {
    const videohub: Videohub | undefined = getVideohub(p.videohubs, p.videohub);
    return { currentVideohub: videohub, videohubs: p.videohubs, pushButtons: p.pushbuttons };
  }

  const isDekstop = useViewType();
  const { data: session } = useSession();
  const [keys, setKeys] = useState<Keys>({tableKey: "table_0",pushbuttonsKey: "buttons_0"});
  const videohubData = React.useRef(buildVideohubData(props));
  const [data, setData] = useState<VideohubData>(videohubData.current);

  async function retrieveData(last?: Date): Promise<any[] | undefined> {
    return retrieveVideohubs().then(async res => {
      let videohub: Videohub | undefined;
      for (const hub of res) {
        const s: string = hub.lastRoutingUpdate as unknown as string; // because json format
        hub.lastRoutingUpdate = new Date(s);

        if (videohubData.current.currentVideohub == undefined || hub.id === videohubData.current.currentVideohub.id) {
          videohub = hub;
          break;
        }
      }

      if (videohub == undefined) {
        return [];
      }

      if (videohubData.current.currentVideohub?.id != videohub.id || videohubData.current.currentVideohub?.connected != videohub.connected) {
        onSelectVideohub(res, videohub);
        return undefined; // since it updates all
      }

      if (last != undefined) {
        if (videohub.lastRoutingUpdate != undefined && convert_date_to_utc(videohub.lastRoutingUpdate) <= convert_date_to_utc(last)) {
          return undefined; // same
        }
      }

      return getItems(videohub);
    });
  }

  function updateView(data: VideohubData) {
    console.log("Update view");
    videohubData.current = data;
    setKeys({tableKey: getRandomKey(), pushbuttonsKey: getRandomKey()});
  }

  function onSelectVideohub(videohubs: Videohub[], hub: Videohub) {
    retrievePushButtons(hub.id).then(pushbuttons => {
      updateView(buildVideohubData({ videohubs: videohubs, videohub: hub.id, pushbuttons: pushbuttons }));
    });
  }

  const canEdit: boolean = useClientSession(Permissions.PERMISSION_VIDEOHUB_EDIT);

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
        <h1>Schedule</h1>
        {isDekstop && session != undefined &&
          <DataTable
            key={keys.tableKey}
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
            getData={(last?: Date) => retrieveData(last)} />}
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