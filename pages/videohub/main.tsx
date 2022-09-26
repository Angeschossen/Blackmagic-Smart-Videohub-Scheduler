import { Stack, CommandBarButton, IIconProps, IStackStyles, IContextualMenuItem } from '@fluentui/react';
import React from 'react';
import DayTable from '../../components/DayTable';
import Router from 'next/router'
import { retrieveVideohubsServerSide } from '../api/videohubs/[pid]';
import { Output, Videohub } from '../../components/Videohub';

const addIcon: IIconProps = { iconName: 'HardDriveGroup' };
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

  const hubs: Videohub[] = await retrieveVideohubsServerSide(true, true);
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
        throw new Error("Videohub doesn't exist any longer.");
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

  onSelectVideohub(hub: Videohub) {
    this.setState({ currentVideohub: hub });
  }

  // Here we use a Stack to simulate a command bar.
  // The real CommandBar control also uses CommandBarButtons internally.
  render() {
    return (
      <div style={{ margin: '10px' }}>
        <Stack horizontal styles={stackStyles}>
          <CommandBarButton
            iconProps={addIcon}
            text={"Select Videohub"}
            menuProps={{
              items: this.state.menuItems
            }}
          />
        </Stack>
        <DayTable
          onClick={(_e, item) => {
            if (this.state.currentVideohub == undefined) {
              throw Error("Videohub is undefined");
            }

            Router.push({
              pathname: './output',
              query: { videohub: this.state.currentVideohub.id, output: item.id },
            });
          }}
          onClickEdit={this.onClickEdit}
          getData={() => {
            if (this.state.currentVideohub === undefined) {
              return undefined;
            }

            return getItems(this.state.currentVideohub as Videohub);
          }}
        />
      </div>
    );
  }
}

export default VideohubView