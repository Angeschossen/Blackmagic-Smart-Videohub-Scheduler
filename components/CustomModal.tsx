import { Modal } from '@fluentui/react';
import React from 'react';

export interface ModalProps {
    show: boolean
};

class DateTimeSelectorModal<K extends ModalProps, T> extends React.Component<K, T>  {

    constructor(props: K) {
        super(props);
    }

    getElements(): JSX.Element[] {
        return [];
    }

    render() {
        return (
            <Modal
                isOpen={this.props.show}
                isBlocking={true}>
                {this.getElements()}
            </Modal>
        );
    }
}

export default DateTimeSelectorModal