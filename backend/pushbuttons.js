const { convert_date_to_utc } = require('../components/utils/dateutils');
const prismadb = require('../database/prisma');
const ICON_ERROR = "Error"
const ICON_SUCCESS = "Accept"

class Button {
    constructor(videohub, id) {
        this.id = id
        this.videohub = videohub
    }

    info(msg) {
        console.log(`[Button ${this.id}] ${msg}`)
    }

    stopSchedule() {
        clearTimeout(this.scheduledTrigger)
    }

    async handleScheduleNextTrigger(date) {
        this.stopSchedule()

        const next = await this.retrieveUpcomingTriggers(date)
        if (next.length === 0) {
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
            this.info(`Executing button ${trigger.pushbutton_id}.`)
            const actions = await prismadb.pushButtonAction.findMany({
                where: {
                    pushbutton_id: trigger.pushbutton_id
                },
                select: {
                    output_id: true,
                    input_id: true,
                }
            })

            if (actions.length === 0) {
                this.info("Scheduled button doesn't exist any longer.")
                return
            }

            const label = await prismadb.pushButton.findUnique({
                where: {
                    id: trigger.pushbutton_id
                },
                select: {
                    label: true,
                }
            }).then(res => res.label)

            const outputs = []
            const inputs = []
            for (const action of actions) {
                outputs.push(action.output_id)
                inputs.push(action.input_id)
            }

            this.videohub.sendRoutingUpdateRequest(outputs, inputs).then(async result => {
                if (result != undefined) {
                    await this.videohub.logActivity(`Scheduled button execution failed: ${label}`, ICON_ERROR);
                } else {
                    await this.videohub.logActivity(`Scheduled button execution was successful: ${label}`, ICON_SUCCESS);
                }

                // go to next
                await this.handleScheduleNextTrigger(new Date())
            })
        }, diff)
    }

    async retrieveUpcomingTriggers(date) {
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

module.exports = {
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
            select: {
                pushbutton_id: true,
            }
        })

        if (res != undefined) {
            return new Button(videohub, buttonId)
        } else {
            return undefined
        }
    },
    retrieveScheduledButtonsToday: async function (videohub) {
        const time = new Date()

        const res = await prismadb.pushButtonTrigger.findMany({
            where: {
                videohub_id: videohub.data.id,
                day: time.getDay(),
                time: {
                    gte: time
                }
            },
            select: {
                pushbutton_id: true,
            }
        })

        const buttons = []
        const ids = new Set(res.map(r => r.pushbutton_id))

        for (const button of Array.from(ids)) {
            const b = new Button(videohub, button)
            buttons.push(b)
        }

        return buttons
    }
}