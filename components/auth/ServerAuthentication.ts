import { getToken } from "next-auth/jwt";
import { getRoleById } from "../../backend/backend";

export async function checkServerPermission(req: any, res: any, permission?: string) {
    const token = await getToken({ req: req });
    if (!handleCheckPermission(token, permission)) {
        res.status(401).json({ message: "Unauthorized" });
        return false;
    }

    return true;
}

export function handleCheckPermission(obj: any, permission?: string) {
    if (obj != undefined && obj.role_id != undefined) {
        const role = getRoleById(obj.role_id);
        if (role != undefined) {
            if (permission == undefined || role.hasPermission(permission)) {
                return true;
            }
        }
    }

    return false;
}