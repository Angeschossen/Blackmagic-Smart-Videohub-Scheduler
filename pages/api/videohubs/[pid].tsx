import type { NextApiRequest, NextApiResponse } from 'next';
import * as permissions from "../../../backend/authentication/Permissions";
import * as videohubs from '../../../backend/videohubs';
import { sendRoutingUpdate } from '../../../backend/videohubs';
import { checkServerPermission } from '../../../components/auth/ServerAuthentication';
import { RoutingRequest, Videohub, VideohubActivity } from '../../../components/interfaces/Videohub';
import { hasParams, isPost, sendResponseInvalid, sendResponseValid } from '../../../components/utils/requestutils';
import prismadb from '../../../database/prisma';

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

        case "routing": {
            if (!isPost(req, res)) {
                return
            }

            const body = req.body
            const videohub_id = body.videohub_id
            const outputs = body.outputs
            const inputs = body.inputs
            if (!hasParams(req, res, videohub_id, outputs, inputs)) {
                return
            }

            sendResponseValid(req, res, { result: await sendRoutingUpdate(videohub_id, outputs, inputs) })
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