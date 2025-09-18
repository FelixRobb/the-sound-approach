import { createClient } from "@supabase/supabase-js";

// Admin client with service role key for full database access
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase admin configuration");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Admin password verification
export function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  return adminPassword === password;
}

// Admin session management
export const ADMIN_SESSION_COOKIE = "admin-session";
export const ADMIN_SESSION_DURATION = 60 * 60 * 1000; // 1 hour

export function generateAdminSession(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function isValidAdminSession(sessionToken: string, timestamp: number): boolean {
  const now = Date.now();
  return now - timestamp < ADMIN_SESSION_DURATION;
}
