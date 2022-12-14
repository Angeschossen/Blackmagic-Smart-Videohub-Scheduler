import { Stack } from '@fluentui/react'
import { DoorArrowRightFilled, DoorArrowRightRegular } from '@fluentui/react-icons'
import { signOut, useSession } from 'next-auth/react'
import { AlertMessage } from '../components/common/AlertMessage'
import { VideohubActivity } from '../components/interfaces/Videohub'
import { stackTokens } from '../components/utils/styles'
import { videohubPageStyle } from '../components/videohub/VideohubPage'
import { VideohubActivityView } from '../components/views/VideohubActivityView'
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
    <Stack style={videohubPageStyle} tokens={stackTokens}>
      <Stack.Item style={{ justifyContent: 'flex-end' }}>
        <AlertMessage
          message={`You're logged in as ${user.username}${session?.user?.email == undefined ? "" : " (" + session.user.email + ")"}.`}
          action={
            {
              icon: <DoorArrowRightFilled/>,

              onClick: () => {
                signOut()
              }
            }
          }
          intent="info"
        />

      </Stack.Item>
      <VideohubActivityView activityItems={p.videohubActivities} />
    </Stack>
  )
}

export default Home
