import { Button } from "@fluentui/react-components";
import { TableCellLayout } from "@fluentui/react-components/unstable";
import Router from "next/router";
import React from "react";
import Permissions from "../../backend/authentication/Permissions";
import { useClientSession } from "../auth/ClientAuthentication";
import DataTable, { DataTableColumn, DataTableItem } from "../DataTableNew";
import { hasRoleOutput, Role, User } from "../interfaces/User";
import { Output, Videohub } from "../interfaces/Videohub";
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

export const OutputsView = (props: { videohub?: Videohub, outputs: Output[], user: User }) => {
    const canSchedule: boolean = useClientSession(Permissions.PERMISSION_VIDEOHUB_OUTPUT_SCHEDULE)

    function buildItems(): DataTableItem[] {
        const items: DataTableItem[] = []

        if (props.videohub != undefined) {
            for (const output of props.outputs) {
                const key: number = output.id

                const cells: JSX.Element[] = [
                    <TableCellLayout key={`${key}_output`}>
                        {output.label}
                    </TableCellLayout>,
                    <TableCellLayout key={`${key}_input`}>
                        {output.input_id == undefined ? "Unkown" : props.videohub.inputs[output.input_id].label}
                    </TableCellLayout>,
                    <TableCellLayout key={`${key}_schedule`}>
                        <Button disabled={!canSchedule || !hasRoleOutput(props.user.role, props.videohub, output.id)}
                            onClick={() => {
                                Router.push({
                                    pathname: './videohub/events',
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