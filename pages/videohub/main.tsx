import { Stack, CommandBarButton, IIconProps, IStackStyles, IContextualMenuItem, ICommandBarItemProps, CommandBar, Button, IContextualMenuProps, MessageBar, MessageBarType, CompoundButton, TeachingBubble, DirectionalHint, Callout, mergeStyleSets, FontWeights, ProgressIndicator } from '@fluentui/react';
import React from 'react';
import DayTable from '../../components/DayTable';
import Router from 'next/router'
import { retrieveVideohubsServerSide } from '../api/videohubs/[pid]';
import { Output, RoutingRequest, Videohub } from '../../components/Videohub';
import DataTable from '../../components/DataTable';
import { VideohubFooter } from '../../components/VideohubFooter';
import { isAfter } from 'date-fns';
import { getRandomKey } from '../../components/utils/commonutils';
import { PushButton } from '../../components/interfaces/PushButton';
import { retrievePushButtonsServerSide } from '../api/pushbuttons/[pid]';
import useId from '@mui/utils/useId';
import PushButtonsList from '../pushbuttons/main';
import PushButtonsView from '../../components/views/PushButtonsView';
import { VideohubPage } from '../../components/videohub/VideohubPage';
import SelectVideohub from '../../components/buttons/SelectVideohub';

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

export async function getServerSideProps(context: any) {
  /*
  context.res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=120'
  )*/

  const hubs: Videohub[] = retrieveVideohubsServerSide();
  return {
    props: {
      videohubs: JSON.parse(JSON.stringify(hubs)),
    },
  }
}

function getItems(videohub: Videohub): any[] {
  const cloned: any[] = [];
  for (const output of videohub.outputs) {
    cloned.push({
      id: output.id,
      Output: output.label,
      Input: (output.input_id == null ? "None" : videohub.inputs[output.input_id].label),
    });
  }

  return cloned;
}


interface VideohubViewProps {
  videohubs: Videohub[],
}

class VideohubView extends React.Component<VideohubViewProps, { tableKey: number, videohubs: Videohub[], currentVideohub?: Videohub, currentEdit?: Output, menuItems: IContextualMenuItem[], addModalKey?: number, }> {
  private mounted: boolean = false;
  constructor(props: VideohubViewProps) {
    super(props);

    this.generateMenuItems = this.generateMenuItems.bind(this);
    this.state = {
      tableKey: getRandomKey(),
      currentVideohub: props.videohubs.length > 0 ? props.videohubs[0] : undefined,
      videohubs: props.videohubs,
      menuItems: this.generateMenuItems(props.videohubs),
    };

    this.onClickEdit = this.onClickEdit.bind(this);
    this.retrieveData = this.retrieveData.bind(this);
    this.onSelectVideohub = this.onSelectVideohub.bind(this);
    this.onClickAddPushButton = this.onClickAddPushButton.bind(this);
    this.scheduleRetrieveData = this.scheduleRetrieveData.bind(this);
  }

  componentDidMount() {
    if (this.mounted) {
      return;
    }

    this.mounted = true;
    this.scheduleRetrieveData();
  }

  generateMenuItems(res: Videohub[]): IContextualMenuItem[] {
    const menuItems: IContextualMenuItem[] = [];
    for (const hub of res) {
      menuItems.push({
        key: hub.id.toString(),
        text: hub.name,
        iconProps: { iconName: 'Calendar' },
        onClick: () => {
          this.onSelectVideohub(hub);
        }
      });
    }

    return menuItems;
  }

  scheduleRetrieveData() {
    this.retrieveData(() => {
      setTimeout(this.scheduleRetrieveData, 15000);
    });
  }

  retrieveData(onSet?: () => void) {
    console.log("Retrieving videohubs.");
    retrieveVideohubs().then(res => {
      let videohub: Videohub | undefined;
      for (const hub of res) {
        if (this.state.currentVideohub == undefined || hub.id === this.state.currentVideohub.id) {
          videohub = hub;
          break;
        }
      }

      if (videohub == undefined) {
        return;
      }

      const menuItems: IContextualMenuItem[] = this.generateMenuItems(res);
      this.setState({ menuItems: menuItems, currentVideohub: videohub, videohubs: res, tableKey: getRandomKey() }, () => {
        console.log("Loaded data.");

        if (onSet != undefined) {
          onSet();
        }
      });
    });
  }

  onClickEdit(output: Output) {
    this.setState({ currentEdit: output });
  }

  onClickAddPushButton() {
    if (this.state.currentVideohub == undefined) {
      return;
    }

    Router.push({
      pathname: '../pushbuttons/main',
      query: { videohub: this.state.currentVideohub.id },
    });
  }

  onSelectVideohub(hub: Videohub) {
    this.setState({ currentVideohub: hub, tableKey: getRandomKey() });
  }

  // Here we use a Stack to simulate a command bar.
  // The real CommandBar control also uses CommandBarButtons internally.
  render() {
    const inst: VideohubView = this;
    return (
      <VideohubPage videohub={this.state.currentVideohub}>
        <Stack horizontal styles={stackStyles}>
          <SelectVideohub
            videohubs={this.state.videohubs}
            onSelectVideohub={(hub: Videohub) => this.onSelectVideohub(hub)} />
        </Stack>
        <DataTable
          key={this.state.tableKey}
          controlcolumns={[
            {
              key: "edit",
              onClick(_event, item) {
                if (inst.state.currentVideohub == undefined) {
                  throw Error("Videohub is undefined");
                }

                Router.push({
                  pathname: './output',
                  query: { videohub: inst.state.currentVideohub.id, output: item.id },
                });
              },
              text: "Edit"
            }
          ]}
          getData={() => {
            console.log("Get data");
            if (this.state.currentVideohub === undefined) {
              return undefined;
            }

            return getItems(this.state.currentVideohub as Videohub);
          }} />
        <PushButtonsView
          videohub={this.state.currentVideohub}
          onRoutingUpdated={() => {
            this.retrieveData(undefined);
          }} />
      </VideohubPage>
    );
  }
}

export default VideohubView