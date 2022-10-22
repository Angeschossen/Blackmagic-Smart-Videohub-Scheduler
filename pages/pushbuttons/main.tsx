import { CommandBarButton, IDropdownOption, IIconProps, IsFocusVisibleClassName, IStackStyles, Stack } from "@fluentui/react";
import React from "react";
import DataTable from "../../components/DataTable";
import { PushButton } from "../../components/interfaces/PushButton";
import { Videohub } from "../../components/interfaces/Videohub";
import { VideohubPage } from "../../components/videohub/VideohubPage";
import { getRandomKey } from "../../components/utils/commonutils";
import { getPostHeader } from "../../components/utils/fetchutils";
import { retrievePushButtonsServerSide } from "../api/pushbuttons/[pid]";
import { getVideohubFromQuery } from "../api/videohubs/[pid]";
import { Button } from "@fluentui/react-components";
import { EditPushButtonModal } from "../../components/modals/EditPushButtonModalNew";
import { PushButtonsTableView } from "../../components/views/pushbuttons/PushButtonsTableView";
import { arrayBuffer } from "node:stream/consumers";

const addIcon: IIconProps = { iconName: 'Add' };



export async function getServerSideProps(context: any) {
    context.res.setHeader(
        'Cache-Control',
        'public, s-maxage=60, stale-while-revalidate=120'
    )

    const videohub: Videohub = getVideohubFromQuery(context.query);
    if (videohub == undefined) {
        return {
            notFound: true,
        }
    } else {
        const buttons: PushButton[] = await retrievePushButtonsServerSide(videohub.id);
        return {
            props: {
                videohub: JSON.parse(JSON.stringify(videohub)),
                pushbuttons: JSON.parse(JSON.stringify(buttons))
            },
        }
    }
}

function getItems(pushButtons: PushButton[]): Promise<any[] | undefined> {
    return new Promise((resolve) => {
        const cloned: any[] = [];
        for (const button of pushButtons) {
            cloned.push({
                id: button.id,
                Name: button.label,
                Actions: button.actions.length
            });
        }

        resolve(cloned);
    });
}


const PushButtonListNew = (props: { videohub: Videohub, pushbuttons: PushButton[] }) => {

    const [videohub, setVideohub] = React.useState(props.videohub)
    const [buttons, setButtons] = React.useState<PushButton[]>(props.pushbuttons)

    React.useEffect(() => {

    }, [videohub])

    const onButtonUpdate = (button: PushButton, action: "create" | "update" | "delete") => {
        const arr: PushButton[] = [...buttons]

        switch (action) {
            case "create": {
                arr.push(button)
                break
            }

            case "update": {
                let found: boolean = false
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i].id === button.id) {
                        arr[i] = button // update
                        found = true
                        break
                    }
                }

                if (!found) {
                    throw Error("Couldn't find matching button.")
                }

                break
            }

            case "delete": {
                arr.splice(arr.indexOf(button), 1)
                break
            }

            default: {
                throw Error(`Unhandled action: ${action}`)
            }
        }

        setButtons(arr)
    }
    return (
        <VideohubPage videohub={props.videohub}>
            <Stack horizontal>
                <EditPushButtonModal
                    videohub={videohub}
                    buttons={buttons}
                    trigger={
                        <Button>
                            Add
                        </Button>}
                    onButtonUpdate={onButtonUpdate} />
            </Stack>
            <PushButtonsTableView
                videohub={videohub}
                buttons={buttons}
                onButtonUpdate={onButtonUpdate} />
        </VideohubPage>
    )
}

export default PushButtonListNew