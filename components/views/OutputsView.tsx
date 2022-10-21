import { Button } from "@fluentui/react-components";
import { TableCellLayout } from "@fluentui/react-components/unstable";
import Router from "next/router";
import { useClientSession } from "../auth/ClientAuthentication";
import DataTable, { DataTableColumn, DataTableItem } from "../DataTableNew";
import { hasRoleOutput, Role, User } from "../interfaces/User";
import { Videohub } from "../interfaces/Videohub";
import { getRoleById } from "./admin/RolesView";


const columns: DataTableColumn[] = [
    {
        label: 'Output',
    },
    {
        label: 'Input'
    },
    {
        label: 'Schedule'
    }
]

export const OutputsView = (props: { videohub?: Videohub, user: User }) => {

    function buildItems(): DataTableItem[] {
        const items: DataTableItem[] = []
console.log(props)
        if (props.videohub != undefined) {            
            for (const output of props.videohub.outputs) {
                const key: number = output.id

                const cells: JSX.Element[] = [
                    <TableCellLayout key={`${key}_output`}>
                        {output.label}
                    </TableCellLayout>,
                    <TableCellLayout key={`${key}_input`}>
                        {output.input_id == undefined ? "Unkown" : props.videohub.inputs[output.input_id].label}
                    </TableCellLayout>,
                    <TableCellLayout key={`${key}_schedule`}>
                        <Button disabled={!hasRoleOutput(props.user.role, props.videohub, output.id)}
                            onClick={() => {
                                Router.push({
                                    pathname: './events',
                                    query: { videohub: props.videohub?.id, output: output.id },
                                });
                            }}>
                            Schedule
                        </Button>
                    </TableCellLayout>
                ]

                items.push({ key: key, cells: cells })
            }
        }

        return items
    }

    return (
        <DataTable
            items={buildItems()}
            columns={columns} />
    )
}