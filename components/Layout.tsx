import { IStackStyles, Stack } from "@fluentui/react";
import React, { useEffect, useState } from "react";
import { Navigation, useNavViewType } from "./Naviation";

const StackStylesDesktop: Partial<IStackStyles> = {
  root: {
    position: 'absolute',
    left: '140px',
    bottom: 0,
    right: 0,
    height: '100%',
    maxHeight: '100%',
  }
}

const StackStylesMobile: Partial<IStackStyles> = {
  root: {
    position: 'absolute',
    left: '7vh',
    bottom: 0,
    right: 0,
    height: '100%',
    maxHeight: '100%',
  }
}

type LayoutProps = {
  children: React.ReactNode
}

const Layout = (a: LayoutProps) => {
  const [ready, setReady] = useState(false);
  const isDekstop = useNavViewType();
  useEffect(() => {
    setReady(true)
  }, [])

  return (
    <>
      {true ?
        <Stack>
          <Navigation />
          <Stack styles={isDekstop ? StackStylesDesktop : StackStylesMobile}>
            {a.children}
          </Stack>
        </Stack>
        : null}
    </>
  );
}

export default Layout;