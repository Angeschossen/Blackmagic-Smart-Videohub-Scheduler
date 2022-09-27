import { PrismaPromise } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next'
import { PushButton } from '../../../components/PushButton';
import prisma from '../../../database/prisma';

export function retrievePushButtonsServerSide(videohubId: number) {
    return prisma.client.pushButton.findMany({
        where: {
            videohub_id: videohubId,
        },
        include:{
            actions: true,
        }
    }) as PrismaPromise<PushButton[]>;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'POST required' });
        return;
    }

    const body = req.body;
    const videohub_id = body.videohub_id;
    if (videohub_id === undefined) {
        res.status(405).json({ message: 'Videohub id required.' });
        return;
    }

    const { pid } = req.query;
    switch (pid) {
        case "get": {
            return await retrievePushButtonsServerSide(videohub_id).then(arr => {
                res.status(200).json(arr);
            });
        }

        default: {
            res.status(405).json({ message: 'Invalid PID' });
            return;
        }
    }
}