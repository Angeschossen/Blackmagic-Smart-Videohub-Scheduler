import { ProcessedEvent } from '@aldabil/react-scheduler/dist/types'
import { Boy } from '@mui/icons-material';
import { formatISO } from 'date-fns';
import id from 'date-fns/esm/locale/id/index.js';
import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../database/prisma';
import { convertDateToUTC } from '../../../utils/DateUtils';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {

    const { pid } = req.query;
    const body = req.body;

    if (req.method !== 'POST') {
        res.status(405).json({ message: 'POST required' });
        return;
    }

    const videohub_id = body.videohub_id;
    console.log(body)
    console.log("AAA: "+videohub_id)
    if (videohub_id === undefined) {
        res.status(405).json({ message: 'Videohub id required.' });
        return;
    }

    let e;
    switch (pid) {
        case "update": {
            const date_start: Date = new Date(body.start);
            const date_end: Date = new Date(body.end);

            const date_check_start = new Date(date_start.getTime() + 1);
            const date_check_end = new Date(date_end.getTime() - 1);

            console.log("Checking: Start: " + date_check_start)
            console.log("Checking: End: " + date_check_end)

            if (!await prisma.event.findFirst({
                where: {
                    AND: [
                        {
                            id: {
                                not: body.id,
                            }
                        },
                        {
                            OR: [
                                {
                                    AND: [
                                        {
                                            start: {
                                                lte: date_check_start,
                                            },
                                            end: {
                                                gte: date_check_end,
                                            }
                                        }
                                    ]
                                },
                                {
                                    start: {
                                        gte: date_check_start,
                                        lte: date_check_end,
                                    }
                                },
                                {
                                    end: {
                                        lte: date_check_end,
                                        gte: date_check_start,
                                    }
                                }

                            ]
                        }
                    ]
                }
            }).then(r => {
                console.log("Conflict: " + r);
                return r == null;
            })) {
                res.status(409).json({ message: 'Event overlaps with another event' });
                return;
            }

            const id: number = body.id;
            if (id === -1) {
                e = prisma.event.create({
                    data: {
                        output_id: body.output,
                        input_id: body.input,
                        start: date_start,
                        end: date_end,
                        videohub_id: videohub_id,
                        title: body.title, 
                    }
                });
            } else {
                e = prisma.event.update({
                    where: {
                        id: id,
                    },
                    data: {
                        output_id: body.output,
                        input_id: body.input,
                        start: date_start,
                        end: date_end,
                        title: body.title,
                    }
                });
            }

            break;
        }

        case "delete": {
            const id: number = body.id;
            e = prisma.event.delete({
                where: {
                    id: id,
                }
            });

            break;
        }

        case "get": {
            const date_start = new Date(body.start as string);
            const date_end = new Date(body.end as string);
            const output: number = Number(body.output);

            console.log("Start: " + date_start);
            console.log("End: " + date_end);

            e = prisma.event.findMany({
                where: {
                    AND: [
                        {
                            videohub_id: videohub_id,
                            output_id: output,
                        },
                        {
                            OR: [
                                {
                                    AND: [
                                        {
                                            start: {
                                                lte: date_start,
                                            },
                                            end: {
                                                gte: date_end,
                                            }
                                        }
                                    ]

                                },
                                {
                                    OR: [
                                        {
                                            start: {
                                                gte: date_start,
                                                lte: date_end,
                                            },
                                            end: {
                                                lte: date_end,
                                                gte: date_start,
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            });

            break;
        }

        default: {
            res.status(405).json({ message: 'Invalid PID' });
            return;
        }
    }

    await e.then(r => {
        res.status(200).json(r);
    });
}