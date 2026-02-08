"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface AppFrameProps {
  children: ReactNode;
}

export function AppFrame({ children }: AppFrameProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-60 flex-1">{children}</main>
    </div>
  );
}
