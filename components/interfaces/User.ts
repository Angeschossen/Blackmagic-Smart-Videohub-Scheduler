import { RoleOutput } from "@prisma/client";

export interface User {
    username: string,
    roleId: number,
    roleName: string
}

export interface Role {
    id: number,
    name: string,
    outputs: RoleOutput[],
}
