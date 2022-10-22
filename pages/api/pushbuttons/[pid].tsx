import { ColumnActionsMode } from '@fluentui/react';
import { PrismaPromise, PushButtonAction } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next'
import { PushButton, PushbuttonAction } from '../../../components/interfaces/PushButton';
import prismadb from '../../../database/prismadb';
import * as permissions from "../../../backend/authentication/Permissions";
import { checkServerPermission } from '../../../components/auth/ServerAuthentication';
import { sendResponseInvalid, sendResponseValid } from '../../../components/utils/requestutils';

export async function retrievePushButtonsServerSide(videohubId: number) {
    return await prismadb.pushButton.findMany({
        where: {
            videohub_id: videohubId,
        },
        include: {
            actions: true,
        }
    }) as PushButton[];
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        sendResponseInvalid(req, res, "POST required.")
        return
    }

    if (!await checkServerPermission(req, res)) {
        return;
    }

    const body = req.body;
    const videohub_id = body.videohub_id;
    if (videohub_id === undefined) {
        sendResponseInvalid(req, res, "Parameters missing.")
        return
    }

    const { pid } = req.query
    let e
    switch (pid) {
        case "get": {
            sendResponseValid(req, res, await retrievePushButtonsServerSide(videohub_id))
            return
        }

        case "update": {
            if (!await checkServerPermission(req, res, permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT)) {
                return
            }

            let pushButton: PushButton = body;
            if (pushButton.id == -1) { // creare
                const result: any = await prismadb.pushButton.create({
                    data: {
                        videohub_id: videohub_id,
                        label: pushButton.label,
                        color: pushButton.color,
                        description: pushButton.description,
                    }
                })

                // adjust ids
                const arr: PushbuttonAction[] = [];
                for (const action of pushButton.actions) {
                    const create = {
                        pushbutton_id: result.id,
                        videohub_id: videohub_id,
                        input_id: action.input_id,
                        output_id: action.output_id,
                    } as PushButtonAction

                    const res: PushbuttonAction = await prismadb.pushButtonAction.create({
                        data: create
                    })

                    arr.push(res)
                }

                result.actions = arr;
                sendResponseValid(req, res, result)

            } else {
                const result: any = await prismadb.pushButton.update({
                    where: {
                        id: pushButton.id,
                    },
                    data: {
                        label: pushButton.label,
                        color: pushButton.color,
                        description: pushButton.description,
                    }
                })

                result.actions = []
                for (const action of pushButton.actions) {
                    const res: PushbuttonAction = await prismadb.pushButtonAction.upsert({
                        where: {
                            id: action.id,
                        },
                        update: {
                            input_id: action.input_id,
                            output_id: action.output_id,
                        },
                        create: {
                            pushbutton_id: pushButton.id,
                            videohub_id: videohub_id,
                            input_id: action.input_id,
                            output_id: action.output_id,
                        }
                    })

                    result.actions.push(res)
                }

                sendResponseValid(req, res, result)
            }

            return;
        }

        case "delete": {
            if (!await checkServerPermission(req, res, permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT)) {
                return;
            }

            const id: number | undefined = body.id;
            if (id == undefined) {
                sendResponseInvalid(req, res, "Missing parameters.")
                return
            }

            await prismadb.pushButton.delete({
                where: {
                    id: id,
                }
            })


            sendResponseValid(req, res)
            return
        }

        default: {
            sendResponseInvalid(req, res, "Invalid PID.")
            return;
        }
    }
}