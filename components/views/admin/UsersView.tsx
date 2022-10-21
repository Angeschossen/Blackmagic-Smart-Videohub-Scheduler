import { TableBody, TableCell, TableRow, Table, TableHeader, TableHeaderCell, TableCellLayout } from "@fluentui/react-components/unstable";
import { DataTable, DataTableItem } from "../../DataTableNew";
import { Role, User } from "../../interfaces/User";
import { Videohub } from "../../interfaces/Videohub";
import { UserOutput } from "../../modals/admin/UserOutputModal";
import { Dropdown, Option, DropdownProps } from "@fluentui/react-components/unstable";
import { getPostHeader } from "../../utils/fetchutils";
import { getRoleById, getRoleByName } from "./RolesView";

interface Props {
    roles: Role[],
    users: User[],
}

export const UsersView = (props: Props) => {

    function buildItems(): DataTableItem[] {
        const items: DataTableItem[] = [];

        for (const user of props.users) {
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
                        {props.roles.map(role => <Option key={role.id.toString()} value={role.name} disabled={role.id === 0}>
                            {role.name}
                        </Option>)}
                    </Dropdown>
                </TableCellLayout>,
            ]

            items.push({ key: user.username, cells: cells })
        }


        return items;
    }

    return (
        <DataTable
            items={buildItems()}
            tableUpdate={0}
            columns={[
                {
                    key: 'name',
                    label: 'Name',
                },
                {
                    key: 'role',
                    label: 'Role',
                }
            ]} />
    );
}