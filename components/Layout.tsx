import { IStackStyles, Stack } from "@fluentui/react";
import React, { useEffect, useState } from "react";
import Navigation from "./Naviation";

const StackStyles: Partial<IStackStyles> = {
  root: {
    position: 'absolute',
    left: '13vh',
    bottom: 0,
    right: '2vh',
    height: '100%',
    maxHeight: '100%'
  }
}

type LayoutProps = {
  children: React.ReactNode
}

const Layout = (a: LayoutProps) => {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(true);
  }, [])

  return (
    <>
      {ready ?
        <Stack>
          <Navigation />
          <Stack styles={StackStyles}>
            {a.children}
          </Stack>
        </Stack>
        : null}
    </>
  );
}

export default Layout;