import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/services/supabaseClient';

// GET - Retrieve visitor statistics
export async function GET(request: NextRequest) {
    try {
        // Use the view for statistics
        const { data, error } = await supabase
            .from('visitor_stats')
            .select('*')
            .single();

        if (error) {
            console.error('Error fetching visitor stats:', error);
            return NextResponse.json(
                { error: 'Failed to fetch visitor stats' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                uniqueIPs: data?.unique_ips || 0,
                uniqueSessions: data?.unique_sessions || 0,
                todayVisits: data?.today_visits || 0,
                weekVisits: data?.week_visits || 0,
            },
        });
    } catch (error) {
        console.error('Error in GET /api/visitors:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Track a new visitor (upsert by IP, fallback to session)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const sessionToken = body.sessionToken || null;

        const userAgent = request.headers.get('user-agent') || 'Unknown';

        // Try to get IP from various headers
        let ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            request.headers.get('cf-connecting-ip') ||
            null;

        // If x-forwarded-for has multiple IPs, take the first one
        if (ipAddress && ipAddress.includes(',')) {
            ipAddress = ipAddress.split(',')[0].trim();
        }

        // Normalize 'Unknown' to null for better handling
        if (ipAddress === 'Unknown' || ipAddress === '') {
            ipAddress = null;
        }

        console.log('👁️ Tracking visitor - IP:', ipAddress, 'Session:', sessionToken);

        // Strategy: Try to upsert by IP first, then fall back to session
        if (ipAddress) {
            // Check if this IP exists
            const { data: existingVisitor, error: fetchError } = await supabase
                .from('visitors')
                .select('*')
                .eq('ip_address', ipAddress)
                .single();

            if (existingVisitor) {
                // Update existing IP record
                const { error: updateError } = await supabase
                    .from('visitors')
                    .update({
                        last_visit_at: new Date().toISOString(),
                        visit_count: (existingVisitor.visit_count || 0) + 1,
                        session_token: sessionToken || existingVisitor.session_token,
                        user_agent: userAgent,
                    })
                    .eq('ip_address', ipAddress);

                if (updateError) {
                    console.error('Error updating visitor:', updateError);
                    return NextResponse.json(
                        { error: 'Failed to update visitor' },
                        { status: 500 }
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: 'Visitor updated',
                    type: 'update',
                });
            } else {
                // Insert new IP record
                const { error: insertError } = await supabase
                    .from('visitors')
                    .insert([{
                        ip_address: ipAddress,
                        session_token: sessionToken,
                        user_agent: userAgent,
                    }]);

                if (insertError) {
                    console.error('Error inserting visitor:', insertError);
                    return NextResponse.json(
                        { error: 'Failed to track visitor' },
                        { status: 500 }
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: 'New visitor tracked',
                    type: 'insert',
                });
            }
        } else if (sessionToken) {
            // Fallback: No IP available, use session token
            const { data: existingSession, error: fetchError } = await supabase
                .from('visitors')
                .select('*')
                .eq('session_token', sessionToken)
                .is('ip_address', null)
                .single();

            if (existingSession) {
                // Update existing session record
                const { error: updateError } = await supabase
                    .from('visitors')
                    .update({
                        last_visit_at: new Date().toISOString(),
                        visit_count: (existingSession.visit_count || 0) + 1,
                        user_agent: userAgent,
                    })
                    .eq('session_token', sessionToken)
                    .is('ip_address', null);

                if (updateError) {
                    console.error('Error updating session visitor:', updateError);
                    return NextResponse.json(
                        { error: 'Failed to update visitor' },
                        { status: 500 }
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: 'Session visitor updated',
                    type: 'update',
                });
            } else {
                // Insert new session-only record
                const { error: insertError } = await supabase
                    .from('visitors')
                    .insert([{
                        ip_address: null,
                        session_token: sessionToken,
                        user_agent: userAgent,
                    }]);

                if (insertError) {
                    console.error('Error inserting session visitor:', insertError);
                    return NextResponse.json(
                        { error: 'Failed to track visitor' },
                        { status: 500 }
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: 'New session visitor tracked',
                    type: 'insert',
                });
            }
        } else {
            // No IP and no session - create anonymous record
            const { error: insertError } = await supabase
                .from('visitors')
                .insert([{
                    ip_address: null,
                    session_token: null,
                    user_agent: userAgent,
                }]);

            if (insertError) {
                console.error('Error inserting anonymous visitor:', insertError);
                return NextResponse.json(
                    { error: 'Failed to track visitor' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Anonymous visitor tracked',
                type: 'insert',
            });
        }
    } catch (error) {
        console.error('Error in POST /api/visitors:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
