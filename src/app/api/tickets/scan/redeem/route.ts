// API Route: PATCH /api/tickets/scan/redeem - Redeem ticket by session token scan
// This is a convenience endpoint for QR scanning (QR contains session_token)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any | null = null;
try {
    if (supabaseUrl && supabaseKey) supabase = createClient(supabaseUrl, supabaseKey);
    else console.warn('Supabase env missing');
} catch (err) {
    console.warn('Failed to initialize Supabase client for ticket scan redeem route', err);
    supabase = null;
}

export async function PATCH(request: NextRequest) {
    console.log('🔍 PATCH /api/tickets/scan/redeem - Redeeming ticket by session token scan');
    try {
        const body = await request.json();
        const { sessionToken, adminName } = body;

        console.log('📦 Scan redeem request - sessionToken:', sessionToken, 'admin:', adminName);

        if (!sessionToken) {
            return NextResponse.json(
                { error: 'Session token is required' },
                { status: 400 }
            );
        }

        if (!supabase) {
            console.error('❌ Supabase not configured');
            return NextResponse.json(
                { error: 'Database not configured' },
                { status: 500 }
            );
        }

        // Lookup ticket by session token
        // First find the session, then get the ticket
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .select('id')
            .eq('session_token', sessionToken)
            .single();

        if (sessionError || !session) {
            console.error('❌ Session not found for token:', sessionError);
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        const { data: ticket, error: fetchError } = await supabase
            .from('tickets')
            .select(`
                *,
                sessions (
                    session_token,
                    first_name,
                    last_name,
                    email
                )
            `)
            .eq('session_id', session.id)
            .single();

        if (fetchError || !ticket) {
            console.error('❌ Ticket not found for session:', fetchError);
            return NextResponse.json(
                { error: 'Ticket not found' },
                { status: 404 }
            );
        }

        console.log('✅ Ticket found:', ticket.id, 'Status:', ticket.status, 'Entry redeemed:', ticket.entry_redeemed);

        // Check if ticket is paid
        if (ticket.status !== 'paid') {
            console.error('❌ Ticket not paid yet:', ticket.status);
            return NextResponse.json(
                { error: 'Ticket has not been paid yet', ticket },
                { status: 400 }
            );
        }

        // Check if already redeemed for entry
        if (ticket.entry_redeemed) {
            console.error('❌ Ticket already redeemed for entry at:', ticket.entry_redeemed_at);
            return NextResponse.json(
                {
                    error: 'Ticket already used for entry',
                    ticket,
                    redeemedAt: ticket.entry_redeemed_at,
                    redeemedBy: ticket.entry_redeemed_by
                },
                { status: 400 }
            );
        }

        // Redeem the ticket
        const { data: updatedTicket, error: updateError } = await supabase
            .from('tickets')
            .update({
                entry_redeemed: true,
                entry_redeemed_by: adminName || 'admin'
            })
            .eq('id', ticket.id)
            .select(`
                *,
                sessions (
                    session_token,
                    first_name,
                    last_name,
                    email
                )
            `)
            .single();

        if (updateError) {
            console.error('❌ Error redeeming ticket:', updateError);
            return NextResponse.json(
                { error: updateError.message || 'Failed to redeem ticket' },
                { status: 500 }
            );
        }

        console.log('✅ Ticket redeemed for entry:', updatedTicket.id, 'at:', updatedTicket.entry_redeemed_at);
        return NextResponse.json({
            ticket: updatedTicket,
            message: 'Ticket successfully redeemed for entry'
        }, { status: 200 });

    } catch (err: any) {
        console.error('❌ Unexpected error in PATCH /api/tickets/scan/redeem:', err);
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
