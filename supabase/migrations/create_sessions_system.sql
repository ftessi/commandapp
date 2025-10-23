-- Migration: Create sessions system for user tracking
-- This enables session-based order and ticket tracking without authentication
-- Run this in your Supabase SQL Editor

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_token UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email);

-- Add session_id to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(session_id);

-- Add session_id to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_session ON tickets(session_id);

-- Add entry_redeemed flag for tickets (separate from payment status)
-- This tracks if ticket has been used to ENTER the party
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS entry_redeemed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS entry_redeemed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS entry_redeemed_by VARCHAR(100);

-- Grant access to anon users
GRANT SELECT, INSERT, UPDATE ON sessions TO anon;
GRANT USAGE, SELECT ON SEQUENCE sessions_id_seq TO anon;

-- Function to update last_accessed_at on session access
CREATE OR REPLACE FUNCTION update_session_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_accessed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic last_accessed_at update
DROP TRIGGER IF EXISTS trigger_update_session_access ON sessions;
CREATE TRIGGER trigger_update_session_access
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_last_accessed();

-- Function to update entry_redeemed_at when entry_redeemed changes
CREATE OR REPLACE FUNCTION update_entry_redeemed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.entry_redeemed = true AND (OLD.entry_redeemed IS NULL OR OLD.entry_redeemed = false) THEN
    NEW.entry_redeemed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic entry_redeemed_at timestamp
DROP TRIGGER IF EXISTS trigger_update_entry_redeemed_at ON tickets;
CREATE TRIGGER trigger_update_entry_redeemed_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_entry_redeemed_at();

-- View to get session with all related data (for debugging/admin)
CREATE OR REPLACE VIEW session_details AS
SELECT 
  s.id as session_id,
  s.session_token,
  s.first_name,
  s.last_name,
  s.email,
  s.created_at,
  s.last_accessed_at,
  COUNT(DISTINCT o.order_id) as total_orders,
  COUNT(DISTINCT t.id) as total_tickets,
  SUM(CASE WHEN t.status = 'paid' THEN 1 ELSE 0 END) as paid_tickets,
  SUM(CASE WHEN t.entry_redeemed = true THEN 1 ELSE 0 END) as redeemed_entries
FROM sessions s
LEFT JOIN orders o ON o.session_id = s.id
LEFT JOIN tickets t ON t.session_id = s.id
GROUP BY s.id, s.session_token, s.first_name, s.last_name, s.email, s.created_at, s.last_accessed_at;

GRANT SELECT ON session_details TO anon;

COMMENT ON TABLE sessions IS 'User sessions for tracking orders and tickets without authentication. Session token stored in localStorage.';
COMMENT ON COLUMN sessions.session_token IS 'UUID token stored in user localStorage and QR codes for session identification';
COMMENT ON COLUMN tickets.entry_redeemed IS 'Tracks if ticket has been used to ENTER the party (separate from payment status)';
COMMENT ON COLUMN tickets.qr_code IS 'UUID in QR code - used for entry validation AND session recovery';
