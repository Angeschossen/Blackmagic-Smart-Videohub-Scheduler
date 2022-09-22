import { ProcessedEvent } from '@aldabil/react-scheduler/dist/types'
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../database/prisma'
import { OutputEvent } from '../../videohub/output';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    const query = req.query;
    const { start, end } = query;

    const date_start = new Date(start as string);
    const date_end = new Date(end as string);

    const events = prisma.event.findMany({
        where: {
            OR: [
                {
                    start: {
                        gte: date_start,
                        lt: date_end,
                    }
                },
                {
                    end: {
                        gte: date_start,
                        lt: date_end,
                    }
                }
            ]
        }
    });

    await events.then(r => {
        res.status(200).send(r);
    });
}