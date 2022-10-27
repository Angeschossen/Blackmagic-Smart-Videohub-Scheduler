import { Stack } from "@fluentui/react";
import { Button } from "@fluentui/react-components";
import { TableCellLayout } from "@fluentui/react-components/unstable";
import { Delete16Regular } from '@fluentui/react-icons';
import Permissions from "../../../backend/authentication/Permissions";
import { DataTable, DataTableColumn, DataTableItem } from "../../DataTableNew";
import { Role } from "../../interfaces/User";
import { Videohub } from "../../interfaces/Videohub";
import { CheckboxChoice, CheckBoxModal } from "../../modals/admin/CheckBoxModal";
import { getPostHeader } from "../../utils/fetchutils";

interface Props {
    videohub?: Videohub
    roles: Role[],
    permissions: CheckboxChoice[],
    onRoleDeleted: (role: Role) => void
}

const columns: DataTableColumn[] = [
    {
        label: 'Role',
    },
    {
        label: 'Permissions'
    },
    {
        label: 'Outputs',
    },
    {
        label: 'Delete'
    }
]

export function getRoleByName(roles: Role[], name: string): Role | undefined {
    for (const role of roles) {
        if (role.name === name) {
            return role
        }
    }

    return undefined
}

export function getRoleById(roles: Role[], id?: number): Role | undefined {
    if (id != undefined) {
        for (const role of roles) {
            if (role.id === id) {
                return role
            }
        }
    }

    return undefined
}

export const RolesView = (props: Props) => {
    function buildItems(): DataTableItem[] {
        const items: DataTableItem[] = [];

        for (const role of props.roles) {
            const key: string = role.name
            const cells: JSX.Element[] = [
                <TableCellLayout key={`${key}_name`}>{role.name}</TableCellLayout>,
                <TableCellLayout key={`${key}_permissions`}>
                    <CheckBoxModal
                        title={"Permissions"}
                        description="Permissions are global."
                        trigger={<Button disabled={!role.editable}>
                            Permissions
                        </Button>}
                        handleSubmit={async function (checked: string[]): Promise<string | undefined> {
                            return fetch('/api/roles/setpermissions', getPostHeader({ role_id: role.id, permissions: checked })).then(res => {
                                return undefined;
                            });
                        }}
                        defaultChecked={role.permissions.filter(perm => Permissions.toggleablePermissions.indexOf(perm) != -1)}
                        choices={props.permissions} />
                </TableCellLayout>,
                <TableCellLayout key={`${key}_outputs`}>
                    <CheckBoxModal
                        title={"Outputs"}
                        description="Outputs are per videohub."
                        trigger={<Button disabled={!role.editable}>
                            Outputs
                        </Button>}
                        handleSubmit={async function (checked: string[]): Promise<string | undefined> {
                            const videohub: Videohub | undefined = props.videohub
                            if (videohub == undefined) {
                                return "No videohub setup yet."
                            }

                            const arr: number[] = checked.map(value => Number(value))
                            return fetch('/api/roles/setoutputs', getPostHeader({ videohub_id: videohub.id, role_id: role.id, outputs: arr })).then(res => {
                                return undefined;
                            })
                        }}
                        defaultChecked={role.outputs.filter(output => output.videohub_id === props.videohub?.id).map(output => output.output_id.toString())}
                        choices={props.videohub?.outputs.map(output => {
                            return { value: output.id.toString(), label: output.label };
                        }) || []} />
                </TableCellLayout>,
                <TableCellLayout key={`${key}_delete`}>
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

            items.push({ key: key, cells: cells })
        }

        return items;
    }

    return (
        <Stack.Item>
            <DataTable
                columns={columns}
                items={buildItems()} />
        </Stack.Item>
    );
}