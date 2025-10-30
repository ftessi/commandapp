-- Create visitors table to track app visitors
-- One entry per unique IP address, with session tracking
CREATE TABLE IF NOT EXISTS visitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT UNIQUE,
    session_token TEXT,
    first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    visit_count INTEGER DEFAULT 1,
    user_agent TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_visitors_last_visit_at ON visitors(last_visit_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_session_token ON visitors(session_token);

-- Enable Row Level Security (RLS)
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts/updates from anyone (for tracking)
CREATE POLICY "Allow public inserts and updates" ON visitors
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add comment
COMMENT ON TABLE visitors IS 'Tracks unique visitor IPs and sessions for the application';

-- Create a view for visitor statistics
-- Excludes Node.js test agents and other bots
CREATE OR REPLACE VIEW visitor_stats AS
SELECT
    COUNT(DISTINCT ip_address) FILTER (
        WHERE ip_address IS NOT NULL 
        AND ip_address != 'Unknown' 
        AND (user_agent IS NULL OR (
            user_agent NOT LIKE '%node-fetch%' 
            AND user_agent NOT LIKE '%Node.js%'
            AND user_agent NOT LIKE '%node/%'
            AND user_agent NOT LIKE '%bot%'
            AND user_agent NOT LIKE '%crawler%'
            AND user_agent NOT LIKE '%spider%'
        ))
    ) as unique_ips,
    COUNT(DISTINCT session_token) FILTER (
        WHERE session_token IS NOT NULL 
        AND (user_agent IS NULL OR (
            user_agent NOT LIKE '%node-fetch%' 
            AND user_agent NOT LIKE '%Node.js%'
            AND user_agent NOT LIKE '%node/%'
            AND user_agent NOT LIKE '%bot%'
            AND user_agent NOT LIKE '%crawler%'
            AND user_agent NOT LIKE '%spider%'
        ))
    ) as unique_sessions,
    COUNT(*) FILTER (
        WHERE user_agent IS NULL OR (
            user_agent NOT LIKE '%node-fetch%' 
            AND user_agent NOT LIKE '%Node.js%'
            AND user_agent NOT LIKE '%node/%'
            AND user_agent NOT LIKE '%bot%'
            AND user_agent NOT LIKE '%crawler%'
            AND user_agent NOT LIKE '%spider%'
        )
    ) as total_records,
    COUNT(*) FILTER (
        WHERE last_visit_at >= CURRENT_DATE 
        AND (user_agent IS NULL OR (
            user_agent NOT LIKE '%node-fetch%' 
            AND user_agent NOT LIKE '%Node.js%'
            AND user_agent NOT LIKE '%node/%'
            AND user_agent NOT LIKE '%bot%'
            AND user_agent NOT LIKE '%crawler%'
            AND user_agent NOT LIKE '%spider%'
        ))
    ) as today_visits,
    COUNT(*) FILTER (
        WHERE last_visit_at >= CURRENT_DATE - INTERVAL '7 days'
        AND (user_agent IS NULL OR (
            user_agent NOT LIKE '%node-fetch%' 
            AND user_agent NOT LIKE '%Node.js%'
            AND user_agent NOT LIKE '%node/%'
            AND user_agent NOT LIKE '%bot%'
            AND user_agent NOT LIKE '%crawler%'
            AND user_agent NOT LIKE '%spider%'
        ))
    ) as week_visits
FROM visitors;
