// Next.js API Route: POST /api/orders/cashier
// Special endpoint for cashier orders that bypass the normal order flow
// Orders are immediately marked as 'completed' status

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateTicketNumber, getTicketType } from '@/utils/ticketNumberGenerator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any | null = null;
try {
  if (supabaseUrl && supabaseKey) supabase = createClient(supabaseUrl, supabaseKey);
  else console.warn('Supabase env missing; POST /api/orders/cashier will not persist to DB');
} catch (err) {
  console.warn('Failed to initialize Supabase client for cashier orders route', err);
  supabase = null;
}

export async function POST(request: NextRequest) {
  console.log('💰 POST /api/orders/cashier - Creating cashier order (auto-completed)');
  try {
    const body = await request.json();
    console.log('📦 Cashier order request:', body);
    const { total, items } = body;

    if (!total || !items || !Array.isArray(items) || items.length === 0) {
      console.error('❌ Invalid cashier order payload');
      return NextResponse.json(
        { error: 'Invalid order payload. Provide total and items array.' },
        { status: 400 }
      );
    }

    if (!supabase) {
      console.warn('⚠️ Supabase not configured, using fake data');
      const fakeOrder = {
        order_id: `cashier_${Date.now()}`,
        ticket_number: 'CA-001',
        total,
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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

    // Determine ticket type based on products
    const productIds = items.map((it: any) => it.productId);
    console.log('🎫 Product IDs:', productIds);
    const ticketType = getTicketType(productIds);
    console.log('🎫 Ticket type:', ticketType);
    const ticketNumber = await generateTicketNumber(ticketType);
    console.log('🎫 Generated ticket number:', ticketNumber);

    // Insert order with 'completed' status (skip pending, payment, preparing stages)
    const orderData = {
      total,
      status: 'completed', // Cashier orders are instantly completed
      ticket_number: ticketNumber
    };

    const { data: orderDataResult, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select('*')
      .single();

    if (orderError) {
      console.error('❌ Error inserting cashier order:', orderError);
      return NextResponse.json(
        { error: orderError.message || orderError },
        { status: 500 }
      );
    }

    console.log('✅ Cashier order created:', orderDataResult);
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
      console.error('❌ Error inserting cashier order items:', itemsError);
      return NextResponse.json(
        { error: itemsError.message || itemsError },
        { status: 500 }
      );
    }

    console.log('✅ Cashier order items created:', itemsData);
    console.log('✅ Complete cashier order response:', { order: orderDataResult, items: itemsData });
    
    return NextResponse.json(
      { 
        order: orderDataResult, 
        items: itemsData,
        message: 'Cashier order completed successfully'
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('❌ Unexpected error in POST /api/orders/cashier:', err);
    console.error('❌ Error stack:', err.stack);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
