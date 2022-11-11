import { Dropdown, Option, TableCellLayout } from "@fluentui/react-components/unstable";
import { userAgent } from "next/server";
import DataTable, { DataTableColumn, DataTableItem } from "../DataTableNew";
import { hasRoleOutput, User } from "../interfaces/User";
import { Input, Output, RoutingUpdate, Videohub } from "../interfaces/Videohub";
import { getRandomKey } from "../utils/commonutils";
import { getPostHeader } from "../utils/fetchutils";


const columns: DataTableColumn[] = [
    {
        label: 'Output',
    },
    {
        label: 'Input'
    },
]

export const getInputByLabel = (videohub: Videohub, label: string): Input => {
    for (const input of videohub.inputs) {
        if (input.label === label) {
            return input
        }
    }

    throw Error(`No input with label ${label} found.`)
}

export const OutputsView = (props: { videohub?: Videohub, outputs: Output[], user: User, selectInput?: boolean, onRoutingUpdate?: (routing: RoutingUpdate) => void }) => {
    function buildItems(): DataTableItem[] {
        const items: DataTableItem[] = []

        const videohub: Videohub | undefined = props.videohub
        if (videohub != undefined) {
            for (const output of props.outputs) {
                const key: number = output.id

                const cells: JSX.Element[] = [
                    <TableCellLayout key={`${key}_output`}>
                        {output.label}
                    </TableCellLayout>,
                    <TableCellLayout key={`${key}_input`}>
                        {output.input_id == undefined ? "Unkown" :
                            props.selectInput ?
                                <Dropdown disabled={!hasRoleOutput(props.user.role, videohub.id, output.id)} defaultSelectedOptions={[videohub.inputs[output.id].label]} placeholder={"Select input"}
                                    onOptionSelect={async (_event: any, data: any) => {
                                        const found: Input = getInputByLabel(videohub, data.optionValue)
                                        const routingUpdate: RoutingUpdate = { videohubId: videohub.id, outputs: [output.id], inputs: [found.id] }

                                        await fetch('/api/videohubs/updateRouting', getPostHeader(routingUpdate)).then(async res => {
                                            if (props.onRoutingUpdate != undefined) {
                                                const json = await res.json()
                                                routingUpdate.error = json.error
                                                props.onRoutingUpdate(routingUpdate)
                                            }
                                        })
                                    }}>
                                    {videohub.inputs.map(input =>
                                        <Option key={input.id.toString()} value={input.label}>
                                            {input.label}
                                        </Option>)}
                                </Dropdown> :
                                videohub.inputs[output.input_id].label}
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