import { DefaultButton, DetailsHeader, Link, MessageBar, MessageBarButton, MessageBarType, Stack } from '@fluentui/react'
import type { NextPage } from 'next'
import { signOut, useSession } from 'next-auth/react'
import Head from 'next/head'
import Image from 'next/image'
import Login from '../components/auth/Login'
import { VideohubActivity } from '../components/interfaces/Videohub'
import { VideohubActivityView } from '../components/views/VideohubActivityView'
import styles from '../styles/Home.module.css'
import { getVideohubActivityServerSide } from './api/videohubs/[pid]'

export async function getServerSideProps(context: any) {
  context.res.setHeader(
    'Cache-Control',
    'public, s-maxage=60, stale-while-revalidate=120'
  )

  const res: VideohubActivity[] = await getVideohubActivityServerSide();
  return {
    props: {
      videohubActivities: JSON.parse(JSON.stringify(res)),
    },
  }
}

interface InputProps {
  videohubActivities: VideohubActivity[],
}

const Home = (p: InputProps) => {
  const { data: session } = useSession();

  p.videohubActivities.forEach(item => {
    item.time = new Date(item.time);
  });

  return (
    <>
      <Stack>
        <MessageBar
          actions={
            <div>
              <MessageBarButton
                onClick={() => { signOut() }}
              >Logout</MessageBarButton>
            </div>
          }
          messageBarType={MessageBarType.info}
          isMultiline={false}
        >
          You're logged in as {session?.user?.name} ({session?.user?.email}).
        </MessageBar>
      </Stack>
      <VideohubActivityView activityItems={p.videohubActivities} />
    </>
  )
}

export default Home
