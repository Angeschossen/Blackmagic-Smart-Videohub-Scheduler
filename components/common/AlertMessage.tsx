import { Alert, AlertProps } from "@fluentui/react-components/unstable"
import { DismissCircleFilled, DismissCircleRegular } from "@fluentui/react-icons"


export const AlertMessage = (props: { message: string } & AlertProps) => {
    return (
        <Alert
            {...props}>
            {props.message}
        </Alert>
    )
}