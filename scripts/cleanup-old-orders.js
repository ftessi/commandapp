// Clean up old orders without ticket numbers
// This will delete all orders that don't have ticket numbers (created before migration)

const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function cleanupOldOrders() {
  console.log('🗑️  Cleanup Old Orders Without Ticket Numbers\n');

  // Find orders without ticket numbers
  const { data: oldOrders, error: fetchError } = await supabase
    .from('orders')
    .select('order_id, total, status, created_at')
    .is('ticket_number', null);

  if (fetchError) {
    console.error('❌ Error fetching orders:', fetchError.message);
    process.exit(1);
  }

  if (!oldOrders || oldOrders.length === 0) {
    console.log('✅ No old orders found! All orders have ticket numbers.');
    rl.close();
    return;
  }

  console.log(`⚠️  Found ${oldOrders.length} orders without ticket numbers:\n`);
  oldOrders.forEach((order, idx) => {
    console.log(`${idx + 1}. Order ID: ${order.order_id.substring(0, 8)}...`);
    console.log(`   Total: €${order.total}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
    console.log('');
  });

  const answer = await question('Do you want to DELETE these orders? (yes/no): ');

  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Cancelled. No orders were deleted.');
    rl.close();
    return;
  }

  console.log('\n🗑️  Deleting orders...\n');

  // Delete order items first (foreign key constraint)
  const orderIds = oldOrders.map(o => o.order_id);
  
  console.log('1️⃣ Deleting order items...');
  const { error: itemsError } = await supabase
    .from('order_items')
    .delete()
    .in('order_id', orderIds);

  if (itemsError) {
    console.error('❌ Error deleting order items:', itemsError.message);
    rl.close();
    return;
  }
  console.log('✅ Order items deleted');

  // Delete orders
  console.log('2️⃣ Deleting orders...');
  const { error: ordersError } = await supabase
    .from('orders')
    .delete()
    .in('order_id', orderIds);

  if (ordersError) {
    console.error('❌ Error deleting orders:', ordersError.message);
    rl.close();
    return;
  }

  console.log('✅ Orders deleted');
  console.log(`\n✅ Successfully deleted ${oldOrders.length} old orders!`);
  console.log('\n🎯 Now place new orders and they will have ticket numbers (TI-XXX or DR-XXXX)\n');

  rl.close();
}

cleanupOldOrders().catch(err => {
  console.error('❌ Unexpected error:', err);
  rl.close();
  process.exit(1);
});
