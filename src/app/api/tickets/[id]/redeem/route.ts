// API Route: PATCH /api/tickets/[id]/redeem - Redeem ticket for entry
// This marks a ticket as used for ENTRY (separate from payment status)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any | null = null;
try {
    if (supabaseUrl && supabaseKey) supabase = createClient(supabaseUrl, supabaseKey);
    else console.warn('Supabase env missing');
} catch (err) {
    console.warn('Failed to initialize Supabase client for ticket redeem route', err);
    supabase = null;
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log('🎟️ PATCH /api/tickets/[id]/redeem - Redeeming ticket');
    try {
        const ticketId = params.id;
        const body = await request.json();
        const { adminName, sessionToken } = body;

        console.log('📦 Redeem request - ticketId:', ticketId, 'sessionToken:', sessionToken, 'admin:', adminName);

        if (!supabase) {
            console.error('❌ Supabase not configured');
            return NextResponse.json(
                { error: 'Database not configured' },
                { status: 500 }
            );
        }

        // Lookup ticket by ID or session token
        let query = supabase.from('tickets').select(`
            *,
            sessions (
                session_token,
                first_name,
                last_name,
                email
            )
        `);

        if (sessionToken) {
            // Find session first, then get ticket
            const { data: session } = await supabase
                .from('sessions')
                .select('id')
                .eq('session_token', sessionToken)
                .single();

            if (session) {
                query = query.eq('session_id', session.id);
            }
        } else {
            query = query.eq('id', ticketId);
        }

        const { data: ticket, error: fetchError } = await query.single();

        if (fetchError || !ticket) {
            console.error('❌ Ticket not found:', fetchError);
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
        console.error('❌ Unexpected error in PATCH /api/tickets/[id]/redeem:', err);
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
