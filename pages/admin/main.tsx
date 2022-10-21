import { PresenceBadgeStatus, Checkbox, CheckboxProps, Avatar, Label, Input, Radio, RadioGroup } from "@fluentui/react-components";
import { TableBody, TableCell, TableRow, Table, TableHeader, TableHeaderCell, TableCellLayout, Toolbar, ToolbarButton } from "@fluentui/react-components/unstable";
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
import { retrievePermissionsServerSide, retrieveRolesServerSide } from "../api/roles/[pid]";
import { RolesView } from "../../components/views/admin/RolesView";
import { UsersView } from "../../components/views/admin/UsersView";
import { stackTokens } from "../../components/utils/styles";
import { CheckBoxModal } from "../../components/modals/admin/CheckBoxModal";
import { getPostHeader } from "../../components/utils/fetchutils";
import { RoleModal } from "../../components/modals/admin/RoleModal";

const stackStyles: Partial<IStackStyles> = { root: { height: 44 } };
const tableStackTokens: IStackTokens = { childrenGap: 30 };


interface InputProps {
  videohubs: Videohub[],
  roles: Role[],
  users: User[],
  permissions: string[],
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
      permissions: retrievePermissionsServerSide(),
    } as InputProps,
  }
}

export const Default = (props: InputProps) => {
  const [videohub, setVideohub] = React.useState<Videohub | undefined>(props.videohubs?.length == 0 ? undefined : props.videohubs[0])
  const [roles, setRoles] = React.useState(props.roles)

  return (
    <Stack style={videohubPageStyle}>
      <Stack horizontal tokens={stackTokens}>
        <SelectVideohub
          videohubs={props.videohubs || []}
          onSelectVideohub={(videohub: Videohub) => setVideohub(videohub)} />
        <RoleModal
          roles={roles}
          role={undefined}
          trigger={<Button>
            Add Role
          </Button>}
          onRoleCreate={(role: Role) => {
            const arr = [...roles]
            arr.push(role)
            setRoles(arr)
            console.log("SETT")
          }}
          onRoleUpdate={(role: Role) => {
            const arr = [...roles]
            arr[arr.indexOf(role)] = role
            setRoles(arr)
          }}
        />
      </Stack>
      <Stack tokens={tableStackTokens}>
        <Stack.Item>
          <h1>Roles</h1>
          <RolesView
            videohub={videohub}
            roles={roles}
            permissions={props.permissions.map(perm => {
              return { value: perm, label: perm }
            })}
            onRoleDeleted={(role: Role) => {
              const arr = [...roles]
              arr.splice(arr.indexOf(role), 1)
              setRoles(arr)
            }}
          />
        </Stack.Item>
        <Stack.Item>
          <h1>Users</h1>
          <UsersView
            roles={roles}
            users={props.users} />
        </Stack.Item>
      </Stack>
    </Stack>
  )
};

export default Default;