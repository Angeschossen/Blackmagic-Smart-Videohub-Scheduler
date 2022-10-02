import type { NextApiRequest, NextApiResponse } from 'next'
import { RoutingRequest, Videohub, VideohubActivity } from '../../../components/interfaces/Videohub';
import * as videohubs from '../../../backend/videohubs'
import { sendRoutingUpdate } from '../../../backend/videohubs';
import prisma from '../../../database/prisma';
import { time } from 'console';

export function retrieveVideohubsServerSide() {
    return videohubs.getVideohubs() as Videohub[];
}

export function retrieveVideohubServerSide(id: number) {
    return videohubs.getVideohub(id) as unknown as Videohub;
}

export function getVideohubFromQuery(query: any): Videohub {
    const id: number = Number(query.videohub);
    const hub: Videohub | undefined = retrieveVideohubServerSide(id);
    return hub;
}

export async function getVideohubActivityServerSide() {
    return await prisma.client.videohubActivity.findMany({
        orderBy: [
            {
                time: 'desc',
            }
        ],
        take: 25,
    }).then(res => {
        return res as VideohubActivity[];
    });
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

        case "getactivity": {
            res.status(200).json(getVideohubActivityServerSide());
            return;
        }

        case "routing": {
            if (req.method !== 'POST') {
                res.status(405).json({ message: 'POST required' });
                return;
            }

            const request = req.body as RoutingRequest;
            await sendRoutingUpdate(request).then((result: string | undefined) => {
                console.log("Routing res: " + result);
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

    await e.then((r: any) => {
        res.status(200).json(r);
    });
}