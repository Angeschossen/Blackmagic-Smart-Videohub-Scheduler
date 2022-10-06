import { Stack, IStackStyles, IContextualMenuItem } from '@fluentui/react';
import React, { useEffect, useState } from 'react';
import Router from 'next/router'
import { getVideohubFromQuery, retrieveVideohubsServerSide } from '../api/videohubs/[pid]';
import { Videohub } from '../../components/interfaces/Videohub';
import DataTable from '../../components/DataTable';
import { getRandomKey } from '../../components/utils/commonutils';
import { PushButton } from '../../components/interfaces/PushButton';
import { retrievePushButtonsServerSide } from '../api/pushbuttons/[pid]';
import { VideohubPage } from '../../components/videohub/VideohubPage';
import SelectVideohub from '../../components/buttons/SelectVideohub';
import { PushButtons } from '../../components/views/PushButtonsView';
import { useViewType } from '../../components/views/DesktopView';
import { useSession } from 'next-auth/react';
import { checkClientPermission } from '../../components/auth/ClientAuthentication';
import Permissions from '../../backend/authentication/Permissions';

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
  tableKey: number,
  pushButtons: PushButton[],
  pushButtonsKey: number,
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
  function buildVideohubData(props: VideohubViewProps): VideohubData {
    const videohub: Videohub | undefined = getVideohub(props.videohubs, props.videohub);
    return { menuItems: generateMenuItems(props.videohubs), currentVideohub: videohub, videohubs: props.videohubs, tableKey: getRandomKey(), pushButtons: props.pushbuttons, pushButtonsKey: getRandomKey() };
  }

  const isDekstop = useViewType();
  const { data: session } = useSession();
  const [videohubData, setVideohubData] = useState(buildVideohubData(props));
  let retrieveTimeout: NodeJS.Timeout | undefined;

  useEffect(() => {
    scheduleRetrieveData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  function scheduleRetrieveData() {
    if (retrieveTimeout != undefined) {
      clearTimeout(retrieveTimeout);
    }

    retrieveTimeout = setTimeout(async () => {
      await retrieveData();
      scheduleRetrieveData();
    }, 5000);
  }

  async function retrieveData() {
    console.log("Retrieving videohubs.");
    retrieveVideohubs().then(async res => {
      let videohub: Videohub | undefined;
      for (const hub of res) {
        if (videohubData.currentVideohub == undefined || hub.id === videohubData.currentVideohub.id) {
          videohub = hub;
          break;
        }
      }

      if (videohub == undefined) {
        return;
      }

      let change: boolean;
      if (videohubData.currentVideohub != undefined) {
        if (videohubData.currentVideohub.connected == videohub.connected) {
          change = false;
          for (let i = 0; i < videohub.outputs.length; i++) {
            if (videohubData.currentVideohub.outputs[i].input_id != videohub.outputs[i].input_id) {
              change = true;
              break;
            }
          }
        } else {
          change = true;
        }
      } else {
        change = true;
      }

      if (change) {
        let pushbuttons: PushButton[];
        if (videohub != null && videohubData.currentVideohub?.id != videohub.id) {
          pushbuttons = await retrievePushButtons(videohub.id);
        } else {
          pushbuttons = [];
        }

        setVideohubData(buildVideohubData({ videohubs: res, videohub: videohub.id, pushbuttons: pushbuttons }));
        console.log("Loaded data.");
      } else {
        console.log("No change.");
      }
    });
  }

  function onSelectVideohub(hub: Videohub) {
    retrievePushButtons(hub.id).then(pushbuttons => {
      setVideohubData(buildVideohubData({ videohubs: videohubData.videohubs, videohub: hub.id, pushbuttons: pushbuttons }));
    });
  }  

  // Here we use a Stack to simulate a command bar.
  // The real CommandBar control also uses CommandBarButtons internally.
  return (
    <VideohubPage videohub={videohubData.currentVideohub}>
      <Stack horizontal styles={stackStyles}>
        <SelectVideohub
          videohubs={videohubData.videohubs}
          onSelectVideohub={(hub: Videohub) => onSelectVideohub(hub)} />
      </Stack>
      {isDekstop &&
        <>
          <h1>Schedule</h1>
          {session ? <DataTable
            key={videohubData.tableKey}
            controlcolumns={checkClientPermission(Permissions.PERMISSION_VIDEOHUB_EDIT) ? [
              {
                key: "edit",
                onClick(_event, item) {
                  if (videohubData.currentVideohub == undefined) {
                    throw Error("Videohub is undefined");
                  }

                  Router.push({
                    pathname: './events',
                    query: { videohub: videohubData.currentVideohub.id, output: item.id },
                  });
                },
                text: "Schedule"
              }
            ]: []}
            getData={() => {
              console.log("Get data");
              if (videohubData.currentVideohub === undefined) {
                return undefined;
              }

              return getItems(videohubData.currentVideohub as Videohub);
            }} /> :
            <p>You are not logged in or you are missing permission to schedule outputs.</p>}
        </>}
      <PushButtons
        key={videohubData.pushButtonsKey}
        pushbuttons={videohubData.pushButtons}
        videohub={videohubData.currentVideohub}
        onRoutingUpdated={async () => {
          await retrieveData();
        }} />
      <Stack style={{ paddingTop: '2vh', paddingBottom: '2vh' }}>
      </Stack>
    </VideohubPage>
  );
}

export default VideohubView