import { Scheduler } from "@aldabil/react-scheduler";
import { SelectOption } from "@aldabil/react-scheduler/dist/components/inputs/SelectInput";
import { EventActions, ProcessedEvent } from "@aldabil/react-scheduler/dist/types";
import React from "react";
import prisma from "../../database/prisma";
import { getVideohubFromQuery, retrieveVideohubServerSide, retrieveVideohubsServerSide } from "../api/videohubs/[pid]";
import { getPostHeader } from "./main";
import { Videohub } from "../../components/Videohub";
import { VideohubPage } from "../../components/videohub/VideohubPage";

const HOUR_SART = 0, HOUR_END = 23, DAY_STEP_MINUTES = 60;

const RESOURCES = [
    {
        admin_id: 1,
        title: "John",
        mobile: "555666777",
        avatar: "https://picsum.photos/200/300",
        color: "#ab2d2d"
    },
    {
        admin_id: 2,
        title: "Sarah",
        mobile: "545678354",
        avatar: "https://picsum.photos/200/300",
        color: "#58ab2d"
    }
];

const fetchRemote = async (query: string, videohub: Videohub, output: number): Promise<ProcessedEvent[] | void> => {
    let start_string = query.substring(7);
    const index = start_string.indexOf("&end=");
    const end_string = start_string.substring(index + 5);
    start_string = start_string.substring(0, index);

    return fetch("/api/events/get", getPostHeader({
        videohub_id: videohub.id,
        output: output,
        start: start_string,
        end: end_string
    })).then(async res => {

        const events: OutputEvent[] = await res.json();
        const processed: ProcessedEvent[] = [];

        events.forEach(e => {
            const ev: ProcessedEvent = {
                event_id: e.id,
                title: videohub.inputs[e.input_id].label,
                start: new Date(e.start),
                end: new Date(e.end),
            };

            processed.push(ev);
        });

        return processed;
    });
};

export interface OutputEvent {
    id: number,
    event_id: string | number,
    videohub_id: number,
    output_id: number,
    input_id: number,
    start: Date,
    end: Date,
    day_of_week: number,
    repeat_every_week: boolean,
}

const handleConfirm = async (event: ProcessedEvent, _action: EventActions, videohub: Videohub, output: number): Promise<ProcessedEvent> => {
    const e: OutputEvent = {
        id: event.event_id ? Number(event.event_id) : -1,
        event_id: event.event_id,
        videohub_id: videohub.id,
        output_id: output,
        input_id: Number(event.title) - 1, // fix not selectable
        start: event.start,
        end: event.end,
        day_of_week: event.start.getDay(),
        repeat_every_week: event.repeat.length > 0,
    };

    return fetch('/api/events/update', getPostHeader(e)).then(async res => {
        const json = await res.json();
        return {
            event_id: json.id,
            title: videohub.inputs[json.input_id].label,
            start: new Date(json.start),
            end: new Date(json.end),
        };
    });
}

const handleDelete = async (deletedId: string | number, videohub: number): Promise<string | number | void> => {
    return fetch('/api/events/delete', getPostHeader({ id: deletedId, videohub_id: videohub })).then(async res => {
        const json = await res.json();
        return json.id;
    });
}

interface OutputProps {
    videohub: Videohub,
    output: number,
}

export async function getServerSideProps(context: any) {
    /*
    context.res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=120'
    )*/

    const hub: Videohub = getVideohubFromQuery(context.query);
    return {
        props: {
            videohub: JSON.parse(JSON.stringify(hub)),
            output: Number(context.query.output),
        },
    }
}

class OutputView extends React.Component<OutputProps, {}> {

    constructor(props: OutputProps) {
        super(props);
    }

    getInputChoices(): Array<SelectOption> {
        const options: Array<SelectOption> = [];

        for (const input of this.props.videohub.inputs) {
            const id = input.id + 1; // fix not selectable

            options.push({
                id: id,
                text: input.label,
                value: id,
            })
        }

        return options;
    }

    render() {
        return <VideohubPage videohub={this.props.videohub}>
            <Scheduler
                remoteEvents={(q) => fetchRemote(q, this.props.videohub, this.props.output)}
                onConfirm={(e, a) => {
                    return handleConfirm(e, a, this.props.videohub, this.props.output);
                }}
                onDelete={(id) => handleDelete(id, this.props.videohub.id)}
                view={"week"}
                week={
                    {
                        weekDays: [0, 1, 2, 3, 4, 5, 6],
                        weekStartOn: 0,
                        startHour: HOUR_SART,
                        endHour: HOUR_END,
                        step: DAY_STEP_MINUTES,
                    }
                }
                day={
                    {
                        startHour: HOUR_SART,
                        endHour: HOUR_END,
                        step: DAY_STEP_MINUTES,
                    }
                }
                fields={[
                    {
                        name: "title",
                        type: "select",
                        options: this.getInputChoices(),
                        config: {
                            label: "Input", required: true, errMsg: "Please select an input."
                        }
                    },
                    {
                        name: "repeat",
                        type: "select",
                        options: [
                            {
                                id: 0,
                                text: "No",
                                value: false
                            },
                            {
                                id: 1,
                                text: "Yes",
                                value: true,
                            }
                        ],
                        config: {
                            label: "Repeat every Week", required: false
                        }
                    }
                ]}
                selectedDate={new Date()}
                onEventDrop={(_date, updated, old) => {
                    updated.event_id = old.event_id;
                    return handleConfirm(updated, "edit", this.props.videohub, this.props.output);
                }}
            />
        </VideohubPage>;
    }
}

export default OutputView;