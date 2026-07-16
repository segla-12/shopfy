import { NextResponse } from "next/server";
import { SHOPFY_AUTH_COOKIE } from "@/lib/serverAuth";
import { createSupabaseServerClient } from "@/lib/supabaseAdmin";

const cookieMaxAge = 10 * 60;

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";

  if (!token) {
    return NextResponse.json({ message: "Authentication token required." }, { status: 401 });
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json({ message: "Invalid session." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SHOPFY_AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: cookieMaxAge,
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Missing Supabase server configuration." }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SHOPFY_AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
