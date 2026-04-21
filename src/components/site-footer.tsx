import { brandConfig } from "@/modules/site/brand-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto w-full max-w-7xl px-6 py-6 text-sm text-slate-500 sm:px-8 lg:px-12">
        <div>© 2026 {brandConfig.name}. 版权所有。</div>
      </div>
    </footer>
  );
}
