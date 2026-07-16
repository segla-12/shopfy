import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabaseAdmin";

export const SHOPFY_AUTH_COOKIE = "shopfy_session";

export async function getServerAuthUser() {
  const token = (await cookies()).get(SHOPFY_AUTH_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    return data.user;
  } catch {
    return null;
  }
}
