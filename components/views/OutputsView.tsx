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

const columnsDefault = columns.slice()
columnsDefault.push({
    label: 'Default'
})

const getInputByLabel = (videohub: Videohub, label: string): Input | undefined => {
    for (const input of videohub.inputs) {
        if (input.label === label) {
            return input
        }
    }
}

export const OutputsView = (props: { videohub?: Videohub, outputs: Output[], user: User, selectInput?: boolean, onRoutingUpdate?: (routing: RoutingUpdate) => void }) => {
    function buildItems(): DataTableItem[] {
        const items: DataTableItem[] = []

        const videohub: Videohub | undefined = props.videohub
        if (videohub != undefined) {
            const inputs = videohub.inputs.map(input =>
                <Option key={input.id.toString()} value={input.label}>
                    {input.label}
                </Option>)

            const inputsDefault = inputs.slice()
            inputsDefault.splice(0, 0,
                <Option key={"-1"} value={"None"}>
                    None
                </Option>)

            for (const output of props.outputs) {
                const key: number = output.id
                const canEditOutput: boolean = hasRoleOutput(props.user.role, videohub.id, output.id)
                const isEdit = props.selectInput && canEditOutput

                const cells: JSX.Element[] = [
                    <TableCellLayout key={`${key}_output`}>
                        {output.label}
                    </TableCellLayout>,
                    <TableCellLayout key={`${key}_input`}>
                        {output.input_id == undefined ? "Unkown" :
                            isEdit ?
                                <Dropdown disabled={!canEditOutput} defaultSelectedOptions={[videohub.inputs[output.input_id].label]} placeholder={"Select input"}
                                    onOptionSelect={async (_event: any, data: any) => {
                                        const found: Input | undefined = getInputByLabel(videohub, data.optionValue)
                                        if (found == undefined) {
                                            throw Error(`No input with label ${data.optionValue} found.`)
                                        }

                                        const routingUpdate: RoutingUpdate = { videohubId: videohub.id, outputs: [output.id], inputs: [found.id] }
                                        await fetch('/api/videohubs/updateRouting', getPostHeader(routingUpdate)).then(async res => {
                                            if (props.onRoutingUpdate != undefined) {
                                                const json = await res.json()
                                                routingUpdate.error = json.error == undefined ? undefined : `Routing update failed: ${json.error}`
                                                props.onRoutingUpdate(routingUpdate)
                                            }
                                        })
                                    }}>
                                    {inputs}
                                </Dropdown> :
                                videohub.inputs[output.input_id].label}
                    </TableCellLayout>,
                ]

                if (props.selectInput) {
                    const selected = output.input_default_id == undefined ? "None" : videohub.inputs[output.input_default_id].label
                    cells.push(
                        <TableCellLayout key={`${key}_input_default`}>
                            {canEditOutput ?
                                <Dropdown disabled={!canEditOutput} defaultSelectedOptions={[selected]} placeholder={"Select default"}
                                    onOptionSelect={async (_event: any, data: any) => {
                                        const found: Input | undefined = getInputByLabel(videohub, data.optionValue)
                                        const routingUpdate: RoutingUpdate = { videohubId: videohub.id, outputs: [output.id], inputs: [found?.id || -1] }

                                        await fetch('/api/videohubs/setDefaultInput', getPostHeader(routingUpdate)).then(async res => {
                                            if (props.onRoutingUpdate != undefined) {
                                                const json = await res.json()
                                                routingUpdate.error = json.error == undefined ? undefined : `Default input update failed: ${json.error}`
                                                props.onRoutingUpdate(routingUpdate)
                                            }
                                        })
                                    }}>
                                    {inputsDefault}
                                </Dropdown> :
                                selected}
                        </TableCellLayout>
                    )
                }

                items.push({ key: key, cells: cells })
            }
        }

        return items
    }

    return (
        <DataTable
            items={buildItems()}
            columns={props.selectInput ? columnsDefault : columns} />
    )
}