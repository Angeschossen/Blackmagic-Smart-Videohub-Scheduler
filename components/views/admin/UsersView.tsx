import { TableBody, TableCell, TableRow, Table, TableHeader, TableHeaderCell, TableCellLayout } from "@fluentui/react-components/unstable";
import { DataTable, DataTableItem } from "../../DataTableNew";
import { Role, User } from "../../interfaces/User";
import { Videohub } from "../../interfaces/Videohub";
import { UserOutput } from "../../modals/admin/UserOutputModal";
import { Dropdown, Option, DropdownProps } from "@fluentui/react-components/unstable";
import { getPostHeader } from "../../utils/fetchutils";
import { getRoleById, getRoleByName } from "./RolesView";
import { Button } from "@fluentui/react-components";
import { Delete16Regular } from "@fluentui/react-icons";
import { DataTableProps } from "../../DataTable";

interface Props {
    roles: Role[],
    users: User[],
    onUserDeleted: (user: User) => void
}

export const UsersView = (props: Props) => {

    function buildItems(users: User[]): DataTableItem[] {
        const items: DataTableItem[] = [];

        for (const user of users) {
            const role: Role | undefined = getRoleById(props.roles, user.roleId)
            const cells: JSX.Element[] = [
                <TableCellLayout key={user.username}>{user.username}</TableCellLayout>,
                <TableCellLayout key={`${user.username}_role`}>
                    <Dropdown disabled={role != null && !role.editable} defaultSelectedOptions={role == undefined ? [] : [role.name]} placeholder={"Select a role"}
                        onOptionSelect={async (_event: any, data: any) => {
                            const name: string = data.optionValue;
                            const found: Role | undefined = getRoleByName(props.roles, name)
                            if (found != undefined) {
                                await fetch('/api/users/setrole', getPostHeader({ user_id: user.id, role_id: found.id }));
                            }
                        }}
                        {...props}>
                        {props.roles.filter(role => role.editable).map(role =>
                            <Option key={role.id.toString()} value={role.name} disabled={role.id === 0}>
                                {role.name}
                            </Option>)}
                    </Dropdown>
                </TableCellLayout>,
                <TableCellLayout>
                    <Button
                        color="#bc2f32"
                        icon={<Delete16Regular />}
                        disabled={role != undefined && !role.editable}
                        onClick={async () => {
                            await fetch('/api/users/delete', getPostHeader({ id: user.id })).then(res => {
                                if (res.status === 200) {
                                    props.onUserDeleted(user)
                                }
                            });
                        }}>
                        Delete
                    </Button>
                </TableCellLayout>,
            ]

            items.push({ key: user.username, cells: cells })
        }


        return items;
    }

    return (
        <DataTable
        items={buildItems(props.users)}
        columns={[
            {
                key: 'name',
                label: 'Name',
            },
            {
                key: 'role',
                label: 'Role',
            },
            {
                key: 'delete',
                label: 'Delete',
            }
        ]} />
    );
}