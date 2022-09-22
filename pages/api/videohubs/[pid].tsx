import { ProcessedEvent } from '@aldabil/react-scheduler/dist/types'
import { formatISO } from 'date-fns';
import id from 'date-fns/esm/locale/id/index.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../database/prisma';
import { IVideohub, Videohub } from '../../../components/Videohub';

let videohubs: Videohub[] = [];


export async function retrieveVideohubsServerSide() {
    return await prisma.videohub.findMany().then(r => {
        const arr: Videohub[] = [];
        for (const hub of r) {
            let h: IVideohub | undefined = getVideohub(hub.id) as IVideohub;
            if (h == undefined) {
                const n: IVideohub = new IVideohub(hub.id, hub.ip, hub.name);
                h = n;

                videohubs.push(n);
            }

            h.connect();
            arr.push(h);
        }

        return arr;
    });
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {

    const { pid } = req.query;
    switch (pid) {
        case "get": {
            return await retrieveVideohubsServerSide().then(arr=>{
                res.status(200).json(arr);
            })
        }

        default: {
            res.status(405).json({ message: 'Invalid PID' });
            return;
        }
    }
}

function getVideohub(id: number) {
    for (const hub of videohubs) {
        if (hub.id === id) {
            return hub;
        }
    }
}