import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Safely create a Supabase client, returning null if env vars are missing.
 */
function safeCreateClient(url: string, key: string, opts?: Record<string, any>): SupabaseClient | null {
  if (!url || !key) return null;
  return createClient(url, key, opts as any);
}

/**
 * Returns the client-side Supabase client (anon key, RLS enforced via Clerk JWT).
 *
 * Browser usage — pass the Clerk JWT before querying:
 *   const { getToken } = useAuth();
 *   const token = await getToken({ template: 'supabase' });
 *   const supabase = getSupabase();
 *   supabase.auth.setSession({ access_token: token! });
 */
export function getSupabase(): SupabaseClient | null {
  return safeCreateClient(supabaseUrl, supabaseAnonKey);
}

/** Singleton browser client */
let _supabase: SupabaseClient | null | undefined;
export function getSupabaseSingleton(): SupabaseClient | null {
  if (_supabase === undefined) _supabase = getSupabase();
  return _supabase;
}

export const supabase = getSupabaseSingleton();

/**
 * Server-side Supabase admin client with service role (bypasses RLS).
 * Use in API routes / server components where Clerk auth() has verified the user.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  return safeCreateClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Singleton admin client */
let _supabaseAdmin: SupabaseClient | null | undefined;
export function getSupabaseAdminSingleton(): SupabaseClient | null {
  if (_supabaseAdmin === undefined) _supabaseAdmin = getSupabaseAdmin();
  return _supabaseAdmin;
}

export const supabaseAdmin = getSupabaseAdminSingleton();

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && serviceKey);
}

// ----- Type definitions -----

export type Note = {
  id: string;
  user_id: string;
  title: string | null;
  transcript: string | null;
  soap_note: string | null;
  audio_url: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  status: string | null;
  trial_end: string | null;
  created_at: string;
};