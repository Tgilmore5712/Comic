"use client";

import dynamic from "next/dynamic";

const ComicStudio = dynamic(
  () => import("@/components/comic-studio").then((module) => module.ComicStudio),
  { ssr: false },
);

export function ComicStudioShell() {
  return <ComicStudio />;
}