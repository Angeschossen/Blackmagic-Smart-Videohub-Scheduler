import { Button } from "@fluentui/react-components";
import { TableCellLayout } from "@fluentui/react-components/unstable";
import DataTable, { DataTableColumn, DataTableItem } from "../../DataTableNew";
import { PushButton } from "../../interfaces/PushButton";
import { User } from "../../interfaces/User";
import { Videohub } from "../../interfaces/Videohub";
import { EditPushButtonModal } from "../../modals/EditPushButtonModalNew";

const columns: DataTableColumn[] = [
    {
        label: 'Name'
    },
    {
        label: 'Actions'
    },
    {
        label: 'Edit'
    }
]

export const PushButtonsTableView = (props: { videohub: Videohub, buttons: PushButton[], onButtonUpdate: (button: PushButton, action: "create" | "update" | "delete") => void, user: User }) => {

    function buildItems(): DataTableItem[] {
        const items: DataTableItem[] = []

        for (const button of props.buttons) {
            const key: number = button.id

            const cells: JSX.Element[] = [
                <TableCellLayout key={`${key}_name`}>
                    {button.label}
                </TableCellLayout>,
                <TableCellLayout key={`${key}_actions`}>
                    {button.actions.length} Action(s)
                </TableCellLayout>,
                <TableCellLayout key={`${key}_edit`}>
                    <EditPushButtonModal
                        user={props.user}
                        onButtonUpdate={props.onButtonUpdate}
                        videohub={props.videohub}
                        buttons={props.buttons}
                        button={button}
                        trigger={
                            <Button>
                                Edit
                            </Button>
                        }
                    />
                </TableCellLayout>,
            ]

            items.push({ key: key, cells: cells })
        }

        return items
    }

    return (
        <DataTable
            items={buildItems()}
            columns={columns}
        />
    )
}