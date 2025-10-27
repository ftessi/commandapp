// API Route: GET /api/ticket-types (get available ticket types)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any | null = null;
try {
    if (supabaseUrl && supabaseKey) supabase = createClient(supabaseUrl, supabaseKey);
    else console.warn('Supabase env missing');
} catch (err) {
    console.warn('Failed to initialize Supabase client for ticket-types route', err);
    supabase = null;
}

export async function GET(request: NextRequest) {
    console.log('📋 GET /api/ticket-types - Fetching ticket types');
    try {
        if (!supabase) {
            console.warn('⚠️ Supabase not configured');
            return NextResponse.json({ ticketTypes: [] }, { status: 200 });
        }

        const { searchParams } = new URL(request.url);
        const availableOnly = searchParams.get('available') !== 'false'; // Default to true

        let query = supabase
            .from('ticket_types')
            .select('*')
            .order('price', { ascending: true });

        if (availableOnly) {
            query = query.eq('available', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ Error fetching ticket types:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        console.log(`✅ Found ${data?.length || 0} ticket types`);
        return NextResponse.json({ ticketTypes: data || [] }, { status: 200 });

    } catch (err: any) {
        console.error('❌ Unexpected error in GET /api/ticket-types:', err);
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
