-- Migration: Add ticket_number column to tickets table
-- This adds TI-XXX format ticket numbers to tickets (separate from orders DR-XXXX)

-- First, drop the column if it exists with wrong size
ALTER TABLE tickets DROP COLUMN IF EXISTS ticket_number;

-- Add ticket_number column to tickets table with proper size
ALTER TABLE tickets 
ADD COLUMN ticket_number VARCHAR(20) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);

-- Add 'ticket_entry' counter type if not exists (separate from 'ticket' for orders)
-- Ensure the ticket_counters.type column can hold longer type names (e.g. 'ticket_entry')
ALTER TABLE IF EXISTS ticket_counters
  ALTER COLUMN type TYPE VARCHAR(50);

-- Add 'ticket_entry' counter type if not exists (separate from 'ticket' for orders)
INSERT INTO ticket_counters (type, current_number)
VALUES ('ticket_entry', 0)
ON CONFLICT (type) DO NOTHING;

-- Grant access
GRANT SELECT, UPDATE ON ticket_counters TO anon;

-- Function to generate ticket number for new tickets
CREATE OR REPLACE FUNCTION generate_ticket_entry_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_ticket_number VARCHAR(20);
BEGIN
  -- Only generate if ticket_number is NULL
  IF NEW.ticket_number IS NULL THEN
    -- Get next number and increment counter atomically
    UPDATE ticket_counters 
    SET current_number = current_number + 1,
        updated_at = NOW()
    WHERE type = 'ticket_entry'
    RETURNING current_number INTO next_number;
    
    -- Generate ticket number in TI-XXX format (3 digits, zero-padded)
    new_ticket_number := 'TI-' || LPAD(next_number::TEXT, 3, '0');
    
    -- Assign to new ticket
    NEW.ticket_number := new_ticket_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket numbers
DROP TRIGGER IF EXISTS trigger_generate_ticket_entry_number ON tickets;
CREATE TRIGGER trigger_generate_ticket_entry_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_entry_number();

COMMENT ON COLUMN tickets.ticket_number IS 'Unique ticket number in TI-XXX format for entry control';
