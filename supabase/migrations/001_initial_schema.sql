-- ScribeAI Database Schema
-- Migration 001: Initial schema

-- ============================================
-- Enable UUID generation
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- NOTES TABLE
-- Stores patient consultation notes per user
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  transcript TEXT NOT NULL DEFAULT '',
  soap_note TEXT NOT NULL DEFAULT '',
  audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'transcribed', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on user_id for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes (user_id);

-- Index on created_at for chronological listing
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes (created_at DESC);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_notes_status ON notes (status);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- Tracks Stripe subscription state per user
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'expired')),
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions (user_id);

-- Index on stripe_subscription_id for webhook lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions (stripe_subscription_id);

-- ============================================
-- ROW LEVEL SECURITY
-- Uses auth.jwt() to read Clerk JWT claims.
-- Clerk's JWT has user ID in the 'sub' claim.
-- ============================================

-- Enable RLS on notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Users can SELECT only their own notes
-- auth.jwt() ->> 'sub' returns the Clerk user ID from the JWT
CREATE POLICY select_own_notes ON notes
  FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

-- Users can INSERT their own notes
CREATE POLICY insert_own_notes ON notes
  FOR INSERT
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Users can UPDATE only their own notes
CREATE POLICY update_own_notes ON notes
  FOR UPDATE
  USING (user_id = auth.jwt() ->> 'sub');

-- Users can DELETE only their own notes
CREATE POLICY delete_own_notes ON notes
  FOR DELETE
  USING (user_id = auth.jwt() ->> 'sub');

-- Enable RLS on subscriptions table
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own subscription
CREATE POLICY select_own_subscription ON subscriptions
  FOR SELECT
  USING (user_id = auth.jwt() ->> 'sub');

-- Service role (admin) can manage all subscriptions
CREATE POLICY service_role_all_subscriptions ON subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- HELPER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update notes.updated_at
DROP TRIGGER IF EXISTS set_notes_updated_at ON notes;
CREATE TRIGGER set_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update subscriptions.updated_at
DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();