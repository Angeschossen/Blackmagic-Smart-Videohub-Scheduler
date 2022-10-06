import { DefaultButton, Label, Spinner, Stack } from "@fluentui/react";
import { signOut, useSession } from "next-auth/react";
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
    const { data: session, status } = useSession({ required: true });

    if (status === "loading") {
        return <></>
    }

    const sess: any = session;
    if (sess.user.role_id == undefined) {
        return (<Stack style={{ display: 'flex', justifyContent: "center", alignItems: "center", minHeight: '100vh' }}>
            <h1>You haven't been verified yet.</h1>
            <DefaultButton
                onClick={() => signOut()}
            >Logout and try again.</DefaultButton>
        </Stack>)
    }

    return <>{props.children}</>;
}