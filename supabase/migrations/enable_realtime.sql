-- Migration: Enable Realtime for all necessary tables
-- This allows instant updates via Supabase Realtime subscriptions

-- Enable realtime for orders table
ALTER publication supabase_realtime ADD TABLE orders;

-- Enable realtime for tickets table
ALTER publication supabase_realtime ADD TABLE tickets;

-- Enable realtime for service_status table
ALTER publication supabase_realtime ADD TABLE service_status;

-- Verify realtime is enabled
-- You can check in Supabase Dashboard > Database > Replication
-- Or query: SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

COMMENT ON TABLE orders IS 'Orders table with realtime updates enabled';
COMMENT ON TABLE tickets IS 'Tickets table with realtime updates enabled';
COMMENT ON TABLE service_status IS 'Service status table with realtime updates enabled';
