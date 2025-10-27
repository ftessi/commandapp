// Next.js API Route: POST /api/orders (create order), GET /api/orders (list all orders with filters)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateTicketNumber, getTicketType } from '@/utils/ticketNumberGenerator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any | null = null;
try {
  if (supabaseUrl && supabaseKey) supabase = createClient(supabaseUrl, supabaseKey);
  else console.warn('Supabase env missing; POST /api/orders will not persist to DB in dev');
} catch (err) {
  console.warn('Failed to initialize Supabase client for orders route', err);
  supabase = null;
}

export async function POST(request: NextRequest) {
  console.log('📝 POST /api/orders - Creating new order');
  try {
    const body = await request.json();
    console.log('📦 Request body:', body);
    const { total, items, sessionToken } = body;

    if (!total || !items || !Array.isArray(items) || items.length === 0) {
      console.error('❌ Invalid order payload');
      return NextResponse.json(
        { error: 'Invalid order payload. Provide total and items array.' },
        { status: 400 }
      );
    }

    if (!supabase) {
      console.warn('⚠️ Supabase not configured, using fake data');
      const fakeOrder = {
        order_id: `dev_${Date.now()}`,
        ticket_number: 'TI-001',
        total,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      const fakeItems = items.map((it: any, idx: number) => ({
        id: idx + 1,
        order_id: fakeOrder.order_id,
        product_id: it.productId || null,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        subtotal: Number((it.price * it.quantity).toFixed(2))
      }));
      return NextResponse.json({ order: fakeOrder, items: fakeItems }, { status: 201 });
    }

    // Get or validate session
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
      } else {
        console.warn('⚠️ Invalid session token provided');
      }
    }

    // Determine ticket type based on products
    const productIds = items.map((it: any) => it.productId);
    console.log('🎫 Product IDs:', productIds);
    const ticketType = getTicketType(productIds);
    console.log('🎫 Ticket type:', ticketType);
    const ticketNumber = await generateTicketNumber(ticketType);
    console.log('🎫 Generated ticket number:', ticketNumber);

    // Insert order with ticket number and session
    const orderData: any = {
      total,
      status: 'pending',
      ticket_number: ticketNumber
    };

    if (sessionId) {
      orderData.session_id = sessionId;
      console.log('🔗 Linking order to session:', sessionId);
    }

    const { data: orderDataResult, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select('*')
      .single();

    if (orderError) {
      console.error('❌ Error inserting order:', orderError);
      return NextResponse.json(
        { error: orderError.message || orderError },
        { status: 500 }
      );
    }

    console.log('✅ Order created:', orderDataResult);
    const orderId = orderDataResult.order_id;

    // Prepare items for bulk insert
    const itemsToInsert = items.map((it: any) => ({
      order_id: orderId,
      product_id: it.productId || null,
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      subtotal: Number((it.price * it.quantity).toFixed(2))
    }));

    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)
      .select('*');

    if (itemsError) {
      console.error('❌ Error inserting order_items:', itemsError);
      return NextResponse.json(
        { error: itemsError.message || itemsError },
        { status: 500 }
      );
    }

    console.log('✅ Order items created:', itemsData);
    console.log('✅ Complete order response:', { order: orderData, items: itemsData });
    return NextResponse.json(
      { order: orderData, items: itemsData },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('❌ Unexpected error in POST /api/orders:', err);
    console.error('❌ Error stack:', err.stack);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log('📋 GET /api/orders - Fetching orders');
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const ticketNumber = searchParams.get('ticketNumber');
    const sessionToken = searchParams.get('sessionToken');
    const limit = parseInt(searchParams.get('limit') || '100');

    console.log('🔍 Query params - status:', status, 'ticketNumber:', ticketNumber, 'sessionToken:', sessionToken, 'limit:', limit);

    if (!supabase) {
      console.warn('⚠️ Supabase not configured');
      return NextResponse.json({ orders: [] }, { status: 200 });
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
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
        console.log('✅ Filtering orders for session:', session.id);
      } else {
        console.warn('⚠️ Invalid session token, no orders will match');
        return NextResponse.json({ orders: [] }, { status: 200 });
      }
    }

    // Apply other filters
    if (status) {
      query = query.eq('status', status);
    }

    if (ticketNumber) {
      query = query.ilike('ticket_number', `%${ticketNumber}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching orders:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${data?.length || 0} orders`);
    console.log('📦 Sample order:', data?.[0]);
    return NextResponse.json({ orders: data || [] }, { status: 200 });
  } catch (err: any) {
    console.error('❌ Unexpected error in GET /api/orders:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
