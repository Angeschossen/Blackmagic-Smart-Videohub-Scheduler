import { Scheduler } from "@aldabil/react-scheduler";
import { SelectOption } from "@aldabil/react-scheduler/dist/components/inputs/SelectInput";
import { EventActions, ProcessedEvent } from "@aldabil/react-scheduler/dist/types";
import React from "react";
import prisma from "../../database/prisma";
import { retrieveVideohubServerSide, retrieveVideohubsServerSide } from "../api/videohubs/[pid]";
import { getPostHeader } from "./main";
import { Videohub } from "../../components/Videohub";


const fetchRemote = async (query: string, videohub: Videohub, output: number): Promise<ProcessedEvent[] | void> => {
    let start_string = query.substring(7);
    const index = start_string.indexOf("&end=");
    const end_string = start_string.substring(index + 5);
    start_string = start_string.substring(0, index);

    return fetch("/api/events/get", getPostHeader({ 
        videohub_id: videohub.id,
         output: output, 
         start: start_string, 
         end: end_string })).then(async res => {

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
    id: number
    videohub_id: number,
    output_id: number,
    input_id: number,
    start: Date,
    end: Date,
}

const handleConfirm = async (event: ProcessedEvent, _action: EventActions, videohub: Videohub, output: number): Promise<ProcessedEvent> => {
    const e: OutputEvent = {
        id: event.event_id ? Number(event.event_id) : -1,
        videohub_id: videohub.id,
        output_id: output,
        input_id: Number(event.title) -1, // fix not selectable
        start: event.start,
        end: event.end,
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
    return fetch('/api/events/delete', getPostHeader({ id: deletedId, videohub: videohub })).then(async res => {
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
  
    const id:number = Number(context.query.videohub);
    const hub: Videohub = await retrieveVideohubServerSide(id, true, true);
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
        return <div><div style={{ margin: 20, maxWidth: '100%' }}><Scheduler
            remoteEvents={(q) => fetchRemote(q, this.props.videohub, this.props.output)}
            onConfirm={(e, a) => {
                return handleConfirm(e, a, this.props.videohub, this.props.output);
            }}
            onDelete={(id) => handleDelete(id, this.props.videohub.id)}
            view={"week"}
            week={
                {
                    weekDays: [0, 1, 2, 3, 4, 5, 6],
                    weekStartOn: 1,
                    startHour: 0,
                    endHour: 23,
                    step: 60,
                }
            }
            fields={[
                {
                    name: "title",
                    type: "select",
                    options: this.getInputChoices(),
                    config: {
                        label: "Input", required: true, errMsg: "Please select an Input."
                    }
                }
            ]}
            selectedDate={new Date()}
            onEventDrop={(_date, updated, old) => {
                updated.event_id = old.event_id;
                return handleConfirm(updated, "edit", this.props.videohub, this.props.output);
            }}
        /></div></div>;
    }
}

export default OutputView;