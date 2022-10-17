import { PresenceBadgeStatus, Avatar, Label, Input, Radio, RadioGroup } from "@fluentui/react-components";
import { TableBody, TableCell, TableRow, Table, TableHeader, TableHeaderCell, TableCellLayout } from "@fluentui/react-components/unstable";
import * as React from 'react';
import { FolderRegular, EditRegular, OpenRegular, DocumentRegular, PeopleRegular, DocumentPdfRegular, VideoRegular } from '@fluentui/react-icons';
import DataTable, { DataTableItem } from "../../components/DataTableNew";
import { User } from "../../components/interfaces/User";
import { retrieveUsersServerSide } from "../api/users/[pid]";
import { Button } from '@fluentui/react-components';
import { IStackStyles, Stack } from "@fluentui/react";
import { videohubPageStyle } from "../../components/videohub/VideohubPage";
import { InputModal } from "../../components/modals/InputModalNew";
import SelectVideohub from "../../components/buttons/SelectVideohubNew";
import { Videohub } from "../../components/interfaces/Videohub";
import { retrieveVideohubsServerSide } from "../api/videohubs/[pid]";

const stackStyles: Partial<IStackStyles> = { root: { height: 44 } };


interface InputProps {
  videohubs?: Videohub[],
  users: User[],
}

export async function getServerSideProps(context: any) {
  context.res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=120'
  )

  const users: User[] = await retrieveUsersServerSide();
  const hubs: Videohub[] = retrieveVideohubsServerSide();

  return {
    props: {
      videohubs: JSON.parse(JSON.stringify(hubs)),
      users: JSON.parse(JSON.stringify(users)),
    } as InputProps,
  }
}

function buildItems(users: User[]): DataTableItem[] {
  const items: DataTableItem[] = [];

  for (const user of users) {
    const cells: JSX.Element[] = [
      <TableCellLayout key={user.username}>{user.username}</TableCellLayout>,
      <TableCellLayout key={"outputs"}>
        <InputModal
          title={"Outputs"}
          onConfirm={function (obj?: any): string | undefined {
            return "error";
          }}
          trigger={<Button>
            Outputs
          </Button>}>
          <div
            style={{
              display: 'grid',
              gridRowGap: 'var(--spacingVerticalS)',
              overflowY: 'hidden'
            }}
          >
            <Label id="label462">
              Favorite Fruit
            </Label>
            <RadioGroup aria-labelledby="label462">
              <Radio
                label="Apple"
                value="apple"
              />
              <Radio
                label="Pear"
                value="pear"
              />
              <Radio
                label="Banana"
                value="banana"
              />
              <Radio
                label="Orange"
                value="orange"
              />
              <Radio
                label="Orange2"
                value="orange2"
              />
            </RadioGroup>
          </div>
        </InputModal>
      </TableCellLayout>
    ]

    items.push({ key: user.username, cells: cells })
  }

  return items;
}


export const Default = (props: InputProps) => {
  const [videohub, setVideohub] = React.useState<Videohub>()

  return (
    <Stack style={videohubPageStyle}>
      <Stack horizontal styles={stackStyles}>
        <SelectVideohub
          videohubs={props.videohubs || []}
          onSelectVideohub={(videohub: Videohub) => setVideohub(videohub)} />
      </Stack>
      <DataTable
        getItems={async function (): Promise<DataTableItem[] | undefined> {
          return Promise.resolve(buildItems(props.users));
        }}
        tableUpdate={0}
        columns={[
          {
            key: 'username',
            label: 'Username',
          },
          {
            key: 'outputs',
            label: 'Outputs',
          }
        ]} />
    </Stack>
  )
};

export default Default;