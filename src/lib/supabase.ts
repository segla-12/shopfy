import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true, // Recommandé par Supabase pour les flux OAuth
    flowType: "pkce",
    persistSession: true,
  },
});

export async function syncServerAuthSession(accessToken?: string) {
  const token = accessToken || (await supabase.auth.getSession()).data.session?.access_token;

  if (!token) {
    return false;
  }

  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.ok;
}

export async function clearServerAuthSession() {
  await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
}
