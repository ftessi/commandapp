// Next.js API Route: GET /api/orders/[id] (fetch single order), PATCH /api/orders/[id] (update order status)
// Works with anon key if RLS policies are set up

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any | null = null;
try {
  if (supabaseUrl && supabaseKey) supabase = createClient(supabaseUrl, supabaseKey);
  else console.warn('Supabase env missing; orders/[id] route will not reach DB in dev');
} catch (err) {
  console.warn('Failed to initialize Supabase client for orders/[id] route', err);
  supabase = null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured in dev. Start with .env.local or set NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY' }, { status: 500 });
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', id)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message || itemsError },
        { status: 500 }
      );
    }

    return NextResponse.json({ order: orderData, items: itemsData }, { status: 200 });
  } catch (err: any) {
    console.error('Unexpected error in GET /api/orders/:id', err);
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

  console.log('🔄 PATCH /api/orders/[id] - Order ID:', id);

  if (!id) {
    console.error('❌ No order ID provided');
    return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
  }

  try {
    if (!supabase) {
      console.error('❌ Supabase not configured');
      return NextResponse.json({ error: 'Supabase not configured in dev. Start with .env.local or set NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY' }, { status: 500 });
    }

    const body = await request.json();
    console.log('📦 Request body:', body);
    const { status } = body;

    if (!status) {
      console.error('❌ Missing status in body');
      return NextResponse.json({ error: 'Missing status in body' }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['pending', 'paid', 'preparing', 'completed'];
    if (!validStatuses.includes(status)) {
      console.error('❌ Invalid status:', status);
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    console.log('✅ Valid status, updating order to:', status);

    const { data, error } = await supabase
      .from('orders')
      .update({
        status
      })
      .eq('order_id', id)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Supabase error updating order:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: error.message || error },
        { status: 500 }
      );
    }

    console.log('✅ Order updated successfully:', data);
    return NextResponse.json({ order: data }, { status: 200 });
  } catch (err: any) {
    console.error('❌ Unexpected error in PATCH /api/orders/:id', err);
    console.error('❌ Error stack:', err.stack);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
