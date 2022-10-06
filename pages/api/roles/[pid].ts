import { NextApiRequest, NextApiResponse } from "next";
import { getRoleById } from "../../../backend/backend";
import { checkServerPermission } from "../../../components/auth/ServerAuthentication";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (!await checkServerPermission(req, res)) {
        return;
    }

    const { pid } = req.query;
    switch (pid) {
        case "haspermission": {
            const permission: string | undefined = req.body.permission;
            const role_id: number | undefined = req.body.role_id;

            if (role_id == undefined) {
                res.status(405).json({ message: 'Invalid request.' });
                return;
            }

            const role: any = getRoleById(role_id);
            res.status(200).json({ result: role != undefined && (permission == undefined || role.hasPermission(permission)) });
            break;
        }

        default: {
            res.status(405).json({ message: 'Invalid request.' });
            return;
        }
    }
}