// Quick database structure checker
// Run this to verify the orders table has the ticket_number column

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Make sure .env.local has:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL');
    console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log('🔍 Checking database structure...\n');

    // Check orders table
    console.log('1️⃣ Checking orders table...');
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .limit(1);

    if (ordersError) {
        console.error('❌ Error querying orders:', ordersError.message);
    } else {
        console.log('✅ Orders table exists');
        if (orders && orders.length > 0) {
            console.log('📦 Sample order structure:', Object.keys(orders[0]));
            console.log('🎫 Has ticket_number?', 'ticket_number' in orders[0]);
            if ('ticket_number' in orders[0]) {
                console.log('   Ticket Number:', orders[0].ticket_number);
            } else {
                console.error('   ⚠️  WARNING: ticket_number column is MISSING!');
                console.error('   ⚠️  You need to run the migration: supabase/migrations/add_ticket_numbers.sql');
            }
        } else {
            console.log('📦 No orders in table yet');
        }
    }

    // Check ticket_counters table
    console.log('\n2️⃣ Checking ticket_counters table...');
    const { data: counters, error: countersError } = await supabase
        .from('ticket_counters')
        .select('*');

    if (countersError) {
        console.error('❌ Error querying ticket_counters:', countersError.message);
        console.error('   ⚠️  You need to run the migration: supabase/migrations/add_ticket_numbers.sql');
    } else {
        console.log('✅ ticket_counters table exists');
        console.log('📦 Current counters:', counters);
    }

    // Check order_items
    console.log('\n3️⃣ Checking order_items table...');
    const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .limit(1);

    if (itemsError) {
        console.error('❌ Error querying order_items:', itemsError.message);
    } else {
        console.log('✅ order_items table exists');
    }

    // Test permissions
    console.log('\n4️⃣ Testing permissions...');

    // Test UPDATE on ticket_counters
    const { error: updateError } = await supabase
        .from('ticket_counters')
        .upsert({
            type: 'test',
            current_number: 1,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'type'
        });

    if (updateError) {
        console.error('❌ Cannot UPDATE ticket_counters:', updateError.message);
        console.error('   ⚠️  Check RLS policies - anon role needs UPDATE permission');
    } else {
        console.log('✅ Can UPDATE ticket_counters');

        // Clean up test
        await supabase
            .from('ticket_counters')
            .delete()
            .eq('type', 'test');
    }

    console.log('\n✅ Database check complete!\n');
}

checkDatabase().catch(err => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
});
