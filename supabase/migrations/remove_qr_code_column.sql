-- Migration: Remove qr_code column from tickets table
-- We use session_token from sessions table for all QR code functionality
-- The qr_code column is redundant and unused

-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_generate_qr_code ON tickets;

-- Drop the function
DROP FUNCTION IF EXISTS generate_qr_code_on_paid();

-- Drop the index
DROP INDEX IF EXISTS idx_tickets_qr_code;

-- Drop the column
ALTER TABLE tickets DROP COLUMN IF EXISTS qr_code;

COMMENT ON TABLE tickets IS 'Event tickets - uses session_token from sessions table for QR codes and identification';
