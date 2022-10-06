import { useSession } from "next-auth/react";
import { LoginPage } from "../auth/Login";

interface InputProps {
    children: React.ReactNode,
}

export const ProtectedPage = (props: InputProps) => {
    const { data: session } = useSession();

        return <>{props.children}</>
}