import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import { initializeIcons } from '@fluentui/react';
import React from 'react';
import { SessionProvider } from "next-auth/react"
import { Session } from 'next-auth';
import { ProtectedPage } from '../components/common/ProtectedPage';
import {
  createDOMRenderer,
  FluentProvider,
  GriffelRenderer,
  SSRProvider as OrgiginalSSRProvider,
  RendererProvider,
  webLightTheme,
} from '@fluentui/react-components';


type EnhancedAppProps = AppProps<{ session: Session }> & { renderer?: GriffelRenderer };

const SSRProvider: React.FC<{ children: React.ReactNode }> =
  OrgiginalSSRProvider

export default function App({ Component, pageProps, renderer }: EnhancedAppProps) {
  React.useEffect(() => {
    initializeIcons();
  }, []);

  return (
    // Accepts a renderer from <Document /> or creates a default one<
    // Also triggers rehydration a client
    // @ts-nocheck 
    <RendererProvider renderer={renderer || createDOMRenderer()}>
      <SSRProvider>
        <FluentProvider theme={webLightTheme}>
          <SessionProvider session={pageProps.session}>
            <ProtectedPage>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </ProtectedPage>
          </SessionProvider>
        </FluentProvider>
      </SSRProvider >
    </RendererProvider>
  )
}
