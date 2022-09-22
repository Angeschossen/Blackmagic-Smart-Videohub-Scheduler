import { IconButton } from '@fluentui/react';
import React from 'react';
import CustomModal, { ModalProps } from './CustomModal';

export interface InputModalProps extends ModalProps {
    handleCancel: any,
    handleDone: any,
};

class InputModal<K, T> extends CustomModal<InputModalProps, T>  {

    constructor(props: InputModalProps) {
        super(props);
    }

    getElements(): JSX.Element[] {
        const p: InputModalProps = this.props as InputModalProps;
        return [<IconButton
            key='cancel'
            iconProps={{ iconName: 'Cancel' }}
            text='Cancel'
            onClick={p.handleCancel} />,
        <IconButton
            key='done'
            iconProps={{ iconName: 'Accept' }}
            text='Done'
            styles={{
                root: {
                    position: 'absolute',
                    right: 0
                }
            }}
            onClick={e => {
                p.handleDone();
            }} />
        ];
    }

    render() {
        return super.render();
    }
}

export default InputModal