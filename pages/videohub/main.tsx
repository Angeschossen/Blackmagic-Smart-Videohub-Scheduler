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
  menuItems: IContextualMenuItem[],
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

export const VideohubView = (props: VideohubViewProps) => {
  function buildVideohubData(p: VideohubViewProps): VideohubData {
    const videohub: Videohub | undefined = getVideohub(p.videohubs, p.videohub);
    return { menuItems: generateMenuItems(p.videohubs), currentVideohub: videohub, videohubs: p.videohubs, pushButtons: p.pushbuttons };
  }

  const isDekstop = useViewType();
  const { data: session } = useSession();
  const [pushButtonsKey, setPushButtonsKey] = useState<Key>("buttons_0");
  const [tableKey, setTableKey] = useState<Key>("table_0");
  const [videohubData, setVideohubData] = useState<VideohubData>(buildVideohubData(props));

  function generateMenuItems(res: Videohub[]): IContextualMenuItem[] {
    const menuItems: IContextualMenuItem[] = [];
    for (const hub of res) {
      menuItems.push({
        key: hub.id.toString(),
        text: hub.name,
        iconProps: { iconName: 'Calendar' },
        onClick: () => {
          onSelectVideohub(hub);
        }
      });
    }

    return menuItems;
  }

  async function retrieveData(last?: Date): Promise<any[] | undefined> {
    return retrieveVideohubs().then(async res => {
      let videohub: Videohub | undefined;
      for (const hub of res) {
        const s: string = hub.lastRoutingUpdate as unknown as string; // because json format
        hub.lastRoutingUpdate = new Date(s);

        if (videohubData?.currentVideohub == undefined || hub.id === videohubData.currentVideohub.id) {
          videohub = hub;
          break;
        }
      }

      if (videohub == undefined) {
        return [];
      }

      const isDifferent = videohubData?.currentVideohub?.id != videohub.id;
      if (!isDifferent && last != undefined) {
        if (videohub.lastRoutingUpdate != undefined && convert_date_to_utc(videohub.lastRoutingUpdate) <= convert_date_to_utc(last)) {
          return undefined; // same
        }
      }

      return getItems(videohub);
    });
  }

  function updateView(data: VideohubData) {
    setVideohubData(data);
    setTableKey(getRandomKey());
  }

  function onSelectVideohub(hub: Videohub) {
    retrievePushButtons(hub.id).then(pushbuttons => {
      updateView(buildVideohubData({ videohubs: props.videohubs, videohub: hub.id, pushbuttons: pushbuttons }));
      setPushButtonsKey(getRandomKey());
    });
  }

  function shouldComponentUpdate(nextProp: any, nextState: any) {
    return false;

  }

  const canEdit: boolean = useClientSession(Permissions.PERMISSION_VIDEOHUB_EDIT);

  // Here we use a Stack to simulate a command bar.
  // The real CommandBar control also uses CommandBarButtons internally.
  return (
    <VideohubPage videohub={videohubData?.currentVideohub}>
      <Stack horizontal styles={stackStyles}>
        <SelectVideohub
          videohubs={videohubData?.videohubs || []}
          onSelectVideohub={(hub: Videohub) => onSelectVideohub(hub)} />
      </Stack>
      <h1>Schedule</h1>
      {isDekstop && session != undefined&&<DataTable
        key={tableKey}
        controlcolumns={canEdit ? [
          {
            key: "edit",
            onClick(_event, item) {
              if (videohubData?.currentVideohub == undefined) {
                throw Error("Videohub is undefined");
              }

              Router.push({
                pathname: './events',
                query: { videohub: videohubData.currentVideohub.id, output: item.id },
              });
            },
            text: "Schedule"
          }
        ] : []}
        getData={(last?: Date) => retrieveData(last)} />}
      <PushButtons
        key={pushButtonsKey}
        pushbuttons={videohubData?.pushButtons || []}
        videohub={videohubData?.currentVideohub}
      />
      <Stack style={{ paddingTop: '2vh', paddingBottom: '2vh' }}>
      </Stack>
    </VideohubPage>
  );
}

export default VideohubView