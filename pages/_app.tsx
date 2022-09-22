import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import { initializeIcons } from '@fluentui/react';
import React from 'react';

function MyApp({ Component, pageProps }: AppProps) {

  React.useEffect(() => {
    initializeIcons();
  }, []);

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}

export default MyApp
