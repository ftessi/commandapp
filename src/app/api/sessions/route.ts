// API Route: Session management for user tracking
// POST /api/sessions - Create or get session
// GET /api/sessions/[token] - Get session by token
// PATCH /api/sessions/[token] - Update session last accessed

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any | null = null;
try {
    if (supabaseUrl && supabaseKey) supabase = createClient(supabaseUrl, supabaseKey);
    else console.warn('Supabase env missing for sessions');
} catch (err) {
    console.warn('Failed to initialize Supabase client for sessions route', err);
    supabase = null;
}

// POST - Create new session or get existing one by email
export async function POST(request: NextRequest) {
    console.log('🔐 POST /api/sessions - Creating/retrieving session');
    try {
        const body = await request.json();
        const { firstName, lastName, email, existingToken } = body;

        if (!supabase) {
            console.error('❌ Supabase not configured');
            return NextResponse.json(
                { error: 'Database not configured' },
                { status: 500 }
            );
        }

        // If existingToken provided, validate and return that session
        if (existingToken) {
            console.log('🔍 Validating existing token:', existingToken);
            const { data: session, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('session_token', existingToken)
                .single();

            if (!error && session) {
                console.log('✅ Valid existing session found:', session.id);
                // Update last accessed
                await supabase
                    .from('sessions')
                    .update({ last_accessed_at: new Date().toISOString() })
                    .eq('id', session.id);

                return NextResponse.json({ session }, { status: 200 });
            }
            console.log('⚠️ Invalid token, will create new session');
        }

        // Validate required fields for new session
        if (!firstName || !lastName || !email) {
            console.error('❌ Missing required fields');
            return NextResponse.json(
                { error: 'Missing required fields: firstName, lastName, email' },
                { status: 400 }
            );
        }

        // Check if session exists for this email
        const { data: existingSessions, error: searchError } = await supabase
            .from('sessions')
            .select('*')
            .eq('email', email.toLowerCase())
            .order('created_at', { ascending: false })
            .limit(1);

        if (existingSessions && existingSessions.length > 0) {
            console.log('✅ Existing session found for email:', email);
            const session = existingSessions[0];
            
            // Update last accessed
            await supabase
                .from('sessions')
                .update({ last_accessed_at: new Date().toISOString() })
                .eq('id', session.id);

            return NextResponse.json({ session, existing: true }, { status: 200 });
        }

        // Create new session
        console.log('➕ Creating new session for:', email);
        const { data: newSession, error: createError } = await supabase
            .from('sessions')
            .insert([{
                first_name: firstName,
                last_name: lastName,
                email: email.toLowerCase()
            }])
            .select('*')
            .single();

        if (createError) {
            console.error('❌ Error creating session:', createError);
            return NextResponse.json(
                { error: createError.message || 'Failed to create session' },
                { status: 500 }
            );
        }

        console.log('✅ Session created:', newSession.id, 'Token:', newSession.session_token);
        return NextResponse.json({ session: newSession, existing: false }, { status: 201 });

    } catch (err: any) {
        console.error('❌ Unexpected error in POST /api/sessions:', err);
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET - Retrieve session by token (from query param)
export async function GET(request: NextRequest) {
    console.log('📋 GET /api/sessions - Fetching session');
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Missing session token' },
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

        console.log('🔍 Looking up session by token:', token);
        const { data: session, error } = await supabase
            .from('sessions')
            .select(`
                *,
                orders (*),
                tickets (*)
            `)
            .eq('session_token', token)
            .single();

        if (error || !session) {
            console.error('❌ Session not found:', error);
            return NextResponse.json(
                { error: 'Session not found' },
                { status: 404 }
            );
        }

        console.log('✅ Session found:', session.id);
        
        // Update last accessed
        await supabase
            .from('sessions')
            .update({ last_accessed_at: new Date().toISOString() })
            .eq('id', session.id);

        return NextResponse.json({ session }, { status: 200 });

    } catch (err: any) {
        console.error('❌ Unexpected error in GET /api/sessions:', err);
        return NextResponse.json(
            { error: err.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
