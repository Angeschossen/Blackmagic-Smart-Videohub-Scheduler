import { useSession } from "next-auth/react";
import { getPostHeader } from "../utils/fetchutils";
import { handleCheckPermission } from "./ServerAuthentication";

export function checkClientPermission(permission?: string) {
    const { data: session } = useSession();

    const obj: any = session;
    if (obj.user.permissions == undefined) {
        return false;
    }

    if(permission == undefined){
        return true;
    }

    for(const permission of obj.user.permissions){
        if(permission === permission){
            return true;
        }
    }

    return false;
}