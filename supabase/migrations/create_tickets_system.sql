-- Migration: Create tickets system tables
-- Run this in your Supabase SQL Editor

-- Create ticket_types table (the products - what tickets are available)
CREATE TABLE IF NOT EXISTS ticket_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tickets table (purchased tickets)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_type_id INTEGER REFERENCES ticket_types(id),
  ticket_type_name VARCHAR(100) NOT NULL, -- Denormalized for history
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, redeemed
  qr_code UUID UNIQUE, -- Generated when marked as paid
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  redeemed_by VARCHAR(100) -- Admin who redeemed it
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email);
CREATE INDEX IF NOT EXISTS idx_tickets_name ON tickets(first_name, last_name);

-- Insert sample ticket types (customize these for your event)
INSERT INTO ticket_types (name, description, price, available)
VALUES 
  ('General Admission', 'Standard entry to the event', 29.99, true),
  ('VIP Pass', 'VIP access with exclusive perks', 79.99, true),
  ('Early Bird', 'Discounted early bird ticket', 19.99, true)
ON CONFLICT DO NOTHING;

-- Grant access to anon users (for public ticket purchase)
GRANT SELECT, INSERT ON ticket_types TO anon;
GRANT SELECT, INSERT, UPDATE ON tickets TO anon;
GRANT USAGE, SELECT ON SEQUENCE ticket_types_id_seq TO anon;

-- Function to generate QR code when ticket is marked as paid
CREATE OR REPLACE FUNCTION generate_qr_code_on_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate QR code if status changed to 'paid' and qr_code is null
  IF NEW.status = 'paid' AND OLD.status != 'paid' AND NEW.qr_code IS NULL THEN
    NEW.qr_code = uuid_generate_v4();
    NEW.paid_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic QR code generation
DROP TRIGGER IF EXISTS trigger_generate_qr_code ON tickets;
CREATE TRIGGER trigger_generate_qr_code
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_qr_code_on_paid();

-- Function to update redeemed_at timestamp
CREATE OR REPLACE FUNCTION update_redeemed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'redeemed' AND OLD.status != 'redeemed' THEN
    NEW.redeemed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic redeemed_at timestamp
DROP TRIGGER IF EXISTS trigger_update_redeemed_at ON tickets;
CREATE TRIGGER trigger_update_redeemed_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_redeemed_at();
