-- ScribeAI Database Schema
-- Migration: 00001_initial

-- ============================================
-- NOTES TABLE
-- Stores patient consultation notes per user
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT,
  transcript TEXT,
  soap_note TEXT,
  audio_url TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- Tracks Stripe subscription state per user
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT,
  status TEXT,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions (stripe_subscription_id);

-- ============================================
-- ROW LEVEL SECURITY
-- Uses auth.jwt() ->> 'sub' to read the Clerk user ID from the JWT.
-- Note: Clerk is our auth provider (not Supabase Auth), so we read
-- the user ID from the JWT claims rather than using auth.user_id().
-- ============================================

-- Enable RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Notes: SELECT policy
CREATE POLICY select_own_notes ON notes
  FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

-- Notes: INSERT policy
CREATE POLICY insert_own_notes ON notes
  FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Notes: UPDATE policy
CREATE POLICY update_own_notes ON notes
  FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub');

-- Notes: DELETE policy
CREATE POLICY delete_own_notes ON notes
  FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub');

-- Subscriptions: SELECT policy
CREATE POLICY select_own_subscription ON subscriptions
  FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();