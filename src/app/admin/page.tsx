import Link from "next/link";
import { redirect } from "next/navigation";
import { OrderStatus, ProductStatus, StockStatus } from "@prisma/client";

import { StockImportForm } from "@/components/stock-import-form";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/modules/admin/auth";
import {
  getLaunchReadiness,
  summarizeLaunchReadiness,
} from "@/modules/runtime/launch-readiness";
import { formatPriceCny } from "@/modules/site/brand-config";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const readiness = getLaunchReadiness();

  const [products, recentOrders, availableStock, completedRevenue] =
    await Promise.all([
      prisma.product.findMany({
        where: { status: ProductStatus.ACTIVE },
        include: {
          _count: {
            select: {
              stockItems: {
                where: { status: StockStatus.AVAILABLE },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.order.findMany({
        include: { product: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.stockItem.count({
        where: { status: StockStatus.AVAILABLE },
      }),
      prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED },
        _sum: { amount: true },
      }),
    ]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-20 pt-10 sm:px-8 lg:px-12">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="section-label">Admin Dashboard</div>
          <h1 className="text-4xl font-semibold tracking-[-0.05em] text-white">
            库存、订单与支付面板
          </h1>
        </div>
        <form action="/api/admin/logout" method="post">
          <button className="action-secondary" type="submit">
            退出后台
          </button>
        </form>
      </div>

      <section className="panel-surface">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200/70">
              Launch Readiness
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              {summarizeLaunchReadiness(readiness)}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              当前支付模式：{readiness.paymentProvider}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <a
              className="action-secondary"
              href="/api/health"
              rel="noreferrer"
              target="_blank"
            >
              健康检查
            </a>
            <a
              className="action-secondary"
              href="/api/health?strict=1"
              rel="noreferrer"
              target="_blank"
            >
              严格检查
            </a>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {readiness.checks.map((check) => (
            <div
              key={check.code}
              className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 lg:flex-row lg:items-start lg:justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-white">{check.label}</div>
                <div className="mt-1 text-sm text-slate-400">{check.message}</div>
              </div>
              <div
                className={`w-fit rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] ${
                  check.status === "pass"
                    ? "bg-emerald-500/15 text-emerald-200"
                    : check.status === "warn"
                      ? "bg-amber-500/15 text-amber-200"
                      : "bg-rose-500/15 text-rose-200"
                }`}
              >
                {check.status}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel-surface">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200/70">
            活跃商品
          </div>
          <div className="mt-3 text-3xl font-semibold text-white">{products.length}</div>
        </div>
        <div className="panel-surface">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200/70">
            可售库存
          </div>
          <div className="mt-3 text-3xl font-semibold text-white">{availableStock}</div>
        </div>
        <div className="panel-surface">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200/70">
            已完成成交额
          </div>
          <div className="mt-3 text-3xl font-semibold text-white">
            {formatPriceCny(completedRevenue._sum.amount ?? 0)}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="panel-surface overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-white">商品与库存</h2>
              <p className="mt-1 text-sm text-slate-400">前台展示商品和可售库存快照</p>
            </div>
            <Link className="action-secondary" href="/">
              查看前台
            </Link>
          </div>

          <div className="divide-y divide-white/10">
            {products.map((product) => (
              <div
                key={product.id}
                className="grid gap-3 px-6 py-5 md:grid-cols-[1fr_auto_auto]"
              >
                <div>
                  <div className="text-lg font-semibold text-white">{product.name}</div>
                  <div className="mt-1 text-sm text-slate-400">{product.summary}</div>
                </div>
                <div className="text-sm text-slate-300">{formatPriceCny(product.price)}</div>
                <div className="font-mono text-sm text-cyan-200">
                  库存 {product._count.stockItems}
                </div>
              </div>
            ))}
          </div>
        </div>

        <StockImportForm
          products={products.map((product) => ({
            id: product.id,
            name: product.name,
          }))}
        />
      </section>

      <section className="panel-surface overflow-hidden p-0">
        <div className="border-b border-white/10 px-6 py-5">
          <h2 className="text-xl font-semibold text-white">最近订单</h2>
          <p className="mt-1 text-sm text-slate-400">检查支付状态、发货结果和异常单</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5">
              <tr className="text-slate-400">
                <th className="px-6 py-3 font-medium">订单号</th>
                <th className="px-6 py-3 font-medium">商品</th>
                <th className="px-6 py-3 font-medium">金额</th>
                <th className="px-6 py-3 font-medium">状态</th>
                <th className="px-6 py-3 font-medium">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {recentOrders.map((order) => (
                <tr key={order.id} className="text-slate-200">
                  <td className="px-6 py-4 font-mono text-xs">{order.orderNo}</td>
                  <td className="px-6 py-4">{order.product.name}</td>
                  <td className="px-6 py-4">{formatPriceCny(order.amount)}</td>
                  <td className="px-6 py-4">{order.status}</td>
                  <td className="px-6 py-4">{order.createdAt.toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
