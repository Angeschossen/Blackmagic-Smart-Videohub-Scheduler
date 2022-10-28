import { Button } from "@fluentui/react-components";
import { TableCellLayout } from "@fluentui/react-components/unstable";
import { CalendarAddRegular, CalendarEditRegular, EditRegular } from "@fluentui/react-icons";
import Permissions from "../../../backend/authentication/Permissions";
import { useClientSession } from "../../auth/ClientAuthentication";
import DataTable, { DataTableColumn, DataTableItem } from "../../DataTableNew";
import { IPushButton } from "../../interfaces/PushButton";
import { User } from "../../interfaces/User";
import { Videohub } from "../../interfaces/Videohub";
import { EditPushButtonModal } from "../../modals/pushbuttons/EditPushButtonModalNew";
import { PushButtonScheduleModal } from "../../modals/pushbuttons/PushButtonScheduleModal";

const columns: DataTableColumn[] = [
    {
        label: 'Name'
    },
    {
        label: 'Description'
    },
    {
        label: 'Edit'
    },
    {
        label: 'Schedule'
    }
]

export const PushButtonsTableView = (props: { videohub: Videohub, buttons: IPushButton[], onButtonUpdate: (button: IPushButton, action: "create" | "update" | "delete") => void, user: User }) => {
    const canSchedule: boolean = useClientSession(Permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_SCHEDULE)

    function buildItems(): DataTableItem[] {
        const items: DataTableItem[] = []

        for (const button of props.buttons) {
            const key: number = button.id

            const cells: JSX.Element[] = [
                <TableCellLayout key={`${key}_name`}>
                    {button.label}
                </TableCellLayout>,
                <TableCellLayout key={`${key}_description`}>
                    {button.description || `${button.actions.length} Action(s)`}
                </TableCellLayout>,
                <TableCellLayout key={`${key}_edit`}>
                    <EditPushButtonModal
                        user={props.user}
                        onButtonUpdate={props.onButtonUpdate}
                        videohub={props.videohub}
                        buttons={props.buttons}
                        button={button}
                        trigger={
                            <Button icon={<EditRegular />}>
                                Edit
                            </Button>
                        }
                    />
                </TableCellLayout>,
                <TableCellLayout key={`${key}_schedule`}>
                    <PushButtonScheduleModal
                        button={button}
                        trigger={
                            <Button
                                icon={<CalendarEditRegular />}
                                disabled={!canSchedule}>
                                Schedule
                            </Button>
                        } />
                </TableCellLayout>
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