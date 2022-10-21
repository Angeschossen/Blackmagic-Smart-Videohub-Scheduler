import { Stack } from "@fluentui/react";
import { Button } from "@fluentui/react-components";
import { TableBody, TableCell, TableRow, Table, TableHeader, TableHeaderCell, TableCellLayout } from "@fluentui/react-components/unstable";
import React from "react";
import { DataTable, DataTableItem } from "../../DataTableNew";
import { Role } from "../../interfaces/User";
import { Videohub } from "../../interfaces/Videohub";
import { CheckboxChoice, CheckBoxModal } from "../../modals/admin/CheckBoxModal";
import { UserOutput } from "../../modals/admin/UserOutputModal";
import { getPostHeader } from "../../utils/fetchutils";
import { useListRef } from "../../utils/menuUtils";
import { Delete16Regular } from '@fluentui/react-icons';

interface Props {
    videohub?: Videohub
    roles: Role[],
    permissions: CheckboxChoice[],
    onRoleDeleted: (role: Role) => void
}

export function getRoleByName(roles: Role[], name: string): Role|undefined {
    for (const role of roles) {
        if (role.name === name) {
            return role
        }
    }

    return undefined
}

export function getRoleById(roles: Role[], id: number): Role|undefined {
    for (const role of roles) {
        if (role.id === id) {
            return role
        }
    }

    return undefined
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
                    <TableCellLayout>
                        <Button
                            color="#bc2f32"
                            icon={<Delete16Regular />}
                            disabled={!role.editable}
                            onClick={async () => {
                                await fetch('/api/roles/delete', getPostHeader({ role_id: role.id })).then(res => {
                                    if (res.status === 200) {
                                        props.onRoleDeleted(role)
                                    }
                                });
                            }}>
                            Delete
                        </Button>
                    </TableCellLayout>
                ]

                const item: DataTableItem = { key: role.name, cells: cells };
                items.push(item)
            }
        }

        return items;
    }

    return (
        <Stack.Item>
            <DataTable
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
                    },
                    {
                        key: 'delete',
                        label: 'Delete'
                    }
                ]} items={buildItems(props.roles)} />
        </Stack.Item>
    );
}