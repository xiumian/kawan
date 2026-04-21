import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { env } from "@/lib/env";
import {
  buildAdminSession,
  getAdminCookieName,
  getAdminSessionTtlSeconds,
} from "@/modules/admin/auth";
import { adminLoginSchema } from "@/modules/order/order.schemas";

export async function POST(request: Request) {
  try {
    const payload = adminLoginSchema.parse(await request.json());

    if (
      payload.username !== env.adminUsername ||
      payload.password !== env.adminPassword
    ) {
      return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: getAdminCookieName(),
      value: buildAdminSession(payload.username),
      httpOnly: true,
      path: "/",
      maxAge: getAdminSessionTtlSeconds(),
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "参数错误" },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "登录失败" }, { status: 400 });
  }
}
