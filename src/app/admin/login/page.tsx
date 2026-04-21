import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin-login-form";
import { isAdminAuthenticated } from "@/modules/admin/auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const authenticated = await isAdminAuthenticated();

  if (authenticated) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto flex min-h-[70svh] w-full max-w-5xl items-center px-6 py-10 sm:px-8 lg:px-12">
      <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="section-label">Operations Console</div>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white">
            后台运营入口
          </h1>
          <p className="max-w-md text-sm leading-8 text-slate-400">
            当前后台提供商品库存、订单状态、支付回调结果和补库存入口，适合一期自营场景。
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
}
