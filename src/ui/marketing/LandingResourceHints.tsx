"use client";

import ReactDOM from "react-dom";

export function LandingResourceHints({ heroSrc }: { heroSrc: string }) {
  ReactDOM.preload(heroSrc, { as: "image", fetchPriority: "high" });
  return null;
}
