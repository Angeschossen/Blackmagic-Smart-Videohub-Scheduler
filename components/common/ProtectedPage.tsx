import { Label, Spinner, Stack } from "@fluentui/react";
import { useSession } from "next-auth/react";
import Router from "next/router";
import React, { useEffect } from "react";
import { LoginPage } from "../auth/Login";

interface InputProps {
    children: React.ReactNode,
}

export function useProtectedSession() {

}
export const ProtectedPage = (props: InputProps) => {
    // if `{ required: true }` is supplied, `status` can only be "loading" or "authenticated"
    const { status } = useSession({ required: true })

    if (status === "loading") {
        return <></>
    }

    return <>{props.children}</>;
}