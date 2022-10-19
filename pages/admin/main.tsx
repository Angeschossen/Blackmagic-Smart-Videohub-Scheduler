import { PresenceBadgeStatus, Checkbox, CheckboxProps, Avatar, Label, Input, Radio, RadioGroup } from "@fluentui/react-components";
import { TableBody, TableCell, TableRow, Table, TableHeader, TableHeaderCell, TableCellLayout } from "@fluentui/react-components/unstable";
import * as React from 'react';
import { FolderRegular, EditRegular, OpenRegular, DocumentRegular, PeopleRegular, DocumentPdfRegular, VideoRegular } from '@fluentui/react-icons';
import DataTable, { DataTableItem } from "../../components/DataTableNew";
import { Role, User } from "../../components/interfaces/User";
import { retrieveUsersServerSide } from "../api/users/[pid]";
import { Button } from '@fluentui/react-components';
import { IStackStyles, IStackTokens, Stack } from "@fluentui/react";
import { videohubPageStyle } from "../../components/videohub/VideohubPage";
import { InputModal } from "../../components/modals/InputModalNew";
import SelectVideohub from "../../components/buttons/SelectVideohubNew";
import { Videohub } from "../../components/interfaces/Videohub";
import { retrieveVideohubsServerSide } from "../api/videohubs/[pid]";
import { UserOutput } from "../../components/modals/admin/UserOutputModal";
import { retrieveRolesServerSide } from "../api/roles/[pid]";
import { RolesView } from "../../components/views/admin/RolesView";
import { UsersView } from "../../components/views/admin/UsersView";
import { stackTokens } from "../../components/utils/styles";
import { CheckBoxModal } from "../../components/modals/admin/CheckBoxModal";
import { getPostHeader } from "../../components/utils/fetchutils";

const stackStyles: Partial<IStackStyles> = { root: { height: 44 } };
const tableStackTokens: IStackTokens = { childrenGap: 30 };


interface InputProps {
  videohubs: Videohub[],
  roles: Role[],
  users: User[],
}

export async function getServerSideProps(context: any) {
  context.res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=120'
  )

  const roles: Role[] = retrieveRolesServerSide();
  const hubs: Videohub[] = retrieveVideohubsServerSide();
  const users: User[] = await retrieveUsersServerSide();

  return {
    props: {
      videohubs: JSON.parse(JSON.stringify(hubs)),
      roles: JSON.parse(JSON.stringify(roles)),
      users: JSON.parse(JSON.stringify(users)),
    } as InputProps,
  }
}

export const Default = (props: InputProps) => {
  const [videohub, setVideohub] = React.useState<Videohub | undefined>(props.videohubs?.length == 0 ? undefined : props.videohubs[0])

  function buildItems(roles: Role[]): DataTableItem[] {
    const items: DataTableItem[] = [];

    if (videohub != undefined) {
      for (const role of roles) {
        const cells: JSX.Element[] = [
          <TableCellLayout key={role.name}>{role.name}</TableCellLayout>,
          <TableCellLayout key={"outputs"}>
            <CheckBoxModal
              title={"Outputs"}
              trigger={<Button>
                Outputs
              </Button>}
              handleSubmit={async function (checked: string[]): Promise<string | undefined> {
                const arr: number[] = checked.map(value => Number(value));
                console.log(arr)
                return fetch('/api/roles/setoutputs', getPostHeader({ videohub_id: videohub.id, role_id: role.id, outputs: arr })).then(res => {
                  return undefined;
                });
              }}
              defaultChecked={role.outputs.filter(output => output.videohub_id === videohub.id).map(output => output.output_id.toString())}
              choices={videohub.outputs.map(output => {
                return { value: output.id.toString(), label: output.label };
              })} />
          </TableCellLayout>
        ]

        items.push({ key: role.name, cells: cells })
      }
    }

    return items;
  }


  return (
    <Stack style={videohubPageStyle}>
      <Stack horizontal styles={stackStyles}>
        <SelectVideohub
          videohubs={props.videohubs || []}
          onSelectVideohub={(videohub: Videohub) => setVideohub(videohub)} />
      </Stack>
      <Stack tokens={tableStackTokens}>
        <Stack.Item>
          <h1>Roles</h1>
          <RolesView
            videohub={videohub}
            roles={props.roles} />
        </Stack.Item>
        <Stack.Item>
          <h1>Users</h1>
          <UsersView
            roles={props.roles}
            users={props.users} />
        </Stack.Item>
      </Stack>
    </Stack>
  )
};

export default Default;