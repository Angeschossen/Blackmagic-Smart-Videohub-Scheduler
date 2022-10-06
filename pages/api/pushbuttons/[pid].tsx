import { ColumnActionsMode } from '@fluentui/react';
import { PrismaPromise, PushButtonAction } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next'
import { PushButton, PushbuttonAction } from '../../../components/interfaces/PushButton';
import prismadb from '../../../database/prismadb';
import { isLoggedIn } from '../videohubs/[pid]';

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
    if (!await isLoggedIn(req, res)) {
        return;
    }

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
    let e;
    switch (pid) {
        case "get": {
            const buttons: PushButton[] = await retrievePushButtonsServerSide(videohub_id);
            res.status(200).json(buttons);
            return;
        }

        case "update": {
            let pushButton: PushButton = body;
            if (pushButton.id == -1) { // creare
                await prismadb.pushButton.create({
                    data: {
                        videohub_id: videohub_id,
                        label: pushButton.label,
                        color: pushButton.color,
                    }
                }).then(async (r: PushButton) => {
                    const result: PushButton = r as PushButton;

                    // adjust ids
                    const arr: PushbuttonAction[] = [];
                    for (const action of pushButton.actions) {
                        const create = {
                            pushbutton_id: result.id,
                            videohub_id: videohub_id,
                            input_id: action.input_id,
                            output_id: action.output_id,
                        } as PushButtonAction

                        await prismadb.pushButtonAction.create({
                            data: create
                        }).then((res: PushbuttonAction) => {
                            arr.push(res as PushbuttonAction);
                        });
                    }

                    result.actions = arr;
                    res.status(200).json(result);
                });

            } else {
                await prismadb.pushButton.update({
                    where: {
                        id: pushButton.id,
                    },
                    data: {
                        label: pushButton.label,
                        color: pushButton.color,
                    }
                }).then(async (r: PushButton) => {
                    const result: PushButton = r as PushButton;
                    result.actions = [];

                    for (const action of pushButton.actions) {
                        await prismadb.pushButtonAction.upsert({
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
                        }).then((res: PushbuttonAction) => {
                            result.actions.push(res as PushbuttonAction);
                        })
                    }

                    res.status(200).json(result);
                });
            }

            return;
        }

        case "delete": {
            const id: number | undefined = body.id;
            if (id == undefined) {
                res.status(405).json({ message: 'Button id required.' });
                return;
            }

            await prismadb.pushButtonAction.deleteMany({
                where: {
                    pushbutton_id: id,
                    videohub_id: videohub_id,
                }
            }).then(async () => {
                await prismadb.pushButton.delete({
                    where: {
                        id: id,
                    }
                });
            });

            res.status(200).json({ result: true });
            return;
        }

        default: {
            res.status(405).json({ message: 'Invalid PID' });
            return;
        }
    }

    await e.then((r: any) => {
        res.status(200).json(r);
    });
}