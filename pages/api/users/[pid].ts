import { Prisma } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import Permissions from "../../../backend/authentication/Permissions";
import { addRole, getRoleById } from "../../../backend/backend";
import { checkServerPermission } from "../../../components/auth/ServerAuthentication";
import { Role, User } from "../../../components/interfaces/User";
import { sendResponseInvalid, sendResponseValid } from "../../../components/utils/requestutils";
import prismadb from '../../../database/prismadb';
import { getRoleByIdBackendUsage, sanitizeRole } from "../roles/[pid]";


export function sanitizeUser(user: any): User {
    return { id: user.id, username: user.username, role_id: user.role_id, role: sanitizeRole(user.role) }
}

export const selectUserParams: any = {
    password: false, // NO password
    usernameHash: false, // NO username
    id: true,
    username: true,
    role_id: true,
}

export async function retrieveUsersServerSide() {
    const users = await prismadb.user.findMany({
        select: selectUserParams // dpes not include role
    })

    const arr: User[] = [];
    for (const user of users) {
        arr.push(sanitizeUser(user))
    }

    return arr;

}

export async function retrieveUserServerSide(userId: string) {
    return await prismadb.user.findUnique({
        where: {
            id: userId,
        },
        select: (selectUserParams & {
            role: {
                include: {
                    permissions: true,
                    outputs: true,
                }
            } 
        } as any) as Prisma.UserSelect // does include role
    })
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        sendResponseInvalid(req, res, "POST required.")
        return
    }

    if (!await checkServerPermission(req, res, Permissions.PERMISSION_USER_EDIT)) {
        return
    }

    const { pid } = req.query;
    const body: any = req.body;
    switch (pid) {
        case "get": {
            const userId = body.id
            if (userId == undefined) {
                sendResponseValid(req, res, await retrieveUsersServerSide())
            } else {
                const user = await prismadb.user.findUnique({
                    where: {
                        id: userId,
                    },
                    include: {
                        role: true
                    }
                })

                if (user == undefined) {
                    sendResponseInvalid(req, res, "User doesn't exist.")
                    return
                }

                sendResponseValid(req, res, sanitizeUser(user))
            }

            return
        }

        case "getrole": {
            const userId = body.id
            if (userId == undefined) {
                sendResponseInvalid(req, res, "Params missing.")
                return
            }

            const user = await prismadb.user.findUnique({
                where: {
                    id: userId,
                },
                include: {
                    role: true
                }
            })

            if (user == undefined) {
                sendResponseInvalid(req, res, "User doesn't exist.")
                return
            }

            sendResponseValid(req, res, user.role)
        }

        case "delete": {
            const userId = body.id
            if (userId == undefined) {
                sendResponseInvalid(req, res, "Params missing.")
                return
            }

            const user = await prismadb.user.findUnique({
                where: {
                    id: userId,
                }
            })

            if (user == undefined) {
                sendResponseInvalid(req, res, "User doesn't exist.")
                return
            }

            const roleId = user.role_id
            if (roleId != undefined) {
                const role: Role | undefined = getRoleByIdBackendUsage(roleId)
                if (role != undefined && !role.editable) {
                    sendResponseInvalid(req, res, "User's role is not editable.")
                    return
                }
            }

            await prismadb.user.delete({
                where: {
                    id: userId,
                }
            })

            sendResponseValid(req, res)
            return
        }

        case "setrole": {
            const userId = body.user_id
            const roleId = body.role_id
            if (userId == undefined || roleId == undefined) {
                sendResponseInvalid(req, res, "Params missing.")
                return
            }

            // do not allow editing admin role (example)
            const role: Role | undefined = getRoleByIdBackendUsage(roleId);
            if (role == undefined || !role.editable) {
                sendResponseInvalid(req, res, "Role doesn't exist or not editable.")
                return
            }

            const user = await prismadb.user.findUnique({
                where: {
                    id: userId,
                }
            })

            // user does not exist
            if (user == undefined) {
                sendResponseInvalid(req, res, "User doesn't exist.")
                return
            }

            // do not allow demoting? (admin for example)
            const userRole = getRoleById(user.role_id)
            if (userRole != undefined && !userRole.editable) {
                sendResponseInvalid(req, res, "Role of user isn't editable.")
                return
            }

            await prismadb.user.update({
                where: {
                    id: userId,
                },
                data: {
                    role_id: role.id,
                }
            })

            sendResponseValid(req, res)
            return
        }

        default: {
            sendResponseInvalid(req, res, "Invalid PID")
            return;
        }
    }
}