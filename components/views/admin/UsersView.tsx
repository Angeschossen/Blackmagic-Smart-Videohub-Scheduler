import { TableCellLayout } from "@fluentui/react-components/unstable";
import { DataTable, DataTableColumn, DataTableItem } from "../../DataTableNew";
import { Role, User } from "../../interfaces/User";
import { Dropdown, Option } from "@fluentui/react-components/unstable";
import { getPostHeader } from "../../utils/fetchutils";
import { getRoleById, getRoleByName } from "./RolesView";
import { Button } from "@fluentui/react-components";
import { Delete16Regular } from "@fluentui/react-icons";

interface Props {
    roles: Role[],
    users: User[],
    onUserDeleted: (user: User) => void
}

const columns:DataTableColumn[] = [
    {
        label: 'Name',
    },
    {
        label: 'Role',
    },
    {
        label: 'Delete',
    }
]

export const UsersView = (props: Props) => {

    function buildItems(users: User[]): DataTableItem[] {
        const items: DataTableItem[] = [];

        for (const user of users) {
            const role: Role | undefined = getRoleById(props.roles, user.role_id)
            const key: string = user.id

            const cells: JSX.Element[] = [
                <TableCellLayout key={`${key}_username`}>{user.username}</TableCellLayout>,
                <TableCellLayout key={`${key}_role`}>
                    <Dropdown disabled={role != null && !role.editable} defaultSelectedOptions={role == undefined ? [] : [role.name]} placeholder={"Select a role"}
                        onOptionSelect={async (_event: any, data: any) => {
                            const name: string = data.optionValue;
                            const found: Role | undefined = getRoleByName(props.roles, name)
                            if (found != undefined) {
                                await fetch('/api/users/setrole', getPostHeader({ user_id: user.id, role_id: found.id }));
                            }
                        }}>
                        {props.roles.filter(role => role.editable).map(role =>
                            <Option key={role.id.toString()} value={role.name} disabled={role.id === 0}>
                                {role.name}
                            </Option>)}
                    </Dropdown>
                </TableCellLayout>,
                <TableCellLayout key={`${key}_delete`}>
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

            items.push({ key: key, cells: cells })
        }


        return items;
    }

    return (
        <DataTable
        items={buildItems(props.users)}
        columns={columns} />
    );
}