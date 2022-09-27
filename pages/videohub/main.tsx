import { Stack, CommandBarButton, IIconProps, IStackStyles, IContextualMenuItem, ICommandBarItemProps, CommandBar, Button, IContextualMenuProps, MessageBar, MessageBarType } from '@fluentui/react';
import React from 'react';
import DayTable from '../../components/DayTable';
import Router from 'next/router'
import { retrieveVideohubsServerSide } from '../api/videohubs/[pid]';
import { Output, Videohub } from '../../components/Videohub';
import DataTable from '../../components/DataTable';
import { VideohubFooter } from '../../components/VideohubFooter';
import { SelectVideohub } from '../../components/buttons/SelectVideohub';

const addIcon: IIconProps = { iconName: 'Add' };
const videohubIcon: IIconProps = { iconName: 'HardDriveGroup' };
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
      videohubs: JSON.parse(JSON.stringify(hubs))
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
  videohubs: Videohub[]
}

class VideohubView extends React.Component<VideohubViewProps, { videohubs: Videohub[], currentVideohub?: Videohub, currentEdit?: Output, menuItems: IContextualMenuItem[] }> {
  private menuProps: IContextualMenuProps;

  constructor(props: VideohubViewProps) {
    super(props);

    this.generateMenuItems = this.generateMenuItems.bind(this);
    this.state = {
      currentVideohub: props.videohubs.length > 0 ? props.videohubs[0] : undefined,
      videohubs: props.videohubs,
      menuItems: this.generateMenuItems(props.videohubs),
    };

    this.onClickEdit = this.onClickEdit.bind(this);
    this.retrieveData = this.retrieveData.bind(this);
    this.onSelectVideohub = this.onSelectVideohub.bind(this);
    this.onClickAddPushButton = this.onClickAddPushButton.bind(this);

    this.menuProps = {
      items: [
        {
          key: 'push',
          text: 'Pushbutton',
          iconProps: { iconName: 'Add' },
          onClick: (e, item) => { this.onClickAddPushButton() }
        }
      ]
    };
  }

  componentDidMount() {
    this.retrieveData();
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

  retrieveData() {
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

      this.setState({ menuItems: menuItems, currentVideohub: videohub, videohubs: res }, () => {
        console.log("Loaded videohubs");
        setTimeout(this.retrieveData, 5000);
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

    console.log("Push")
    Router.push({
      pathname: '../pushbuttons/main',
      query: { videohub: this.state.currentVideohub.id },
    });
  }

  onSelectVideohub(hub: Videohub) {
    this.setState({ currentVideohub: hub });
  }

  // Here we use a Stack to simulate a command bar.
  // The real CommandBar control also uses CommandBarButtons internally.
  render() {
    return (
      <div style={{ marginTop: '1vh' }}>
        <Stack horizontal styles={stackStyles}>
          <SelectVideohub
            videohubs={this.state.videohubs}
            onSelectVideohub={(hub: Videohub) => this.onSelectVideohub(hub)}
          />
          <CommandBarButton
            iconProps={addIcon}
            text="Edit"
            menuProps={this.menuProps}
          />
        </Stack>
        <DataTable
          editText='Schedule'
          onClickEdit={(_e: any, item: any) => {
            if (this.state.currentVideohub == undefined) {
              throw Error("Videohub is undefined");
            }

            Router.push({
              pathname: './output',
              query: { videohub: this.state.currentVideohub.id, output: item.id },
            });
          }}
          getData={() => {
            if (this.state.currentVideohub === undefined) {
              return undefined;
            }

            return getItems(this.state.currentVideohub as Videohub);
          }}
        />
        <VideohubFooter videohub={this.state.currentVideohub} />
      </div>
    );
  }
}

export default VideohubView