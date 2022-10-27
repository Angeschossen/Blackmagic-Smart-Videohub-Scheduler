import { initializeIcons } from '@fluentui/react';
import {
  createDOMRenderer,
  FluentProvider,
  GriffelRenderer, RendererProvider, SSRProvider as OrgiginalSSRProvider, webLightTheme
} from '@fluentui/react-components';
import { Session } from 'next-auth';
import { SessionProvider } from "next-auth/react";
import type { AppProps } from 'next/app';
import React from 'react';
import { ProtectedPage } from '../components/common/ProtectedPage';
import Layout from '../components/Layout';
import '../styles/globals.css';


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
