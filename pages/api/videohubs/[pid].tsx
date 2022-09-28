import type { NextApiRequest, NextApiResponse } from 'next'
import { RoutingRequest, Videohub } from '../../../components/Videohub';
import * as videohubs from '../../../components/interfaces/videohub/videohubs'
import { sendRoutingUpdate } from '../../../components/interfaces/videohub/videohubs';
import prisma from '../../../database/prisma';

export function retrieveVideohubsServerSide() {
    return videohubs.getVideohubs() as Videohub[];
}

export function retrieveVideohubServerSide(id: number) {
    return videohubs.getVideohub(id) as unknown as Videohub;
}

export function getVideohubFromQuery(query: any): Videohub {
    const id: number = Number(query.videohub);
    const hub: Videohub | undefined = retrieveVideohubServerSide(id);
    if (hub == undefined) {
        throw Error("Hub does not exist.");
    }

    return hub;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const { pid } = req.query;
    let e;
    switch (pid) {
        case "get": {
            res.status(200).json(retrieveVideohubsServerSide());
            return;
        }

        case "routing": {
            if (req.method !== 'POST') {
                res.status(405).json({ message: 'POST required' });
                return;
            }

            const request = req.body as RoutingRequest;
            await sendRoutingUpdate(request).then((result: string | undefined) => {
                res.status(200).json({ result: result });
            });

            return;
        }

        case "update": {
            if (req.method !== 'POST') {
                res.status(405).json({ message: 'POST required' });
                return;
            }

            const videohub: Videohub = req.body as Videohub;
            if (videohub.id == -1) {
                e = prisma.client.videohub.create({
                    data: {
                        name: videohub.name,
                        ip: videohub.ip,
                        version: videohub.version,
                    }
                });
            } else {
                e = prisma.client.videohub.update({
                    where: {
                        id: videohub.id,
                    },
                    data: videohub,
                });
            }

            break;
        }

        default: {
            res.status(405).json({ message: 'Invalid PID' });
            return;
        }
    }

    await e.then(result => {
        res.status(405).json(result);
    });
}