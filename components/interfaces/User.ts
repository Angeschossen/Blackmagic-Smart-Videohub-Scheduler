import { RoleOutput } from "@prisma/client";

export interface User {
    id: string,
    username: string,
    roleId: number,
    roleName: string
}

export interface Role {
    id: number,
    editable: boolean,
    name: string,
    outputs: RoleOutput[],
    permissions: string[],
}
