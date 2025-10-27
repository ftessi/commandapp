// Supabase client wrapper for Next.js
// Usage: import { supabase } from '../services/supabaseClient'
// Set environment variables in .env.local (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  // In dev we allow empty strings but warn the developer
  // Don't throw — allows builds but surfaces misconfiguration.
  // You can change to throw if you prefer stricter behavior.
  // eslint-disable-next-line no-console
  console.warn('Supabase: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in environment');
}

// Create Supabase client with realtime configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
