import { IIconProps, Stack } from "@fluentui/react";
import React from "react";
import { PushButton } from "../../components/interfaces/PushButton";
import { Videohub } from "../../components/interfaces/Videohub";
import { VideohubPage } from "../../components/videohub/VideohubPage";
import { retrievePushButtonsServerSide } from "../api/pushbuttons/[pid]";
import { getVideohubFromQuery } from "../api/videohubs/[pid]";
import { Button } from "@fluentui/react-components";
import { EditPushButtonModal } from "../../components/modals/EditPushButtonModalNew";
import { PushButtonsTableView } from "../../components/views/pushbuttons/PushButtonsTableView";
import { User } from "../../components/interfaces/User";
import { retrieveUserServerSide, retrieveUserServerSideByReq } from "../api/users/[pid]";

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
        const buttons: PushButton[] = await retrievePushButtonsServerSide(context.req, videohub.id);
        return {
            props: {
                videohub: JSON.parse(JSON.stringify(videohub)),
                pushbuttons: JSON.parse(JSON.stringify(buttons)),
                user: JSON.parse(JSON.stringify(await retrieveUserServerSideByReq(context.req)))
            },
        }
    }
}

const PushButtonListNew = (props: { videohub: Videohub, pushbuttons: PushButton[], user: User }) => {

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
                    user={props.user}
                    videohub={videohub}
                    buttons={buttons}
                    trigger={
                        <Button>
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