import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import { initializeIcons } from '@fluentui/react';
import React from 'react';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';

export default function App({ Component, pageProps }: AppProps<{
  session: Session
}>) {
  React.useEffect(() => {
    initializeIcons();
  }, []);

  return (
    <SessionProvider session={pageProps.session}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  )
}
