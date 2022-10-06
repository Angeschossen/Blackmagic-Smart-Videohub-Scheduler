import { DefaultButton, Stack } from "@fluentui/react"
import { useSession, signIn, signOut } from "next-auth/react"

export const LoginPage = () => {
  return (<Stack horizontalAlign="center" verticalAlign="center" style={{height: '50%'}}>
    <DefaultButton id="1"
      onClick={() => signIn()}
    >
      Please login
    </DefaultButton>
  </Stack>);
}

export default function Login() {
  const { data: session } = useSession()
  if (session) {
    return (
      <>
        Signed in as {session.user?.email} <br />
        <button onClick={() => signOut()}>Sign out</button>
      </>
    )
  }

  return (
    <>
      Not signed in <br />
      <button onClick={() => signIn()}>Sign in</button>
    </>
  )
}