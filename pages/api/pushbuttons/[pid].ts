import { PushButton, PushButtonAction, PushButtonTrigger } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import * as permissions from "../../../backend/authentication/Permissions";
import pushbuttons from '../../../backend/pushbuttons';
import { cancelScheduledButton, executeButton, getClient, getScheduledButtons, handleButtonDeletion, handleButtonReSchedule, retrieveUpcomingTriggers } from '../../../backend/videohubs';
import { checkServerPermission, getUserIdFromToken, isUser } from '../../../components/auth/ServerAuthentication';
import { IPushButton, IPushButtonTrigger, IUpcomingPushButton, IPushbuttonAction } from '../../../components/interfaces/PushButton';
import { convert_date_to_utc, removeSecondsFromDate, setDayOfWeek, setDayOfWeekUTC } from '../../../components/utils/dateutils';
import { hasParams, sendResponseInvalid, sendResponseValid } from '../../../components/utils/requestutils';
import prismadb from '../../../database/prismadb';

export async function retrievePushButtonsServerSide(req: NextApiRequest, videohubId: number) {
    const res = await prismadb.pushButton.findMany({
        where: {
            videohub_id: videohubId,
            user_id: await getUserIdFromToken(req),
        },
        include: {
            actions: true,
            triggers: true,
        }
    })

    for (const button of res) {
        button.triggers.forEach(trigger => {
            const date: Date = getTriggerExportTime(trigger.time, trigger.day)
            trigger.time = date
            trigger.day = date.getUTCDay()
        })
    }

    return res
}

function getTriggerExportTime(time: Date, day: number): Date {
    const date: Date = convert_date_to_utc(new Date())
    date.setUTCHours(time.getUTCHours())
    date.setUTCMinutes(time.getUTCMinutes())
    date.setUTCSeconds(0)
    setDayOfWeekUTC(date, day)
    return date
}

export async function getUserFromButton(id: number): Promise<string | undefined> {
    return await prismadb.pushButton.findUnique({
        where: {
            id: id,
        },
        select: {
            user_id: true
        }
    }).then(res => res?.user_id)
}

export function retrieveScheduledButtons(videohub_id: number, userId?: string): IUpcomingPushButton[] {
    return userId == undefined ? [] : getScheduledButtons(videohub_id).filter((button: IUpcomingPushButton) => button.userId === userId)
}


async function canEditButton(buttonId: number, req: any, res: any) {
    const owner: string | undefined = await getUserFromButton(buttonId)
    return isUser(req, res, owner)
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
        return
    }

    const body = req.body;
    const videohub_id = body.videohub_id
    if (videohub_id === undefined) {
        sendResponseInvalid(req, res, "Parameters missing.")
        return
    }

    const { pid } = req.query
    switch (pid) {
        case "get": {
            sendResponseValid(req, res, await retrievePushButtonsServerSide(req, videohub_id))
            return
        }

        case "getUpcoming": {
            const date = body.date
            if (date == undefined) {
                sendResponseInvalid(req, res, "Parameters missing.")
                return
            }

            sendResponseValid(req, res, await retrieveUpcomingTriggers(date, videohub_id))
            return
        }

        case "update": {
            if (!await checkServerPermission(req, res, permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT)) {
                return
            }

            let pushButton: IPushButton = body;
            const sorting: number = Number(pushButton.sorting)
            if (pushButton.id == -1) { // create
                const result: any = await prismadb.pushButton.create({
                    data: {
                        videohub_id: videohub_id,
                        label: pushButton.label,
                        color: pushButton.color,
                        description: pushButton.description,
                        display: pushButton.display,
                        sorting: sorting,
                        user_id: await getUserIdFromToken(req),
                    }
                })

                // adjust ids
                const arr: IPushbuttonAction[] = [];
                for (const action of pushButton.actions) {
                    const create = {
                        pushbutton_id: result.id,
                        videohub_id: videohub_id,
                        input_id: action.input_id,
                        output_id: action.output_id,
                    } as PushButtonAction

                    const res: IPushbuttonAction = await prismadb.pushButtonAction.create({
                        data: create
                    })

                    arr.push(res)
                }

                result.actions = arr;
                sendResponseValid(req, res, result)

            } else {
                if (!await canEditButton(pushButton.id, req, res)) {
                    return
                }

                const r: PushButton = await prismadb.pushButton.update({
                    where: {
                        id: pushButton.id,
                    },
                    data: {
                        label: pushButton.label,
                        color: pushButton.color,
                        display: pushButton.display,
                        sorting: sorting,
                        description: pushButton.description,
                    }
                })

                const result: IPushButton = {
                    ...r,
                    actions: [],
                    triggers: [],
                    color: r.color || undefined,
                }

                // check actions
                const existingActions: PushButtonAction[] = await prismadb.pushButtonAction.findMany({
                    where: {
                        pushbutton_id: pushButton.id,
                    }
                })

                const del: number[] = []
                existingActions.forEach(action => {
                    if (pushButton.actions.find(a => a.id === action.id) == undefined) {
                        del.push(action.id)
                    }
                })

                // delete no longer existing ones
                await prismadb.pushButtonAction.deleteMany({
                    where: {
                        id: {
                            in: del
                        }
                    }
                })

                // update
                for (const a of existingActions.filter(a => {
                    return del.indexOf(a.id) === -1 && pushButton.actions.find(aa => aa.id === a.id)
                })) {
                    const r: IPushbuttonAction = await prismadb.pushButtonAction.update({
                        where: {
                            id: a.id,
                        },
                        data: {
                            input_id: a.input_id,
                            output_id: a.output_id,
                        }
                    })

                    result.actions.push(r)
                }

                // create
                pushButton.actions
                    .filter(a => a.id == -1 && result.actions.find(aa => aa.id === a.id) == undefined) // double check is creation (-1) and make sure it's not update
                    .forEach(async action => {
                        const create = {
                            pushbutton_id: result.id,
                            videohub_id: videohub_id,
                            input_id: action.input_id,
                            output_id: action.output_id,
                        } as PushButtonAction

                        const rr: IPushbuttonAction = await prismadb.pushButtonAction.create({
                            data: create
                        })

                        result.actions.push(rr)
                    })

                sendResponseValid(req, res, result)
            }

            return
        }

        case "setTriggers": {
            if (!await checkServerPermission(req, res, permissions.PERMISSION_VIDEOHUB_PUSHBUTTONS_EDIT)) {
                return
            }

            const buttonId = body.pushbutton_id
            const triggers: IPushButtonTrigger[] = body.triggers
            const actions: IPushbuttonAction[] = body.actions
            if (!hasParams(req, res, buttonId, triggers, actions)) {
                return
            }

            if (!await canEditButton(buttonId, req, res)) {
                return
            }

            // triggers
            await prismadb.pushButtonTrigger.deleteMany({
                where: {
                    pushbutton_id: buttonId,
                }
            })

            for (const trigger of triggers) {
                let r: PushButtonTrigger[] = []
                // make sure day only once
                const days: Set<number> = new Set(trigger.days)

                for (const action of actions) {
                    days.forEach(day => {
                        const date: Date = new Date(trigger.time)
                        setDayOfWeek(date, day)
                        removeSecondsFromDate(date)

                        const obj: PushButtonTrigger = {
                            id: "",
                            pushbutton_id: buttonId,
                            time: date,
                            day: date.getUTCDay(),
                            videohub_id: action.videohub_id,
                            output_id: action.output_id,
                            action_id: action.id,
                        };

                        (obj as any).id = undefined
                        r.push(obj)
                    })
                }

                // save one to get id
                const len: number = r.length
                if (len != 0) {
                    // save first to get id
                    const id = await prismadb.pushButtonTrigger.create({
                        data: r[0]
                    }).then(res => res.id)

                    r.splice(0, 1)
                    await prismadb.pushButtonTrigger.createMany({
                        data: r.map(trigger => {
                            trigger.id = id
                            return trigger
                        })
                    })
                }
            }

            await handleButtonReSchedule(videohub_id, buttonId)
            sendResponseValid(req, res)
            return
        }

        case "cancel": {
            const buttonId: number = body.buttonId
            const cancel: boolean = body.cancel
            if (!hasParams(req, res, buttonId, cancel)) {
                return
            }

            if (!await canEditButton(buttonId, req, res)) {
                return
            }

            cancelScheduledButton(videohub_id, buttonId, cancel)
            sendResponseValid(req, res, { result: true })
            break
        }

        case "execute": {
            const buttonId: number = body.id;
            const videohub_id: number | undefined = body.videohub_id
            if (!hasParams(req, res, buttonId, videohub_id)) {
                return
            }

            if (!await canEditButton(buttonId, req, res)) {
                return
            }

            sendResponseValid(req, res, { result: await executeButton(videohub_id, buttonId) })
            return
        }

        case "getScheduled": {
            const videohub_id: number = body.videohub_id
            if (!hasParams(req, res, videohub_id)) {
                return
            }

            sendResponseValid(req, res, retrieveScheduledButtons(videohub_id, await getUserIdFromToken(req)))
            return
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

            if (!await canEditButton(id, req, res)) {
                return
            }

            await prismadb.pushButton.delete({
                where: {
                    id: id,
                }
            })

            handleButtonDeletion(id)
            sendResponseValid(req, res)
            return
        }

        default: {
            sendResponseInvalid(req, res, "Invalid PID.")
            return;
        }
    }
}