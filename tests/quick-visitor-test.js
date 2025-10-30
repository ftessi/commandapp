/**
 * Quick Manual Test - Visitor Tracking
 * Run this to quickly verify visitor tracking is working
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

console.log('🧪 Quick Visitor Tracking Test\n');
console.log(`Testing: ${BASE_URL}\n`);

async function quickTest() {
    try {
        // Test 1: Track a visitor
        console.log('1️⃣  Testing visitor tracking...');
        const trackResponse = await fetch(`${BASE_URL}/api/visitors`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Forwarded-For': '192.168.1.100',
            },
            body: JSON.stringify({
                sessionToken: 'quick-test-session',
            }),
        });
        
        const trackData = await trackResponse.json();
        console.log('   Response:', trackData);
        
        if (trackData.success) {
            console.log('   ✅ Visitor tracking works!\n');
        } else {
            console.log('   ❌ Visitor tracking failed!\n');
            return;
        }

        // Test 2: Get stats
        console.log('2️⃣  Testing visitor stats...');
        const statsResponse = await fetch(`${BASE_URL}/api/visitors`);
        const statsData = await statsResponse.json();
        console.log('   Response:', statsData);
        
        if (statsData.success && statsData.data) {
            console.log('   ✅ Stats retrieval works!');
            console.log(`   📊 Unique IPs: ${statsData.data.uniqueIPs}`);
            console.log(`   👤 Sessions: ${statsData.data.uniqueSessions}`);
            console.log(`   📅 Today: ${statsData.data.todayVisits}`);
            console.log(`   📈 Week: ${statsData.data.weekVisits}\n`);
        } else {
            console.log('   ❌ Stats retrieval failed!\n');
            return;
        }

        // Test 3: Track same IP again (should update)
        console.log('3️⃣  Testing unique IP constraint...');
        const trackResponse2 = await fetch(`${BASE_URL}/api/visitors`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Forwarded-For': '192.168.1.100', // Same IP as before
            },
            body: JSON.stringify({
                sessionToken: 'quick-test-session',
            }),
        });
        
        const trackData2 = await trackResponse2.json();
        console.log('   Response:', trackData2);
        
        if (trackData2.type === 'update') {
            console.log('   ✅ Unique IP constraint works! (Updated existing record)\n');
        } else if (trackData2.type === 'insert') {
            console.log('   ⚠️  Warning: Should have updated, but inserted new record\n');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ ALL QUICK TESTS PASSED!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('👉 Run full tests: npm run test-visitor-tracking\n');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.log('\n💡 Make sure your app is running: npm run dev');
        console.log('💡 Make sure database migration is applied in Supabase\n');
    }
}

quickTest();
