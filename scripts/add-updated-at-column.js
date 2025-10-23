// Quick fix script to add updated_at column to orders table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addUpdatedAtColumn() {
    console.log('🔧 Adding updated_at column to orders table...\n');

    // Note: This won't work with anon key due to permissions
    // You need to run the SQL directly in Supabase SQL Editor

    console.log('⚠️  This script cannot add columns with the anon key.');
    console.log('⚠️  You need to run the SQL migration manually.\n');
    console.log('📋 Follow these steps:\n');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Create a new query');
    console.log('3. Copy and paste the following SQL:\n');
    console.log('----------------------------------------');
    console.log(`
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  `);
    console.log('----------------------------------------\n');
    console.log('4. Click "Run" or press Ctrl+Enter');
    console.log('5. You should see "Success. No rows returned"\n');
    console.log('✅ After that, the "Mark as Paid" button will work!\n');
}

addUpdatedAtColumn().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
