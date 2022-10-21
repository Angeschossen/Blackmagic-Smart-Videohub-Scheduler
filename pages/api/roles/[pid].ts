import { prisma, RoleOutput } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import Permissions, { toggleablePermissions } from "../../../backend/authentication/Permissions";
import { addRole, getRoleById, getRoles, removeRole } from "../../../backend/backend";
import { checkServerPermission } from "../../../components/auth/ServerAuthentication";
import { Role } from "../../../components/interfaces/User";
import { sendResponseInvalid, sendResponseValid } from "../../../components/utils/requestutils";
import prismadb from '../../../database/prismadb';


export function retrieveRolesServerSide(): Role[] {
    const roles: any[] = getRoles()
    const arr: Role[] = [];
    roles.forEach(role => {
        if (!role.isDefault || true) {
            arr.push({ id: role.id, editable: role.editable, outputs: role.outputs, name: role.name, permissions: Array.from(role.permissions) })
        }
    })

    return arr;
}


export function getRoleByIdBackendUsage(id: number): Role | undefined {
    return getRoleById(id) as Role
}

export function retrievePermissionsServerSide(): string[] {
    return toggleablePermissions;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        sendResponseInvalid(req, res, "POST required.")
        return
    }
    
    if (!await checkServerPermission(req, res)) {
        return;
    }

    const { pid } = req.query;
    const body: any = req.body;

    switch (pid) {
        case "get": {
            sendResponseValid(req, res, retrieveRolesServerSide())
            return
        }

        case "getpermissions": {
            if (!await checkServerPermission(req, res, Permissions.PERMISSION_ROLE_EDIT)) {
                return;
            }

            sendResponseValid(req, res, retrievePermissionsServerSide())
            return
        }

        case "delete": {
            if (!await checkServerPermission(req, res, Permissions.PERMISSION_ROLE_EDIT)) {
                return;
            }

            const role: Role | undefined = getRoleByIdBackendUsage(body.role_id);
            if (role == undefined || !role.editable) {
                sendResponseInvalid(req, res, "Role doesn't exist or isn't editable.")
                return
            }

            await prismadb.role.delete({
                where: {
                    id: role.id,
                }
            })

            removeRole(role.id)
            sendResponseValid(req, res)
            return
        }

        case "upsert": {
            if (!await checkServerPermission(req, res, Permissions.PERMISSION_ROLE_EDIT)) {
                return;
            }

            const role: Role = body.role;
            if (role == undefined) {
                sendResponseInvalid(req, res, "Role doesn't exist.")
                return
            }

            // name len
            if (role.name.length > 32) {
                sendResponseInvalid(req, res, "Role name is too long.");
                return
            }

            let p: any;
            if (role.id == -1) {
                p = await prismadb.role.create({
                    data: {
                        name: role.name,
                    }
                });
            } else {
                p = await prismadb.role.update({
                    where: {
                        id: role.id,
                    },
                    data: {
                        name: role.name,
                    }
                })
            }

            addRole(p) // insert or update
            sendResponseValid(req, res)
            return
        }

        case "setpermissions": {
            if (!await checkServerPermission(req, res, Permissions.PERMISSION_ROLE_EDIT)) {
                return;
            }

            const role_id = body.role_id
            let permissions: string[] = body.permissions
            if (role_id == undefined || permissions == undefined) {
                sendResponseInvalid(req, res, "Parameters missing.")
                return
            }

            const role = getRoleByIdBackendUsage(role_id)
            if (role == undefined) {
                sendResponseInvalid(req, res, "Role doesn't exist.")
                return
            }

            // delete
            await prismadb.rolePermission.deleteMany({
                where: {
                    role_id: role_id,
                }
            });

            for (const perm of permissions) {
                if (toggleablePermissions.indexOf(perm) == -1) {
                    sendResponseInvalid(req, res, "Permission isn't toggleable.")
                    return
                }
            }

            // make sure only toggleable are set
            permissions = permissions.filter(perm => toggleablePermissions.indexOf(perm) != -1);

            // create
            await prismadb.rolePermission.createMany({
                data: permissions.map(perm => {
                    return { permission: perm, role_id: role_id }
                }),
            })

            role.permissions = permissions
            sendResponseValid(req, res)
            return
        }

        case "setoutputs": {
            if (!await checkServerPermission(req, res, Permissions.PERMISSION_ROLE_EDIT)) {
                return;
            }

            const videohub_id = body.videohub_id
            const role_id = body.role_id
            const outputs: number[] = body.outputs

            if (videohub_id == undefined || role_id == undefined || outputs == undefined) {
                sendResponseInvalid(req, res, "Parameters missing.")
                return
            }

            const role = getRoleByIdBackendUsage(role_id)
            if (role == undefined) {
                sendResponseInvalid(req, res, "Role doesn't exist.")
                return
            }

            // delete
            await prismadb.roleOutput.deleteMany({
                where: {
                    videohub_id: videohub_id,
                    role_id: role_id,
                }
            });

            // create
            const data: RoleOutput[] = outputs.map(output => {
                return { videohub_id: videohub_id, role_id: role_id, output_id: output }
            });

            await prismadb.roleOutput.createMany({
                data: data,
            })

            role.outputs = data
            sendResponseValid(req, res)
            return
        }

        case "haspermission": {
            const permission: string | undefined = req.body.permission;
            const role_id: number | undefined = req.body.role_id;

            if (role_id == undefined) {
                sendResponseInvalid(req, res, "Parameters missing.")
                return
            }

            const role: any = getRoleById(role_id)
            sendResponseValid(req, res, { result: role != undefined && (permission == undefined || role.hasPermission(permission)) })
            return;
        }

        default: {
            sendResponseInvalid(req, res, "Invalid PID.")
            return;
        }
    }
}