import { NextResponse } from "next/server";

import { getAdminCookieName } from "@/modules/admin/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.set({
    name: getAdminCookieName(),
    value: "",
    maxAge: 0,
    path: "/",
  });

  return response;
}
