// API Route: GET /api/tickets/[id] (get single ticket), PATCH /api/tickets/[id] (update status)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateSessionQR } from '@/services/qrService';
import { sendTicketEmail } from '@/services/emailService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any | null = null;
try {
    if (supabaseUrl && supabaseKey) supabase = createClient(supabaseUrl, supabaseKey);
    else console.warn('Supabase env missing');
} catch (err) {
    console.warn('Failed to initialize Supabase client for tickets/[id] route', err);
    supabase = null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    console.log('🎫 GET /api/tickets/[id] - Ticket ID:', id);

    if (!id) {
        return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    try {
        if (!supabase) {
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        const { data: ticket, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !ticket) {
            console.error('❌ Ticket not found:', error);
            return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
        }

        console.log('✅ Ticket found:', ticket.id, '- Status:', ticket.status);
        return NextResponse.json({ ticket }, { status: 200 });

    } catch (err: any) {
        console.error('❌ Unexpected error in GET /api/tickets/:id', err);
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    console.log('🔄 PATCH /api/tickets/[id] - Ticket ID:', id);

    if (!id) {
        console.error('❌ No ticket ID provided');
        return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    try {
        if (!supabase) {
            console.error('❌ Supabase not configured');
            return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
        }

        const body = await request.json();
        console.log('📦 Request body:', body);
        const { status, redeemedBy } = body;

        if (!status) {
            console.error('❌ Missing status in body');
            return NextResponse.json({ error: 'Missing status in body' }, { status: 400 });
        }

        // Validate status
        const validStatuses = ['pending', 'paid', 'redeemed'];
        if (!validStatuses.includes(status)) {
            console.error('❌ Invalid status:', status);
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
                { status: 400 }
            );
        }

        console.log('✅ Valid status, updating ticket to:', status);

        // Prepare update data
        const updateData: any = { status };

        if (status === 'redeemed' && redeemedBy) {
            updateData.redeemed_by = redeemedBy;
        }

        const { data, error } = await supabase
            .from('tickets')
            .update(updateData)
            .eq('id', id)
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

        if (error) {
            console.error('❌ Supabase error updating ticket:', error);
            console.error('❌ Error details:', JSON.stringify(error, null, 2));
            return NextResponse.json(
                { error: error.message || error },
                { status: 500 }
            );
        }

        console.log('✅ Ticket updated successfully:', data);

        // If marked as paid, send email with QR code (QR uses session_token)
        if (status === 'paid' && data.sessions) {
            console.log('📧 Ticket marked as paid, generating QR and sending email...');

            try {
                const sessionToken = data.sessions.session_token;

                // Generate QR code
                const qrCodeDataUrl = await generateSessionQR(sessionToken);
                console.log('✅ QR code generated');

                // Send email
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
                const emailSent = await sendTicketEmail({
                    to: data.sessions.email,
                    firstName: data.sessions.first_name,
                    lastName: data.sessions.last_name,
                    ticketType: data.ticket_type_name,
                    price: data.price,
                    qrCodeDataUrl,
                    sessionToken,
                    appUrl
                });

                if (emailSent) {
                    console.log('✅ Email sent successfully');
                } else {
                    console.warn('⚠️ Email not sent (API key may not be configured)');
                }
            } catch (emailError) {
                console.error('❌ Error generating QR or sending email:', emailError);
                // Don't fail the request, just log the error
            }
        }

        return NextResponse.json({ ticket: data }, { status: 200 });

    } catch (err: any) {
        console.error('❌ Unexpected error in PATCH /api/tickets/:id', err);
        console.error('❌ Error stack:', err.stack);
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
