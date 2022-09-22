import {  IStackStyles, Stack } from "@fluentui/react";
import React, { useEffect, useState } from "react";
import Navigation from "./Naviation";

const StackStyles: Partial<IStackStyles> = {
  root: {
    position: 'absolute',
    left: '220px',
    bottom: 0,
    right: 0,
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
      {ready ? <><Navigation /><Stack styles={StackStyles}>
        {a.children}
      </Stack></>
        : null}
    </>
  );
}

export default Layout;