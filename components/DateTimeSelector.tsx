import { TimePicker, DatePicker, mergeStyles, Checkbox } from '@fluentui/react';
import React from 'react';


const rootClass = mergeStyles({ maxWidth: 300, margin: '20px', selectors: { '> *': { marginBottom: 15 } } });

export interface DateTimeSelectorProps {
    onDateInput: any,
    onFromTimeInput: any,
    onToTimeInput: any,
    onRepeatInput: any
};

class DateTimeSelector extends React.Component<DateTimeSelectorProps> {

    constructor(props: DateTimeSelectorProps) {
        super(props);

        this.state = {
            date: null,
            time: null,
            repeat: false
        };
    }


    public render() {
        return (
            <div className={rootClass}>
                <h1 className="font-bold text-3xl">Pick Date and Period</h1>
                <DatePicker
                    isRequired={true}
                    placeholder="Select a date..."
                    ariaLabel="Select a date"
                    label={'Date'}
                    onSelectDate={d => this.props.onDateInput(d)}
                />
                <TimePicker
                    allowFreeform
                    label={'From'}
                    useComboBoxAsMenuWidth
                    onChange={(_e, t) => this.props.onFromTimeInput(t)}
                />
                <TimePicker
                    allowFreeform
                    label={'To'}
                    useComboBoxAsMenuWidth
                    onChange={(_e, t) => this.props.onToTimeInput(t)}
                />
                <Checkbox
                    label='Repeat each Week'
                    onChange={(_e, r) => this.props.onRepeatInput(r)}
                />
            </div>
        )
    }
}

export default DateTimeSelector