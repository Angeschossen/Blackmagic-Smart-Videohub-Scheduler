import { Alert, AlertProps } from "@fluentui/react-components/unstable"


export const AlertMessage = (props: { message: string } & AlertProps) => {
    return (
        <Alert
            {...props}>
            {props.message}
        </Alert>
    )
}