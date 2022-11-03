const { convert_date_to_utc } = require('../components/utils/dateutils');
const prismadb = require('../database/prisma');
const ICON_ERROR = "Error"
const ICON_SUCCESS = "Accept"

class Button {
    constructor(videohub, id, label) {
        this.id = id
        this.videohub = videohub
        this.label = label
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
            this.videohub.removeScheduledButton(this)
            return
        }

        await this.scheduleNextTrigger(next[0])
    }

    async scheduleNextTrigger(trigger) {
        this.stopSchedule()

        const hour = trigger.time.getUTCHours()
        const minutes = trigger.time.getUTCMinutes()
        const seconds = trigger.time.getUTCSeconds()

        const now = new Date()
        trigger.time.setTime(now.getTime())
        trigger.time.setHours(hour)
        trigger.time.setMinutes(minutes)
        trigger.time.setSeconds(seconds)

        // diff
        const diff = trigger.time - convert_date_to_utc(now)
        this.info(`Next trigger is in ${diff / 1000} second(s).`)

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
                await this.handleScheduleNextTrigger(new Date())
            })
        }, diff)
    }

    async retrieveUpcomingTriggers(date) {
        this.info("Retrieving upcoming triggers.")

        const time = new Date(date)
        return await prismadb.pushButtonTrigger.findMany({
            where: {
                videohub_id: this.videohub.data.id,
                pushbutton_id: this.id,
                day: time.getDay(),
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
    label: true,
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
            return new Button(videohub, buttonId, label)
        } else {
            return undefined
        }
    },
    retrieveScheduledButtonsToday: async function (videohub) {
        const time = new Date()
        console.log(`Retrieving buttons for date: ${time.toLocaleString()} Day: ${time.getDay()}`)
        const res = await prismadb.pushButtonTrigger.findMany({
            where: {
                videohub_id: videohub.data.id,
                day: time.getDay(),
                time: {
                    gte: time
                }
            },
            select: BUTTON_SELECT
        })

        const buttons = []
        const done = new Set()

        for (const button of res) {
            if (done.has(button.id)) {
                continue
            }

            const b = new Button(videohub, button.id, button.label)
            buttons.push(b)
            done.add(button.id)
        }

        return buttons
    }
}