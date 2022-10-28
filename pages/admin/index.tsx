import { IStackStyles, IStackTokens, Stack } from "@fluentui/react";
import { Button } from '@fluentui/react-components';
import { AddRegular } from "@fluentui/react-icons";
import * as React from 'react';
import SelectVideohub from "../../components/buttons/SelectVideohubNew";
import { Role, User } from "../../components/interfaces/User";
import { Videohub } from "../../components/interfaces/Videohub";
import { RoleModal } from "../../components/modals/admin/RoleModal";
import { stackTokens } from "../../components/utils/styles";
import { videohubPageStyle } from "../../components/videohub/VideohubPage";
import { RolesView } from "../../components/views/admin/RolesView";
import { UsersView } from "../../components/views/admin/UsersView";
import { retrievePermissionsServerSide, retrieveRolesServerSide } from "../api/roles/[pid]";
import { retrieveUsersServerSide } from "../api/users/[pid]";
import { retrieveVideohubsServerSide } from "../api/videohubs/[pid]";

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
  const [users, setUsers] = React.useState(props.users)

  return (
    <Stack style={videohubPageStyle}>
      <Stack horizontal tokens={stackTokens}>
        <SelectVideohub
          videohubs={props.videohubs || []}
          onSelectVideohub={(videohub: Videohub) => setVideohub(videohub)} />
        <RoleModal
          roles={roles}
          trigger={
            <Button
              icon={<AddRegular />}>
              Add Role
            </Button>
          }
          onRoleCreate={(role: Role) => {
            const arr = [...roles]
            arr.push(role)
            setRoles(arr)
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
            users={users}
            onUserDeleted={(user: User) => {
              const arr = [...users]
              arr.splice(arr.indexOf(user), 1)
              setUsers(arr)
            }} />
        </Stack.Item>
      </Stack>
    </Stack>
  )
};

export default Default;