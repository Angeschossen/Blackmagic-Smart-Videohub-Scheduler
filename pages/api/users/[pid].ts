import { NextApiRequest, NextApiResponse } from "next";
import Permissions from "../../../backend/authentication/Permissions";
import { getRoleById } from "../../../backend/backend";
import { checkServerPermission } from "../../../components/auth/ServerAuthentication";
import { User } from "../../../components/interfaces/User";
import prismadb from '../../../database/prismadb';


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
    if (!await checkServerPermission(req, res, Permissions.PERMISSION_USER_EDIT)) {
        return;
    }

    const { pid } = req.query;
    const body: any = req.body;
    switch (pid) {
        case "get": {
            res.status(200).json(await retrieveUsersServerSide());
            return;
        }

        case "setrole": {
            console.log(body)
            const userId = body.user_id
            const roleId = body.role_id
            if (userId == undefined || roleId == undefined) {
                res.status(405).json({ message: 'Invalid request.' });
                return
            }

            const role = getRoleById(roleId);
            if (role == undefined || role.id == 0) {
                res.status(405).json({ message: 'Invalid request.' });
                return
            }

            await prismadb.user.update({
                where: {
                    id: userId,
                },
                data: {
                    role_id: role.id,
                }
            }).then((_r: any) => {
                res.status(200).json({ message: 'Updated.' });
            })

            return
        }

        default: {
            res.status(405).json({ message: 'Invalid request.' });
            return;
        }
    }
}