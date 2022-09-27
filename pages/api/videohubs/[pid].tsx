import type { NextApiRequest, NextApiResponse } from 'next'
import { Videohub } from '../../../components/Videohub';
import * as videohubs from '../../../videohub/videohubs'

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
    switch (pid) {
        case "get": {
            res.status(200).json(retrieveVideohubsServerSide());
            return;
        }

        default: {
            res.status(405).json({ message: 'Invalid PID' });
            return;
        }
    }
}