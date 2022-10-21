import { RoleOutput, Videohub } from "@prisma/client";

export interface User {
    id: string,
    username: string,
    role_id?: number,
    role?: Role,
}

export interface Role {
    id: number,
    editable: boolean,
    name: string,
    outputs: RoleOutput[],
    permissions: string[],
}

export function hasRoleOutput(role: Role|undefined,videohub: Videohub, output_id: number): boolean {
    return role != undefined && role.outputs.find(output => output.videohub_id === videohub.id && output.output_id === output_id) != undefined
}
