import { NextApiRequest, NextApiResponse } from "next";
import Permissions from "../../../backend/authentication/Permissions";
import { addRole, getRoleById } from "../../../backend/backend";
import { checkServerPermission } from "../../../components/auth/ServerAuthentication";
import { Role, User } from "../../../components/interfaces/User";
import { sendResponseInvalid, sendResponseValid } from "../../../components/utils/requestutils";
import prismadb from '../../../database/prismadb';
import { getRoleByIdBackendUsage } from "../roles/[pid]";


function getSanitizedUser(user: any): User {
    return { id: user.id, username: user.username, roleId: user.role?.id, roleName: user.role?.name };
}
export async function retrieveUsersServerSide() {
    return await prismadb.user.findMany({
        include: {
            role: true
        }
    })
        .then((r: any) => {
            const arr: User[] = [];
            for (const user of r) {
                arr.push(getSanitizedUser(user));
            }

            return arr;
        });
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
            sendResponseValid(req, res, await retrieveUsersServerSide())
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