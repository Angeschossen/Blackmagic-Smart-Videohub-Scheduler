import { Stack } from "@fluentui/react";
import { Button } from "@fluentui/react-components";
import { AddRegular } from "@fluentui/react-icons";
import React from "react";
import { IPushButton } from "../../components/interfaces/PushButton";
import { User } from "../../components/interfaces/User";
import { Videohub } from "../../components/interfaces/Videohub";
import { EditPushButtonModal } from "../../components/modals/pushbuttons/EditPushButtonModalNew";
import { VideohubPage } from "../../components/videohub/VideohubPage";
import { PushButtonsTableView } from "../../components/views/pushbuttons/PushButtonsTableView";
import { retrievePushButtonsServerSide } from "../api/pushbuttons/[pid]";
import { retrieveUserServerSideByReq } from "../api/users/[pid]";
import { getVideohubFromQuery } from "../api/videohubs/[pid]";

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
        const buttons = await retrievePushButtonsServerSide(context.req, videohub.id);
        return {
            props: {
                videohub: JSON.parse(JSON.stringify(videohub)),
                pushbuttons: JSON.parse(JSON.stringify(buttons)),
                user: JSON.parse(JSON.stringify(await retrieveUserServerSideByReq(context.req)))
            },
        }
    }
}

const PushButtonListNew = (props: { videohub: Videohub, pushbuttons: IPushButton[], user: User }) => {
    const [videohub, setVideohub] = React.useState(props.videohub)
    const [buttons, setButtons] = React.useState<IPushButton[]>(props.pushbuttons)

    const onButtonUpdate = (button: IPushButton, action: "create" | "update" | "delete") => {
        const arr: IPushButton[] = [...buttons]

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
                    user={props.user}
                    videohub={videohub}
                    buttons={buttons}
                    trigger={
                        <Button icon={<AddRegular />}>
                            Add
                        </Button>}
                    onButtonUpdate={onButtonUpdate} />
            </Stack>
            <PushButtonsTableView
                user={props.user}
                videohub={videohub}
                buttons={buttons}
                onButtonUpdate={onButtonUpdate} />
        </VideohubPage>
    )
}

export default PushButtonListNew