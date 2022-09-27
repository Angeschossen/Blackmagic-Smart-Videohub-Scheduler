import React from "react";
import DataTable from "../../components/DataTable";
import { PushButton } from "../../components/PushButton";
import { Videohub } from "../../components/Videohub";
import { VideohubFooter } from "../../components/VideohubFooter";
import { retrievePushButtonsServerSide } from "../api/pushbuttons/[pid]";
import { getVideohubFromQuery, retrieveVideohubServerSide } from "../api/videohubs/[pid]";

interface InputProps {
    videohub: Videohub,
    pushbuttons: PushButton[],
}

export async function getServerSideProps(context: any) {
    /*
    context.res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=120'
    )*/

    const videohub: Videohub = getVideohubFromQuery(context.query);
    const buttons: PushButton[] = await retrievePushButtonsServerSide(videohub.id);
    return {
        props: {
            videohub: JSON.parse(JSON.stringify(videohub)),
            pushbuttons: JSON.parse(JSON.stringify(buttons))
        },
    }
}

function getItems(pushButtons: PushButton[]): any[] {
    const cloned: any[] = [];
    for (const button of pushButtons) {
        cloned.push({
            Name: button.label,
            Actions: button.actions.length
        });
    }

    return cloned;
}

class PushButtonsView extends React.Component<InputProps, {}>{
    constructor(props: InputProps) {
        super(props);
    }

    render() {
        return (
            <div>
                <DataTable
                    editText="Edit"
                    onClickEdit={(e: any, item: any) => {

                    }}
                    getData={() => {
                        return getItems(this.props.pushbuttons);
                    }
                    }
                />
                <VideohubFooter videohub={this.props.videohub}/>
            </div>
        )
    }
}

export default PushButtonsView;