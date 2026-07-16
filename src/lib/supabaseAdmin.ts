import { createClient } from "@supabase/supabase-js";

export function createSupabaseAdminClient() {
  // Prevent accidental client-side usage
  if (typeof window !== "undefined") {
    throw new Error("createSupabaseAdminClient must only be used on the server.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Configuration admin Supabase manquante.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseServerClient() {
  // Use the anon key for server-side non-admin operations to avoid exposing service role
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Configuration Supabase manquante.");
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseAnonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Configuration Supabase anonyme manquante.");
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseRequestClient(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authorization = request.headers.get("authorization") || getAuthorizationFromCookie(request);

  if (!supabaseUrl || !anonKey) {
    throw new Error("Configuration Supabase manquante.");
  }

  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: authorization ? { Authorization: authorization } : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getAuthorizationFromCookie(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const token = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("shopfy_session="))
    ?.slice("shopfy_session=".length);

  return token ? `Bearer ${decodeURIComponent(token)}` : "";
}
