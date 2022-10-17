import React from "react";
import { Dialog, DialogTrigger, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent, Button, DialogTriggerProps, Label, Input, makeStyles, DialogProps, DialogOpenChangeEvent, DialogOpenChangeData } from "@fluentui/react-components";


interface InputProps {
    onConfirm: (obj?: any) => string | undefined,
    trigger?: JSX.Element,
    title: string,
    children?: React.ReactNode,
    open?: boolean,
    onOpenChange?: (event: DialogOpenChangeEvent, data: DialogOpenChangeData) => void,
}

export interface InputModalProps {

}

const useStyles = makeStyles({
    content: {
        display: 'flex',
        flexDirection: 'column',
        rowGap: '10px'
    }
});

export const InputModal = (props: InputProps) => {
    const [data, setData] = React.useState<{ error?: string }>({ error: undefined });
    const styles = useStyles();
    const handleSubmit = (ev: React.FormEvent) => {
        ev.preventDefault();
        const err: string | undefined = props.onConfirm();
        if (err == undefined) {
            close();
        } else {
            setData({ error: err });
        }
    };

    return (
        <Dialog
            open={props.open}
            onOpenChange={props.onOpenChange}
            modalType="non-modal">
            <>
                {props.trigger != undefined && <DialogTrigger>
                    {props.trigger}
                </DialogTrigger>}
            </>
            <DialogSurface>
                <form onSubmit={handleSubmit}>
                    <DialogBody>
                        <DialogTitle>{props.title}</DialogTitle>
                        <DialogContent className={styles.content}>
                            {props.children}
                        </DialogContent>
                        <DialogActions>
                            <DialogTrigger>
                                <Button appearance="secondary">Close</Button>
                            </DialogTrigger>
                            <Button type="submit" appearance="primary">
                                Submit
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </form>
            </DialogSurface>
        </Dialog>
    );

    /*
    return (
        <Modal
            isOpen={props.isOpen}
            key={props.modalKey}>
            <Stack tokens={stackTokens} styles={{ root: { padding: '2vh' } }}>
                {props.children}
                {data.error != undefined &&
                    <BarMessage text={data.error} type={MessageBarType.error}></BarMessage>
                }
                <Confirmation
                    onCancel={() => {
                        close();
                        props.onCancel();
                    }}
                    onConfirm={() => {
                        const err: string | undefined = props.onConfirm();
                        if (err == undefined) {
                            close();
                        } else {
                            setData({ error: err });
                        }
                    }} />
            </Stack>
        </Modal>
    ); */
}