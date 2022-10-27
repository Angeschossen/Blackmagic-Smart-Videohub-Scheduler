import { Button } from "@fluentui/react-components";
import { Role } from "../../interfaces/User";
import { Videohub } from "../../interfaces/Videohub";
import { getPostHeader } from "../../utils/fetchutils";
import { CheckBoxModal } from "./CheckBoxModal";


interface Props {
    role: Role,
    videohub: Videohub,
}

export const UserOutput = (props: Props) => {
 
    return (
        <CheckBoxModal
            title={"Outputs"}
            trigger={<Button>
                Outputs
            </Button>}
            handleSubmit={async function (checked: string[]): Promise<string | undefined> {
                return fetch('/api/roles/setoutputs', getPostHeader({ videohub_id: props.videohub.id, role_id: props.role.id, outputs: checked })).then(res => {
                    return undefined;
                });
            } } 
            defaultChecked={props.role.outputs.filter(output => output.videohub_id === props.videohub.id).map(output => output.output_id.toString())} 
            choices={props.videohub.outputs.map(output => {
                return {value: output.id.toString(), label: output.label};
            })}/>
    )
}