import { RoleOutput } from "@prisma/client";

export interface User {
    username: string,
    role?: Role,
}

export interface Role {
    id: number,
    name: string,
    outputs: RoleOutput[],
}
