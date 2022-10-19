import { TableBody, TableCell, TableRow, Table, TableHeader, TableHeaderCell, TableCellLayout } from "@fluentui/react-components/unstable";
import { DataTable, DataTableItem } from "../../DataTableNew";
import { Role, User } from "../../interfaces/User";
import { Videohub } from "../../interfaces/Videohub";
import { UserOutput } from "../../modals/admin/UserOutputModal";
import { Dropdown, Option, DropdownProps } from "@fluentui/react-components/unstable";

interface Props {
    roles: Role[],
    users: User[],
}

export const UsersView = (props: Props) => {

    function buildItems(): DataTableItem[] {
        const items: DataTableItem[] = [];

        for (const user of props.users) {
            const cells: JSX.Element[] = [
                <TableCellLayout key={user.username}>{user.username}</TableCellLayout>,
                <TableCellLayout key={`${user.username}_role`}>
                    <Dropdown defaultSelectedOptions={user.roleName == undefined ? [] : [user.roleName]} placeholder={user.roleName || "Select a role"} 
                    onOptionSelect={(_event: any, data: any)=>{
                        
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
            getItems={async function (): Promise<DataTableItem[] | undefined> {
                return Promise.resolve(buildItems());
            }}
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