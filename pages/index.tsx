import { DefaultButton, DetailsHeader, Link, MessageBar, MessageBarButton, MessageBarType, Stack } from '@fluentui/react'
import { DismissCircleRegular, DoorArrowRight16Filled, DoorArrowRight16Regular, DoorArrowRightFilled } from '@fluentui/react-icons'
import type { NextPage } from 'next'
import { signOut, useSession } from 'next-auth/react'
import Head from 'next/head'
import Image from 'next/image'
import Login from '../components/auth/Login'
import { AlertMessage } from '../components/common/AlertMessage'
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

  const user:any = session?.user
  return (
    <>
      <Stack.Item style={{ justifyContent: 'flex-end', padding: 15 }}>
        <AlertMessage
          message={`You're logged in as ${user.username}${session?.user?.email == undefined ? "" : " (" + session.user.email + ")"}.`}
          action={
            {
              icon: <DoorArrowRightFilled aria-label="dismiss message" />,
              onClick: () => {
                signOut()
              }
            }
          }
          intent="info"
        />

      </Stack.Item>
      <VideohubActivityView activityItems={p.videohubActivities} />
    </>
  )
}

export default Home
