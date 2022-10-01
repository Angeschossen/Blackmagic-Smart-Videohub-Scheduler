import { Component } from "react";
import { useMediaQuery } from "react-responsive";
import { desktopMinWidth } from "../utils/styles";

export function evaluateViewType() {
    return useMediaQuery({ query: `(min-width: ${desktopMinWidth}px)` });
}