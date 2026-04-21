import Link from "next/link";

import { brandConfig } from "@/modules/site/brand-config";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[rgba(6,12,16,0.76)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-3 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="text-sm font-semibold tracking-[-0.03em] text-white transition hover:text-cyan-200"
        >
          {brandConfig.name}
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          {brandConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-slate-300 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
