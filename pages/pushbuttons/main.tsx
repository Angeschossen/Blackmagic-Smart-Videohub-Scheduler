import { CommandBarButton, IDropdownOption, IIconProps, IsFocusVisibleClassName, IStackStyles, Stack } from "@fluentui/react";
import React, { Key } from "react";
import DataTable from "../../components/DataTable";
import { PushButton, PushbuttonAction } from "../../components/interfaces/PushButton";
import { EditPushButtonModal } from "../../components/modals/EditPushButtonModal";
import { Videohub } from "../../components/Videohub";
import { VideohubPage } from "../../components/videohub/VideohubPage";
import { VideohubFooter } from "../../components/VideohubFooter";
import { getRandomKey } from "../../utils/commonutils";
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

class PushButtonsList extends React.Component<InputProps, { key: number, isAddModalOpen: boolean, currentEdit?: PushButton, pushButtons: PushButton[] }>{
    private optionsOutput: IDropdownOption[];
    private optionsInput: IDropdownOption[];
    private mounted: boolean = false;

    constructor(props: InputProps) {
        super(props);

        this.state = {
            key: getRandomKey(),
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
        const inst: PushButtonsList = this;
        return (
            <VideohubPage videohub={this.props.videohub}>
                <Stack horizontal styles={stackStyles}>
                    <CommandBarButton
                        iconProps={addIcon}
                        text={"Add"}
                        onClick={() => this.onClickAdd()}
                    />

                </Stack>
                <DataTable
                    key={this.state.key}
                    controlcolumns={
                        [
                            {
                                key: 'edit',
                                onClick(_event, item) {
                                    for (const button of inst.state.pushButtons) {
                                        if (button.id === item.id) {
                                            inst.setState({ isAddModalOpen: true, currentEdit: button });
                                            break;
                                        }
                                    }
                                },
                                text: "Edit",
                            },
                        ]
                    }
                    getData={() => {
                        return getItems(this.state.pushButtons);
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
                    onConfirm={async (button: PushButton) => {
                        fetch('/api/pushbuttons/update', getPostHeader(button)).then(async (res) => {
                            const json = await res.json();
                            const arr: PushButton[] = this.state.pushButtons.slice();

                            if (button.id == -1) {
                                arr.push(json);
                            } else {
                                let found: boolean = false;
                                for (let i = 0; i < arr.length; i++) {
                                    if (arr[i].id === button.id) {
                                        arr[i] = button; // update
                                        found = true;
                                        break;
                                    }
                                }

                                if (!found) {
                                    throw Error("Couldn't find matching button.");
                                }
                            }

                            this.setState({ pushButtons: arr, key: this.state.key + 1, });
                        });
                    }}
                    onDelete={(id: number) => {
                        let arr: PushButton[] = this.state.pushButtons.slice();
                        arr = arr.filter(e => e.id != id);

                        this.setState({ pushButtons: arr, key: getRandomKey() });
                    }} />}
            </VideohubPage>
        )
    }
}

export default PushButtonsList;