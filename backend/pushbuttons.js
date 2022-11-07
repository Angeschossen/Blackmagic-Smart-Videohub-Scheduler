const { convert_date_to_utc, getSecondOfDay, getSecondOfDayUTC } = require('../components/utils/dateutils');
const emit = require('./socketio').emit;
const prismadb = require('../database/prisma');
const ICON_ERROR = "Error"
const ICON_SUCCESS = "Accept"

class Button {
    constructor(videohub, id, label, time, userId) {
        this.id = id
        this.videohub = videohub
        this.label = label
        this.time = time
        this.userId = userId
    }

    info(msg) {
        console.log(`[${new Date().toLocaleString()}] [Button ${this.id}] ${msg}`)
    }

    stopSchedule() {
        clearTimeout(this.scheduledTrigger)
    }

    async handleScheduleNextTrigger(date) {
        this.stopSchedule()

        const next = await this.retrieveUpcomingTriggers(date)
        this.info(`Retrieved ${next.length} upcoming triggers.`)
        if (next.length === 0) {
            this.videohub.removeScheduledButton(this.id)
            return false
        }

        await this.scheduleNextTrigger(next[0])
        return true
    }

    async scheduleNextTrigger(trigger) {
        this.time = trigger.time // update, wrap into new Date to prevent wrong time at client side
        if (this.scheduledTrigger != undefined) {
            this.videohub.onScheduledTimeChanged()
        }

        this.stopSchedule()

        // diff
        const at = getSecondOfDayUTC(trigger.time)
        const curr = getSecondOfDayUTC(new Date())
        const diff = at - curr
        this.info(`Next trigger (at ${at}) is in ${diff} second(s). Current second of day: ${curr}`)

        this.scheduledTrigger = setTimeout(async () => {
            await this.videohub.executeButton(trigger.pushbutton_id).then(async result => {
                const label = await module.exports.getLabelOfButton(trigger.pushbutton_id)

                if (result != undefined) {
                    this.videohub.addFailedButton(this)
                    await this.videohub.logActivity(`Scheduled button failed: ${label}`, ICON_ERROR);
                } else {
                    await this.videohub.logActivity(`Scheduled button was successful: ${label}`, ICON_SUCCESS);
                }

                // go to next
                if (await this.handleScheduleNextTrigger(new Date())) {
                    this.videohub.emitScheduleChange()
                }
            })
        }, diff * 1000)
    }

    async retrieveUpcomingTriggers(date) {
        this.info("Retrieving upcoming triggers.")

        const time = date
        return await prismadb.pushButtonTrigger.findMany({
            where: {
                videohub_id: this.videohub.data.id,
                pushbutton_id: this.id,
                day: time.getUTCDay(),
                time: {
                    gte: time
                }
            },
            orderBy: {
                time: 'asc'
            }
        })
    }
}


const BUTTON_SELECT = {
    pushbutton_id: true,
    time: true,
    pushbutton: {
        select: {
            label: true,
            user_id: true,
        }
    },
}

module.exports = {
    getLabelOfButton: async function (buttonId) {
        const label = await prismadb.pushButton.findUnique({
            where: {
                id: buttonId
            },
            select: {
                label: true,
            }
        }).then(res => res.label)
        return label
    },
    retrievescheduledButton: async function (videohub, buttonId, time) {
        const res = await prismadb.pushButtonTrigger.findFirst({
            where: {
                videohub_id: videohub.data.id,
                day: time.getDay(),
                pushbutton_id: buttonId,
                time: {
                    gte: time
                }
            },
            select: BUTTON_SELECT
        })

        if (res != undefined) {
            return new Button(videohub, buttonId, res.pushbutton.label, res.time, res.pushbutton.user_id)
        } else {
            return undefined
        }
    },
    retrieveScheduledButtonsToday: async function (videohub) {
        const time = new Date()

        console.log(`Retrieving buttons for date: ${time.toLocaleString()} Day: ${time.getUTCDay()}`)
        const res = await prismadb.pushButtonTrigger.findMany({
            where: {
                videohub_id: videohub.data.id,
                day: time.getUTCDay(),
                time: {
                    gte: time
                }
            },
            select: BUTTON_SELECT
        })

        const buttons = []
        const done = new Set()

        for (const button of res) {
            const id = button.pushbutton_id
            if (done.has(id)) {
                continue
            }

            const b = new Button(videohub, id, button.pushbutton.label, button.time, button.pushbutton.user_id)
            buttons.push(b)
            done.add(id)
        }

        return buttons
    }
}