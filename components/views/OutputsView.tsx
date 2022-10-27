import { TableCellLayout } from "@fluentui/react-components/unstable";
import DataTable, { DataTableColumn, DataTableItem } from "../DataTableNew";
import { User } from "../interfaces/User";
import { Output, Videohub } from "../interfaces/Videohub";


const columns: DataTableColumn[] = [
    {
        label: 'Output',
    },
    {
        label: 'Input'
    },
]

export const OutputsView = (props: { videohub?: Videohub, outputs: Output[], user: User }) => {
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