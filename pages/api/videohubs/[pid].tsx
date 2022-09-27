import type { NextApiRequest, NextApiResponse } from 'next'
import { RoutingRequest, Videohub } from '../../../components/Videohub';
import * as videohubs from '../../../videohub/videohubs'
import { REQUEST_TIMEOUT, sendRoutingUpdate } from '../../../videohub/videohubs';

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
    console.log(pid)
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
            const sent = sendRoutingUpdate(request, ()=>{}, ()=>{});
            await new Promise(resolve => {
                setTimeout(() => {
                    res.status(200).json({ result: sent.result });
                }, REQUEST_TIMEOUT);
            });

            return;
        }

        default: {
            res.status(405).json({ message: 'Invalid PID' });
            return;
        }
    }
}