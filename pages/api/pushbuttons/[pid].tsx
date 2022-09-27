import { PrismaPromise } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next'
import { PushButton, PushbuttonAction } from '../../../components/interfaces/PushButton';
import prisma from '../../../database/prisma';

export function retrievePushButtonsServerSide(videohubId: number) {
    return prisma.client.pushButton.findMany({
        where: {
            videohub_id: videohubId,
        },
        include: {
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
    let e;
    switch (pid) {
        case "get": {
            return await retrievePushButtonsServerSide(videohub_id).then(arr => {
                res.status(200).json(arr);
            });
        }

        case "update": {
            let pushButton: PushButton = body;
            console.log(pushButton)
            if (pushButton.id == -1) {
                await prisma.client.pushButton.create({
                    data: {
                        videohub_id: videohub_id,
                        label: pushButton.label,
                    }
                }).then(async r => {
                    const result: PushButton = r as PushButton;

                    // set ids
                    const arr: PushbuttonAction[] =[];
                    for (const action of pushButton.actions) {
            
                        const d = {
                            input_id: action.input_id,
                            output_id: action.output_id,
                            pushbutton_id: result.id,
                            videohub_id: videohub_id,
                        };

                        console.log(d)
                        await prisma.client.pushButtonAction.create({
                            data: d
                        }).then(res => {
                            arr.push(res as PushbuttonAction);
                        });
                    }

                    result.actions = arr;
                    res.status(200).json(result);
                });

                return;

            } else {
                e = prisma.client.pushButton.update({
                    where: {
                        id: pushButton.id,
                    },
                    data: {
                        label: pushButton.label,
                    },
                    include: {
                        actions: true,
                    }
                });
            }

            break;
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