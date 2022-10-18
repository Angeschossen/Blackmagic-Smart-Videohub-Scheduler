import { PresenceBadgeStatus, Checkbox, CheckboxProps, Avatar, Label, Input, Radio, RadioGroup } from "@fluentui/react-components";
import { TableBody, TableCell, TableRow, Table, TableHeader, TableHeaderCell, TableCellLayout } from "@fluentui/react-components/unstable";
import * as React from 'react';
import { FolderRegular, EditRegular, OpenRegular, DocumentRegular, PeopleRegular, DocumentPdfRegular, VideoRegular } from '@fluentui/react-icons';
import DataTable, { DataTableItem } from "../../components/DataTableNew";
import { Role, User } from "../../components/interfaces/User";
import { retrieveUsersServerSide } from "../api/users/[pid]";
import { Button } from '@fluentui/react-components';
import { IStackStyles, Stack } from "@fluentui/react";
import { videohubPageStyle } from "../../components/videohub/VideohubPage";
import { InputModal } from "../../components/modals/InputModalNew";
import SelectVideohub from "../../components/buttons/SelectVideohubNew";
import { Videohub } from "../../components/interfaces/Videohub";
import { retrieveVideohubsServerSide } from "../api/videohubs/[pid]";
import { UserOutput } from "../../components/modals/UserOutputModal";
import { retrieveRolesServerSide } from "../api/roles/[pid]";

const stackStyles: Partial<IStackStyles> = { root: { height: 44 } };


interface InputProps {
  videohubs: Videohub[],
  roles: Role[],
}

export async function getServerSideProps(context: any) {
  context.res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=120'
  )

  const roles: Role[] = retrieveRolesServerSide();
  const hubs: Videohub[] = retrieveVideohubsServerSide();

  return {
    props: {
      videohubs: JSON.parse(JSON.stringify(hubs)),
      roles: JSON.parse(JSON.stringify(roles)),
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
            <UserOutput videohub={videohub} role={role} />
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
      <DataTable
        getItems={async function (): Promise<DataTableItem[] | undefined> {
          return Promise.resolve(buildItems(props.roles));
        }}
        tableUpdate={videohub?.id || 0}
        columns={[
          {
            key: 'role',
            label: 'Role',
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