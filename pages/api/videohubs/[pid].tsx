import { ProcessedEvent } from '@aldabil/react-scheduler/dist/types'
import { formatISO } from 'date-fns';
import id from 'date-fns/esm/locale/id/index.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../database/prisma';
import { Videohub } from '../../../components/Videohub';

let videohubs: Videohub[] = [];


export async function retrieveVideohubsServerSide(includeInputs: boolean, includeOutputs: boolean) {
    return await prisma.videohub.findMany({
        include: {
            inputs: includeInputs,
            outputs: includeOutputs
        }
    }).then(r => {
        return r as Videohub[];
    });
}

export async function retrieveVideohubServerSide(id: number, includeInputs: boolean, includeOutputs: boolean) {
    return await prisma.videohub.findMany({
        where: {
            id: id,
        },
        include: {
            inputs: includeInputs,
            outputs: includeOutputs
        }
    }).then(r => {
        return r as Videohub[];
    });
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {

    const { pid } = req.query;
    switch (pid) {
        case "get": {
            return await retrieveVideohubsServerSide(true, true).then(arr => {
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