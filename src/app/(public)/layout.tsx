import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(46,224,255,0.16),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(134,255,216,0.12),transparent_24%),linear-gradient(180deg,rgba(9,18,24,0.92),rgba(4,8,12,1))]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(125,162,173,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(125,162,173,0.08)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
