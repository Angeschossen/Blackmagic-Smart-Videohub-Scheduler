import { ProcessedEvent } from '@aldabil/react-scheduler/dist/types'
import { formatISO } from 'date-fns';
import id from 'date-fns/esm/locale/id/index.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../database/prisma';
import { Videohub } from '../../../components/Videohub';
import * as videohubs from '../../../videohub/videohubs'

export async function retrieveVideohubsServerSide(includeInputs: boolean, includeOutputs: boolean) {
    return videohubs.getVideohubs() as Videohub[];
}

export async function retrieveVideohubServerSide(id: number, includeInputs: boolean, includeOutputs: boolean) {
    return videohubs.getVideohub(id) as unknown as Videohub;
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