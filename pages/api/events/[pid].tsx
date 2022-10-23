import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../database/prisma';
import { OutputEvent } from '../../videohub/events';
import { retrieveEvents } from '../../../backend/videohubs'
import { checkServerPermission } from '../../../components/auth/ServerAuthentication';
import * as permissions from "../../../backend/authentication/Permissions";
import { sendResponseInvalid, sendResponseInvalidTransparent, sendResponseValid } from '../../../components/utils/requestutils';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        sendResponseInvalid(req, res, "POST required.")
        return
    }

    if (!await checkServerPermission(req, res)) {
        return
    }

    const { pid } = req.query
    const body = req.body

    const videohub_id = body.videohub_id;
    if (videohub_id === undefined) {
        sendResponseInvalid(req, res, "Parameters missing.")
        return
    }

    switch (pid) {
        case "update": {
            if (!await checkServerPermission(req, res, permissions.PERMISSION_VIDEOHUB_OUTPUT_SCHEDULE)) {
                return
            }

            const date_start: Date = new Date(body.start);
            const date_end: Date = new Date(body.end);

            const date_check_start = new Date(date_start.getTime() + 1);
            const date_check_end = new Date(date_end.getTime() - 1);

            //console.log("Checking: Start: " + date_check_start)
            //console.log("Checking: End: " + date_check_end)

            const event: OutputEvent = body;
            if (!await prisma.event.findMany({
                where: {
                    AND: [
                        {
                            id: {
                                not: event.id,
                            }
                        },
                        {
                            videohub_id: event.videohub_id,
                            output_id: event.output_id
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
            }).then((r: any) => {
                return true // we allow max one another event
            })) {
                sendResponseInvalid(req, res, "Event overlaps with another event.")
                return;
            }

            const id: number = body.id
            let eventRes
            const repeat: boolean = event.repeat_every_week === true;
            if (id === -1) {
            eventRes=   await prisma.event.create({
                    data: {
                        output_id: event.output_id,
                        input_id: event.input_id,
                        start: date_start,
                        end: date_end,
                        videohub_id: videohub_id,

                        repeat_every_week: repeat,
                        day_of_week: date_start.getDay(),
                    }
                });
            } else {
               eventRes= await prisma.event.update({
                    where: {
                        id: id,
                    },
                    data: {
                        output_id: event.output_id,
                        input_id: event.input_id,
                        start: date_start,
                        end: date_end,
                        repeat_every_week: repeat,
                    }
                });
            }

            sendResponseValid(req, res, eventRes)
            return
        }

        case "delete": {
            if (!await checkServerPermission(req, res, permissions.PERMISSION_VIDEOHUB_OUTPUT_SCHEDULE)) {
                return
            }

            const id: number = body.id;
            await prisma.event.delete({
                where: {
                    id: id,
                }
            });

            sendResponseValid(req, res)
            return
        }

        case "get": {
            const date_start = new Date(body.start as string)
            const date_end = new Date(body.end as string)
            const output: number = Number(body.output)
            if (date_start == undefined || date_end == undefined || output == undefined) {
                sendResponseInvalid(req, res, "Missing parameters.")
                return
            }

            //console.log("Start: " + date_start);
            //console.log("End: " + date_end);

            sendResponseValid(req, res, await retrieveEvents(videohub_id, output, date_start, date_end, false))
            return
        }

        default: {
            sendResponseInvalid(req, res, "Invalid PID.")
            return
        }
    }
}