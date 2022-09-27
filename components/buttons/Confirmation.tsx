import { DefaultPalette, IconButton, Stack } from '@fluentui/react';
import React from 'react';

export interface ConfirmationProps {
    onCancel: () => void,
    onConfirm: () => void,
};

export const Confirmation = (p: ConfirmationProps) => {
    return (
        <Stack horizontal styles={{ root: { flexWrap: 'wrap', justifyContent: 'space-between' } }}>
            <IconButton
                key='cancel'
                iconProps={{ iconName: 'Cancel' }}
                text='Cancel'
                onClick={p.onCancel} />
            <IconButton
                key='done'
                iconProps={{ iconName: 'Accept' }}
                text='Done'
                onClick={p.onConfirm} />
        </Stack>
    );
}