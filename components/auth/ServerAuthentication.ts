import { getToken } from "next-auth/jwt";
import { getRoleById } from "../../backend/backend";
import { User } from "../interfaces/User";
import { sendResponseInvalid } from "../utils/requestutils";


export async function isUser(req: any, res: any, userId?: string) {
    const idFromToken: string = await getUserIdFromToken(req)

    if (userId == undefined || idFromToken != userId) {
        sendResponseInvalid(req, res, "User is not same as Id parameter.")
        return false
    }

    return true
}

export async function checkServerPermission(req: any, res: any, permission?: string) {
    const token = await getToken({ req: req });
    if (!handleCheckPermission(token, permission)) {
        sendResponseInvalid(req, res, "Unauthorized.")
        return false;
    }

    return true;
}

export async function getUserIdFromToken(req: any) {
    const token: any = await getToken({ req: req });
    return token.user.id
}

export async function getUserFromToken(req: any): Promise<User> {
    const token: any = await getToken({ req: req });
    return token.user
}

export function handleCheckPermission(obj: any, permission?: string) {
    if (obj != undefined && obj.user.role_id != undefined) {
        const role = getRoleById(obj.user.role_id);
        if (role != undefined) {
            if (permission == undefined || role.hasPermission(permission)) {
                return true;
            }
        }
    }

    return false;
}