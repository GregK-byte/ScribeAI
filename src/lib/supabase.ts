import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Client-side Supabase client.
 * Use `supabase` for user-level queries (RLS enforced via Clerk JWT).
 * 
 * IMPORTANT: Before making authenticated requests, set the Clerk JWT token:
 *   const { getToken } = useAuth();
 *   const token = await getToken({ template: 'supabase' });
 *   supabaseClient.auth.setSession({ access_token: token! });
 * 
 * See https://clerk.com/docs/guides/supabase for the Clerk → Supabase JWT setup.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side Supabase client with service role.
 * Bypasses RLS — use only in API routes and server components
 * where we've already verified the user via Clerk's auth().
 */
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Database types for type-safe queries.
 */
export type Note = {
  id: string;
  user_id: string;
  title: string;
  transcript: string;
  soap_note: string;
  audio_url: string | null;
  status: 'draft' | 'transcribed' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'expired';
  trial_end: string | null;
  created_at: string;
  updated_at: string;
};