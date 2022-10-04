import { VideohubActivity } from '../components/interfaces/Videohub'
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
  p.videohubActivities.forEach(item => {
    item.time = new Date(item.time);
  });

  return (
    <VideohubActivityView activityItems={p.videohubActivities} />
  )
}

export default Home
