/**
 * Clean up test visitor data from database
 * This removes all visitors created by Node.js/test agents
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupTestVisitors() {
    console.log('🧹 Cleaning up test visitor data...\n');

    try {
        // First, show current stats
        console.log('📊 Current stats (including test data):');
        const { data: beforeStats } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true });
        console.log(`   Total records: ${beforeStats || 0}\n`);

        // Delete test visitors (Node.js user agents)
        const { data, error } = await supabase
            .from('visitors')
            .delete()
            .or('user_agent.ilike.%node%,user_agent.ilike.%Node.js%,user_agent.ilike.%node-fetch%');

        if (error) {
            console.error('❌ Error deleting test visitors:', error);
            return;
        }

        console.log('✅ Test visitor data cleaned up!\n');

        // Show updated stats
        console.log('📊 Updated stats (after cleanup):');
        const { count: afterCount } = await supabase
            .from('visitors')
            .select('*', { count: 'exact', head: true });
        console.log(`   Total records: ${afterCount || 0}\n`);

        // Show real visitor stats from view
        const { data: stats, error: statsError } = await supabase
            .from('visitor_stats')
            .select('*')
            .single();

        if (statsError) {
            console.error('❌ Error fetching stats:', statsError);
            return;
        }

        console.log('📈 Real visitor stats (excluding bots):');
        console.log(`   🌐 Unique IPs: ${stats.unique_ips}`);
        console.log(`   👤 Sessions: ${stats.unique_sessions}`);
        console.log(`   📅 Today: ${stats.today_visits}`);
        console.log(`   📊 Week: ${stats.week_visits}\n`);

        console.log('✅ Cleanup complete!');
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    }
}

cleanupTestVisitors();
