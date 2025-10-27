-- Migration: Clean up old test tickets and verify ticket types
-- Run this to see what data exists and optionally clean it up

-- 1. Check existing tickets
SELECT 
    id,
    ticket_type_name,
    first_name,
    last_name,
    email,
    status,
    created_at
FROM tickets
ORDER BY created_at DESC
LIMIT 20;

-- 2. Check existing ticket types (these should be the product offerings)
SELECT 
    id,
    name,
    description,
    price,
    available,
    created_at
FROM ticket_types
ORDER BY id;

-- 3. If you want to delete ALL test tickets (BE CAREFUL - THIS DELETES ALL TICKETS):
-- Uncomment the following line to delete all tickets:
-- DELETE FROM tickets;

-- 4. If you want to delete only old/test tickets (example: before a certain date):
-- DELETE FROM tickets WHERE created_at < '2025-10-27';

-- 5. If you want to delete specific tickets by email pattern (example: test emails):
-- DELETE FROM tickets WHERE email LIKE '%test%' OR email LIKE '%example%';

-- 6. Verify ticket types exist and are available
SELECT 
    name,
    price,
    available,
    CASE 
        WHEN available THEN '✅ Available for purchase'
        ELSE '❌ Not available'
    END as status
FROM ticket_types;

-- 7. If ticket types are missing, insert sample types:
-- INSERT INTO ticket_types (name, description, price, available)
-- VALUES 
--     ('General Admission', 'Standard entry to the event', 29.99, true),
--     ('VIP Pass', 'VIP access with exclusive perks', 79.99, true),
--     ('Early Bird', 'Discounted early bird ticket', 19.99, true)
-- ON CONFLICT DO NOTHING;
