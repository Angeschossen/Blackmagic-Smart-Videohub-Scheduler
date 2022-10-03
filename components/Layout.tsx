import { IStackStyles, Stack } from "@fluentui/react";
import React, { useEffect, useState } from "react";
import { Navigation } from "./Naviation";
import { useViewType } from "./views/DesktopView";

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
    left: '40px',
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
  const isDekstop = useViewType();
  useEffect(() => {
    setReady(true);
  }, [])

  return (
    <>
      {ready ?
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