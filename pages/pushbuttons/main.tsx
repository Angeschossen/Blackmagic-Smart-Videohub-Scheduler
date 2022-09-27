import { CommandBarButton, IDropdownOption, IIconProps, IStackStyles, Stack } from "@fluentui/react";
import React from "react";
import DataTable from "../../components/DataTable";
import { PushButton, PushbuttonAction } from "../../components/interfaces/PushButton";
import { EditPushButtonModal, Routing } from "../../components/modals/EditPushButtonModal";
import { Videohub } from "../../components/Videohub";
import { VideohubFooter } from "../../components/VideohubFooter";
import { getPostHeader } from "../../utils/fetchutils";
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
            id: button.id,
            Name: button.label,
            Actions: button.actions.length
        });
    }

    return cloned;
}

class PushButtonsView extends React.Component<InputProps, { isAddModalOpen: boolean, currentEdit?: PushButton, pushButtons: PushButton[] }>{
    private optionsOutput: IDropdownOption[];
    private optionsInput: IDropdownOption[];
    private mounted: boolean = false;

    constructor(props: InputProps) {
        super(props);

        this.state = {
            isAddModalOpen: false,
            pushButtons: props.pushbuttons,
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


    componentDidMount() {
        if (this.mounted) {
            return;
        }

        this.mounted = true;
        //this.retrieveData();
    }

    onClickAdd() {
        this.setState({ isAddModalOpen: true })
    }

    retrieveData() {
        /*
        console.log("Retrieving pushbuttons.");
        retrievePushButtonsServerSide(this.props.videohub.id).then(res => {
            this.setState({ pushButtons: res }, () => {
                console.log("Loaded pushbuttons");
                setTimeout(this.retrieveData, 30000);
            });
        });*/
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
                    onClickEdit={(_e: any, item: any) => {
                        for (const button of this.state.pushButtons) {
                            if (button.id === item.id) {
                                this.setState({ isAddModalOpen: true, currentEdit: button });
                            }
                        }
                    }}
                    getData={() => {
                        return getItems(this.props.pushbuttons);
                    }
                    }
                />

                {this.state.isAddModalOpen && <EditPushButtonModal
                    isOpen={this.state.isAddModalOpen}
                    optionsInput={this.optionsInput}
                    optionsOutput={this.optionsOutput}
                    videohub={this.props.videohub}
                    buttons={this.state.pushButtons}
                    button={this.state.currentEdit}
                    close={() => { this.setState({ isAddModalOpen: false, currentEdit: undefined }); }}
                    onConfirm={async (label: string, actions: PushbuttonAction[]) => {
                        const button: PushButton = {
                            id: -1,
                            videohub_id: this.props.videohub.id,
                            label: label,
                            actions: actions,
                        };

                        fetch('/api/pushbuttons/update', getPostHeader(button)).then(async (res) => {
                            const json = await res.json();
                            const arr: PushButton[] = this.state.pushButtons.slice();
                            arr.push(json);
                            this.setState({ pushButtons: arr }, () => {
                                console.log(this.state.pushButtons);
                            });
                        });
                    }}
                />}
                <VideohubFooter videohub={this.props.videohub} />
            </div>
        )
    }
}

export default PushButtonsView;