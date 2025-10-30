-- Update visitor_stats view to exclude test agents and bots
-- Run this in Supabase SQL Editor to update the view without recreating the table

DROP VIEW IF EXISTS visitor_stats CASCADE;

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

-- Optional: Clean up test data if you want to remove it completely
-- Uncomment the line below to delete test records (be careful!)
-- DELETE FROM visitors WHERE user_agent LIKE '%node%' OR user_agent LIKE '%Node.js%';

-- Check the updated stats
SELECT * FROM visitor_stats;
