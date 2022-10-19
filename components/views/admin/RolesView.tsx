import { Stack } from "@fluentui/react";
import { Button } from "@fluentui/react-components";
import { TableBody, TableCell, TableRow, Table, TableHeader, TableHeaderCell, TableCellLayout } from "@fluentui/react-components/unstable";
import { DataTable, DataTableItem } from "../../DataTableNew";
import { Role } from "../../interfaces/User";
import { Videohub } from "../../interfaces/Videohub";
import { CheckboxChoice, CheckBoxModal } from "../../modals/admin/CheckBoxModal";
import { UserOutput } from "../../modals/admin/UserOutputModal";
import { getPostHeader } from "../../utils/fetchutils";

interface Props {
    videohub?: Videohub
    roles: Role[],
    permissions: CheckboxChoice[],
}

export const RolesView = (props: Props) => {
    function buildItems(roles: Role[]): DataTableItem[] {
        const items: DataTableItem[] = [];

        const videohub = props.videohub;
        if (videohub != undefined) {
            for (const role of roles) {
                const cells: JSX.Element[] = [
                    <TableCellLayout key={role.name}>{role.name}</TableCellLayout>,
                    <TableCellLayout key={`${role.name}_permissions`}>
                        <CheckBoxModal
                            title={"Permissions"}
                            description="Permissions are global."
                            trigger={<Button>
                                Permissions
                            </Button>}
                            handleSubmit={async function (checked: string[]): Promise<string | undefined> {
                                if (props.videohub != undefined) {
                                    return fetch('/api/roles/setpermissions', getPostHeader({ role_id: role.id, permissions: checked })).then(res => {
                                        return undefined;
                                    });
                                }
                            }}
                            defaultChecked={role.permissions.map(p => p)}
                            choices={props.permissions} />
                    </TableCellLayout>,
                    <TableCellLayout key={`${role.name}_outputs`}>
                        <CheckBoxModal
                            title={"Outputs"}
                            description="Outputs are per videohub."
                            trigger={<Button>
                                Outputs
                            </Button>}
                            handleSubmit={async function (checked: string[]): Promise<string | undefined> {
                                const arr: number[] = checked.map(value => Number(value));
                                return fetch('/api/roles/setoutputs', getPostHeader({ videohub_id: videohub.id, role_id: role.id, outputs: arr })).then(res => {
                                    return undefined;
                                });
                            }}
                            defaultChecked={role.outputs.filter(output => output.videohub_id === videohub.id).map(output => output.output_id.toString())}
                            choices={videohub.outputs.map(output => {
                                return { value: output.id.toString(), label: output.label };
                            })} />
                    </TableCellLayout>,
                ]

                items.push({ key: role.name, cells: cells })
            }
        }

        return items;
    }

    return (
        <Stack.Item>
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
        </Stack.Item>
    );
}