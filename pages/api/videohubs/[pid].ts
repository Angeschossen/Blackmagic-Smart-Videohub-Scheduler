import type { NextApiRequest, NextApiResponse } from 'next';
import * as permissions from "../../../backend/authentication/Permissions";
import * as videohubs from '../../../backend/videohubs';
import { sendRoutingUpdate, updateDefaultInput } from '../../../backend/videohubs';
import { checkServerPermission, getUserFromToken, getUserIdFromToken } from '../../../components/auth/ServerAuthentication';
import { hasRoleOutput, User } from '../../../components/interfaces/User';
import { RoutingRequest, Videohub, VideohubActivity } from '../../../components/interfaces/Videohub';
import { hasParams, isPost, sendResponseInvalid, sendResponseValid } from '../../../components/utils/requestutils';
import prismadb from '../../../database/prisma';
import prisma from '../../../database/prismadb';

export function retrieveVideohubsServerSide() {
    return videohubs.getVideohubs() as Videohub[]
}

export function retrieveVideohubServerSide(id: number) {
    return videohubs.getVideohub(id) as unknown as Videohub
}

export function getVideohubFromQuery(query: any): Videohub {
    const id: number = Number(query.videohub)
    const hub: Videohub | undefined = retrieveVideohubServerSide(id)
    return hub
}

export async function getVideohubActivityServerSide() {
    return await prismadb.videohubActivity.findMany({
        orderBy: [
            {
                time: 'desc',
            }
        ],
        take: 15,
    }).then((res: VideohubActivity[]) => {
        return res as VideohubActivity[]
    })
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (!await checkServerPermission(req, res)) {
        return
    }

    const { pid } = req.query
    switch (pid) {
        case "get": {
            sendResponseValid(req, res, retrieveVideohubsServerSide())
            return
        }

        case "getactivity": {
            sendResponseValid(req, res, getVideohubActivityServerSide())
            return
        }

        case "setDefaultInput":
        case "updateRouting": {
            if (!isPost(req, res)) {
                return
            }

            const user: User | undefined = await getUserFromToken(req)
            if (user == undefined) {
                sendResponseInvalid(req, res, "User not provided")
                return
            }

            const body = req.body
            const videohubId: number = body.videohubId
            const outputs: number[] = body.outputs
            const inputs: number[] = body.inputs
            if (!hasParams(req, res, videohubId, outputs, inputs)) {
                return
            }

            // check outputs 
            for (const outputId of outputs) {
                if (!hasRoleOutput(user.role, videohubId, outputId)) {
                    sendResponseInvalid(req, res, "Contains outputs that the user's role doesn't have.")
                    return
                }
            }

            if (pid === "setDefaultInput") {
                for (let i = 0; i < outputs.length; i++) {
                    const input = inputs[i] < 0 ? undefined : inputs[i]
                    const output = outputs[i]
                    await prisma.output.update({
                        where: {
                            videohub_output: {
                                id: output,
                                videohub_id: videohubId,
                            }
                        },
                        data: {
                            input_default_id: input,
                        }
                    })

                    updateDefaultInput(videohubId, output, input)
                }

                sendResponseValid(req, res)

            } else {
                sendResponseValid(req, res, { error: await sendRoutingUpdate(videohubId, outputs, inputs) })
            }

            return
        }

        case "update": {
            if (!await checkServerPermission(req, res, permissions.PERMISSION_VIDEOHUB_EDIT)) {
                return
            }

            if (!isPost(req, res)) {
                return
            }

            const videohub: Videohub = req.body as Videohub;
            videohub.name = videohub.name.trim()

            if (videohub.id == -1) {
                await prismadb.videohub.create({
                    data: {
                        name: videohub.name,
                        ip: videohub.ip,
                        version: videohub.version,
                    }
                })

                // also add outputs to admin
                await prismadb.roleOutput.createMany({
                    data: videohub.outputs.map,
                })

            } else {
                await prismadb.videohub.update({
                    where: {
                        id: videohub.id,
                    },
                    data: videohub,
                })
            }

            sendResponseValid(req, res)
            return
        }

        default: {
            sendResponseInvalid(req, res, "Invalid PID.")
            return
        }
    }
}