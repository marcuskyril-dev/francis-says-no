import { createClient, type PostgrestError, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const parseSupabaseKeyRole = (key: string): string | null => {
  const tokenParts = key.split(".");
  if (tokenParts.length < 2) {
    return null;
  }

  try {
    const payloadJson = Buffer.from(tokenParts[1], "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
};

const validateSupabaseConfig = (): void => {
  const missing: string[] = [];

  if (!supabaseUrl) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseAnonKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (missing.length > 0) {
    throw new Error(`Missing Supabase configuration keys: ${missing.join(", ")}`);
  }

  const keyRole = parseSupabaseKeyRole(supabaseAnonKey!);
  if (keyRole === "service_role") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is configured with a service role key. Replace it with the Supabase anon/public key to enforce RLS."
    );
  }
};

validateSupabaseConfig();

export const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const toServiceError = (context: string, error: PostgrestError | Error): Error =>
  new Error(`${context}: ${error.message}`);
