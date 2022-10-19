import { TableBody, TableCell, TableRow, Table, TableHeader, TableHeaderCell, TableCellLayout } from "@fluentui/react-components/unstable";
import { DataTable, DataTableItem } from "../../DataTableNew";
import { Role } from "../../interfaces/User";
import { Videohub } from "../../interfaces/Videohub";
import { UserOutput } from "../../modals/admin/UserOutputModal";

interface Props {
    videohub?: Videohub
    roles: Role[]
}

export const RolesView = (props: Props) => {
    function buildItems(roles: Role[]): DataTableItem[] {
        const items: DataTableItem[] = [];

        if (props.videohub != undefined) {
            for (const role of roles) {
                const cells: JSX.Element[] = [
                    <TableCellLayout key={role.name}>{role.name}</TableCellLayout>,
                    <TableCellLayout>s</TableCellLayout>,
                    <TableCellLayout key={"outputs"}>
                        <UserOutput videohub={props.videohub} role={role} />
                    </TableCellLayout>
                ]

                items.push({ key: role.name, cells: cells })
            }
        }

        return items;
    }

    return (
        <DataTable
            getItems={async function (): Promise<DataTableItem[] | undefined> {
                return Promise.resolve(buildItems(props.roles));
            }}
            tableUpdate={props.videohub?.id || 0}
            columns={[
                {
                    key: 'role',
                    label: 'Role',
                },
                {
                    key: 'permissions',
                    label: 'Permissions'
                },
                {
                    key: 'outputs',
                    label: 'Outputs',
                }
            ]} />
    );
}