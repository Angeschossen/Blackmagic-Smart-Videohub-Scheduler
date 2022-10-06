import { getToken } from "next-auth/jwt";
import { getRoleById } from "../../backend/backend";

export async function checkPermission(req: any, res: any, permission?: string) {
    const token = await getToken({ req: req });
    if (token != undefined && token.role_id != undefined) {
        const role = getRoleById(token.role_id);
        if (role != undefined) {
            if (permission == undefined || role.hasPermission(permission)) {
                return true;
            }
        }
    }

    return false;
}