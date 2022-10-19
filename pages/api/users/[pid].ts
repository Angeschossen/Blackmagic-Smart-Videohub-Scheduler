import { NextApiRequest, NextApiResponse } from "next";
import Permissions from "../../../backend/authentication/Permissions";
import { getRoleById } from "../../../backend/backend";
import { checkServerPermission } from "../../../components/auth/ServerAuthentication";
import { User } from "../../../components/interfaces/User";
import prismadb from '../../../database/prismadb';


export async function retrieveUsersServerSide() {
    return await prismadb.user.findMany({
        include: {
            role: true
        }
    })
        .then((r: any) => {
            const arr: User[] = [];
            for(const user of r){
                arr.push({username: user.username, roleId: user.role?.id, roleName: user.role?.name});
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
    switch (pid) {
        case "get": {
            res.status(200).json(await retrieveUsersServerSide());
            return;
        }

        default: {
            res.status(405).json({ message: 'Invalid request.' });
            return;
        }
    }
}