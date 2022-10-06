import type { NextApiRequest, NextApiResponse } from 'next'
import { RoutingRequest, Videohub, VideohubActivity } from '../../../components/interfaces/Videohub';
import * as videohubs from '../../../backend/videohubs'
import { sendRoutingUpdate } from '../../../backend/videohubs';
import prismadb from '../../../database/prismadb';
import { getToken } from 'next-auth/jwt';

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
    return await prismadb.videohubActivity.findMany({
        orderBy: [
            {
                time: 'desc',
            }
        ],
        take: 15,
    }).then((res: VideohubActivity[]) => {
        return res as VideohubActivity[];
    });
}

export async function isLoggedIn(req: any, res: any) {
    const token = await getToken({ req: req });
    if (!token) {
        res.status(401).json({message: 'Unauthorized'});
        return false;
    } else {
        return true;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (!await isLoggedIn(req, res)) {
        return;
    }

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
                e = prismadb.videohub.create({
                    data: {
                        name: videohub.name,
                        ip: videohub.ip,
                        version: videohub.version,
                    }
                });
            } else {
                e = prismadb.videohub.update({
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