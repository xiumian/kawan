import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { StockStatus } from "@prisma/client";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/modules/admin/auth";
import { stockImportSchema } from "@/modules/order/order.schemas";

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const sessionCookie = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("chenfenpro_admin="))
    ?.split("=")[1];

  if (!verifyAdminSession(sessionCookie)) {
    return NextResponse.json({ error: "未登录或会话已失效" }, { status: 401 });
  }

  try {
    const payload = stockImportSchema.parse(await request.json());
    const lines = payload.content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const rows = lines.map((line, index) => {
      const parts = line.split(",").map((part) => part.trim());

      if (parts.length >= 2) {
        return {
          productId: payload.productId,
          serialCode: parts[0],
          secretCode: parts.slice(1).join(","),
          status: StockStatus.AVAILABLE,
          batchLabel: payload.batchLabel,
        };
      }

      return {
        productId: payload.productId,
        serialCode: `AUTO-${index + 1}-${randomUUID().slice(0, 6).toUpperCase()}`,
        secretCode: parts[0],
        status: StockStatus.AVAILABLE,
        batchLabel: payload.batchLabel,
      };
    });

    await prisma.stockItem.createMany({ data: rows });
    await prisma.auditLog.create({
      data: {
        action: "stock.import",
        targetType: "Product",
        targetId: payload.productId,
        detail: JSON.stringify({
          batchLabel: payload.batchLabel,
          importedCount: rows.length,
        }),
      },
    });

    return NextResponse.json({ importedCount: rows.length });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "参数错误" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "导入失败" },
      { status: 400 },
    );
  }
}
