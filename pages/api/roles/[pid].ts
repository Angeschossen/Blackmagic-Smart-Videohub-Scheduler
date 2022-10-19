import { prisma, RoleOutput } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import Permissions, { editable } from "../../../backend/authentication/Permissions";
import { getRoleById, getRoles } from "../../../backend/backend";
import { checkServerPermission } from "../../../components/auth/ServerAuthentication";
import { Role } from "../../../components/interfaces/User";
import prismadb from '../../../database/prismadb';


export function retrieveRolesServerSide(): Role[] {
    const roles: any[] = getRoles()
    const arr: Role[] = [];
    roles.forEach(role => {
        arr.push({ id: role.id, outputs: role.outputs, name: role.name })
    })

    return arr;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (!await checkServerPermission(req, res)) {
        return;
    }

    const { pid } = req.query;
    const body: any = req.body;

    switch (pid) {
        case "get": {
            res.status(200).json(retrieveRolesServerSide())
            return
        }

        case "setpermissions": {
            if (!await checkServerPermission(req, res, Permissions.PERMISSION_ROLE_EDIT)) {
                return;
            }

            const role_id = body.role_id
            let permissions: string[] = body.permissions
            if (role_id == undefined || permissions == undefined) {
                res.status(405).json({ message: 'Invalid request.' });
                return
            }

            const role = getRoleById(role_id)
            if (role == undefined) {
                res.status(405).json({ message: 'Invalid request.' });
                return
            }

            // delete
            await prismadb.rolePermission.deleteMany({
                where: {
                    role_id: role_id,
                }
            });

            permissions = permissions.filter(perm => editable.indexOf(perm) != -1);

            // create
            await prismadb.rolePermission.createMany({
                data: permissions.map(perm => {
                    return { permission: perm, role_id: role_id }
                }),
            }).then((_res: any) => {
                console.log(_res)
                role.permissions = permissions
            });

            res.status(200).json({ message: 'Updated' })
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
                res.status(405).json({ message: 'Invalid request.' });
                return
            }

            const role = getRoleById(role_id)
            if (role == undefined) {
                res.status(405).json({ message: 'Invalid request.' });
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
            const data = outputs.map(output => {
                return { videohub_id: videohub_id, role_id: role_id, output_id: output } as RoleOutput
            });

            await prismadb.roleOutput.createMany({
                data: data,
            }).then((res: any) => {
                role.outputs = data
            });

            res.status(200).json({ message: 'Updated' })
            return
        }

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