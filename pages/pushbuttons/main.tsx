import { CommandBarButton, IDropdownOption, IIconProps, IStackStyles, Stack } from "@fluentui/react";
import React from "react";
import DataTable from "../../components/DataTable";
import { PushButton } from "../../components/interfaces/PushButton";
import { EditPushButtonModal, Routing } from "../../components/modals/EditPushButtonModal";
import { Videohub } from "../../components/Videohub";
import { VideohubFooter } from "../../components/VideohubFooter";
import { retrievePushButtonsServerSide } from "../api/pushbuttons/[pid]";
import { getVideohubFromQuery } from "../api/videohubs/[pid]";
const stackStyles: Partial<IStackStyles> = { root: { height: 44 } };
const addIcon: IIconProps = { iconName: 'Add' };

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

class PushButtonsView extends React.Component<InputProps, { isAddModalOpen: boolean }>{
    private optionsOutput: IDropdownOption[];
    private optionsInput: IDropdownOption[];

    constructor(props: InputProps) {
        super(props);

        this.state = {
            isAddModalOpen: false,
        }

        this.optionsOutput = [];
        for (const input of props.videohub.outputs) {
            this.optionsOutput.push({
                key: input.id,
                text: input.label,
            });
        }

        this.optionsInput = [];
        for (const input of props.videohub.inputs) {
            this.optionsInput.push({
                key: input.id,
                text: input.label,
            });
        }

        this.onClickAdd = this.onClickAdd.bind(this);
    }

    onClickAdd() {
        this.setState({ isAddModalOpen: true })
    }

    render() {
        return (
            <div style={{ marginTop: '1vh' }}>
                <Stack horizontal styles={stackStyles}>
                    <CommandBarButton
                        iconProps={addIcon}
                        text={"Add"}
                        onClick={() => this.onClickAdd()}
                    />

                </Stack>
                <DataTable
                    editText="Edit"
                    onClickEdit={(e: any, item: any) => {

                    }}
                    getData={() => {
                        return getItems(this.props.pushbuttons);
                    }
                    }
                />

                <EditPushButtonModal
                    isOpen={this.state.isAddModalOpen}
                    optionsInput={this.optionsOutput}
                    optionsOutput={this.optionsInput}
                    close={() => this.setState({ isAddModalOpen: false })}
                    onConfirm={(routings: Routing[]) => {
                        


                    }}
                />
                <VideohubFooter videohub={this.props.videohub} />
            </div>
        )
    }
}

export default PushButtonsView;