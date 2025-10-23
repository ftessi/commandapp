// API Route: POST /api/tickets (create ticket), GET /api/tickets (list tickets)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any | null = null;
try {
    if (supabaseUrl && supabaseKey) supabase = createClient(supabaseUrl, supabaseKey);
    else console.warn('Supabase env missing');
} catch (err) {
    console.warn('Failed to initialize Supabase client for tickets route', err);
    supabase = null;
}

export async function POST(request: NextRequest) {
    console.log('🎫 POST /api/tickets - Creating new ticket');
    try {
        const body = await request.json();
        console.log('📦 Request body:', body);
        const { ticketTypeId, firstName, lastName, email, sessionToken } = body;

        if (!ticketTypeId || !firstName || !lastName || !email) {
            console.error('❌ Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields: ticketTypeId, firstName, lastName, email' },
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

        // Get or create session
        let sessionId = null;
        if (sessionToken) {
            console.log('🔍 Looking up session by token:', sessionToken);
            const { data: session } = await supabase
                .from('sessions')
                .select('id')
                .eq('session_token', sessionToken)
                .single();
            
            if (session) {
                sessionId = session.id;
                console.log('✅ Found existing session:', sessionId);
            }
        }

        if (!sessionId) {
            console.log('➕ Creating new session for ticket purchase');
            const { data: newSession, error: sessionError } = await supabase
                .from('sessions')
                .insert([{
                    first_name: firstName,
                    last_name: lastName,
                    email: email.toLowerCase()
                }])
                .select('*')
                .single();

            if (sessionError) {
                console.error('❌ Error creating session:', sessionError);
                return NextResponse.json(
                    { error: 'Failed to create session' },
                    { status: 500 }
                );
            }
            
            sessionId = newSession.id;
            console.log('✅ Created session:', sessionId, 'Token:', newSession.session_token);
        }

        // Get ticket type details
        const { data: ticketType, error: ticketTypeError } = await supabase
            .from('ticket_types')
            .select('*')
            .eq('id', ticketTypeId)
            .eq('available', true)
            .single();

        if (ticketTypeError || !ticketType) {
            console.error('❌ Ticket type not found or not available:', ticketTypeError);
            return NextResponse.json(
                { error: 'Ticket type not found or not available' },
                { status: 404 }
            );
        }

        console.log('✅ Ticket type found:', ticketType.name, '- Price:', ticketType.price);

        // Create ticket with session
        const { data: ticket, error: ticketError } = await supabase
            .from('tickets')
            .insert([{
                ticket_type_id: ticketTypeId,
                ticket_type_name: ticketType.name,
                first_name: firstName,
                last_name: lastName,
                email: email.toLowerCase(),
                status: 'pending',
                price: ticketType.price,
                session_id: sessionId
            }])
            .select('*')
            .single();

        if (ticketError) {
            console.error('❌ Error creating ticket:', ticketError);
            return NextResponse.json(
                { error: ticketError.message || 'Failed to create ticket' },
                { status: 500 }
            );
        }

        console.log('✅ Ticket created:', ticket.id, 'linked to session:', sessionId);
        
        // Get session token to return to client
        const { data: session } = await supabase
            .from('sessions')
            .select('session_token')
            .eq('id', sessionId)
            .single();

        return NextResponse.json({ 
            ticket, 
            sessionToken: session?.session_token 
        }, { status: 201 });

    } catch (err: any) {
        console.error('❌ Unexpected error in POST /api/tickets:', err);
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    console.log('📋 GET /api/tickets - Fetching tickets');
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search'); // Search by name or email
        const qrCode = searchParams.get('qrCode');
        const sessionToken = searchParams.get('sessionToken');
        const limit = parseInt(searchParams.get('limit') || '100');

        console.log('🔍 Query params - status:', status, 'search:', search, 'qrCode:', qrCode, 'sessionToken:', sessionToken, 'limit:', limit);

        if (!supabase) {
            console.warn('⚠️ Supabase not configured');
            return NextResponse.json({ tickets: [] }, { status: 200 });
        }

        let query = supabase
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
            .order('created_at', { ascending: false })
            .limit(limit);

        // Filter by session token if provided
        if (sessionToken) {
            console.log('🔍 Filtering by session token');
            const { data: session } = await supabase
                .from('sessions')
                .select('id')
                .eq('session_token', sessionToken)
                .single();
            
            if (session) {
                query = query.eq('session_id', session.id);
                console.log('✅ Filtering tickets for session:', session.id);
            } else {
                console.warn('⚠️ Invalid session token, no tickets will match');
                return NextResponse.json({ tickets: [] }, { status: 200 });
            }
        }

        // Apply other filters
        if (status) {
            query = query.eq('status', status);
        }

        if (qrCode) {
            query = query.eq('qr_code', qrCode);
        }

        if (search) {
            // Search in first_name, last_name, or email
            query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('❌ Error fetching tickets:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        console.log(`✅ Found ${data?.length || 0} tickets`);
        return NextResponse.json({ tickets: data || [] }, { status: 200 });

    } catch (err: any) {
        console.error('❌ Unexpected error in GET /api/tickets:', err);
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
