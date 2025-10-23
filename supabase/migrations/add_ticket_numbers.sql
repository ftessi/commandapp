-- Migration: Add ticket_number column to orders table and create ticket_counters table
-- Run this in your Supabase SQL Editor

-- Add ticket_number column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(10) UNIQUE;

-- Add updated_at column to orders table (optional, for tracking when orders are modified)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_ticket_number ON orders(ticket_number);

-- Create ticket_counters table
CREATE TABLE IF NOT EXISTS ticket_counters (
  type VARCHAR(10) PRIMARY KEY, -- 'ticket' or 'drink'
  current_number INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial counters
INSERT INTO ticket_counters (type, current_number)
VALUES 
  ('ticket', 0),
  ('drink', 0)
ON CONFLICT (type) DO NOTHING;

-- Grant access to anon users (adjust based on your RLS policies)
GRANT SELECT, UPDATE ON ticket_counters TO anon;
GRANT SELECT, INSERT, UPDATE ON orders TO anon;
