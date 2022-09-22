import { IconButton, Modal } from '@fluentui/react';
import React from 'react';
import { ModalProps } from './CustomModal';
import DateTimeSelector from './DateTimeSelector';
import InputModal, { InputModalProps } from './InputModal';

export interface DateTimeSelectorModalProps extends InputModalProps {
};

class DateTimeSelectorModal extends InputModal<DateTimeSelectorModalProps, { date: any, time_from: any, time_to: any, repeat: boolean }>  {

    constructor(props: DateTimeSelectorModalProps) {
        super(props);

        this.state = {
            date: null,
            time_from: null,
            time_to: null,
            repeat: false,
        };
    }

    getElements(): JSX.Element[] {
        const elements: JSX.Element[] = super.getElements();
        elements.unshift(<DateTimeSelector
            onDateInput={(d: any) => this.setState({ date: d })}
            onFromTimeInput={(t: any) => this.setState({ time_to: t })}
            onToTimeInput={(t: any) => this.setState({ time_from: t })}
            onRepeatInput={(t: boolean) => this.setState({ repeat: t })}
        />);

        return elements;
    }

    /*
    render() {
        return (
            <Modal
                isOpen={this.props.show}
                onDismiss={this.props.handleCancel}
                isBlocking={true}>

                <DateTimeSelector
                    onDateInput={(d: any) => this.setState({ date: d })}
                    onFromTimeInput={(t: any) => this.setState({ time_to: t })}
                    onToTimeInput={(t: any) => this.setState({ time_from: t })}
                    onRepeatInput={(t: boolean) => this.setState({ repeat: t })}
                />

                <IconButton
                    iconProps={{ iconName: 'Cancel' }}
                    text='Cancel'
                    onClick={this.props.handleCancel} />

                <IconButton
                    iconProps={{ iconName: 'Accept' }}
                    text='Done'
                    styles={{
                        root: {
                            position: 'absolute',
                            right: 0
                        }
                    }}
                    onClick={() => {
                        this.props.handleDone({
                            date: this.state.date,
                            time_from: this.state.time_from == null ? new Date() : this.state.time_from,
                            time_to: this.state.time_to == null ? new Date() : this.state.time_to,
                            repeat: this.state.repeat
                        })
                    }} />
            </Modal>
        );
    }*/
}

export default DateTimeSelectorModal