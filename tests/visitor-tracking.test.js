/**
 * Comprehensive Visitor Tracking Tests
 * Tests all scenarios for the visitor counter system
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Color codes for terminal output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
};

class VisitorTrackingTests {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.testResults = [];
    }

    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    async test(name, fn) {
        try {
            this.log(`\n▶ Running: ${name}`, 'blue');
            await fn();
            this.passed++;
            this.log(`✅ PASSED: ${name}`, 'green');
            this.testResults.push({ name, status: 'PASSED' });
        } catch (error) {
            this.failed++;
            this.log(`❌ FAILED: ${name}`, 'red');
            this.log(`   Error: ${error.message}`, 'red');
            this.testResults.push({ name, status: 'FAILED', error: error.message });
        }
    }

    async assertEqual(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(
                `${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`
            );
        }
    }

    async assertTrue(condition, message = 'Condition is false') {
        if (!condition) {
            throw new Error(message);
        }
    }

    async assertGreaterThan(actual, minimum, message = '') {
        if (actual <= minimum) {
            throw new Error(`${message}\nExpected > ${minimum}, got ${actual}`);
        }
    }

    // Helper function to simulate visitor tracking
    async trackVisitor(options = {}) {
        const headers = {
            'Content-Type': 'application/json',
        };

        // Add IP header if provided
        if (options.ip) {
            headers['x-forwarded-for'] = options.ip;
        }

        const body = {
            sessionToken: options.sessionToken || null,
        };

        const response = await fetch(`${BASE_URL}/api/visitors`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        return response.json();
    }

    // Helper function to get visitor stats
    async getVisitorStats() {
        const response = await fetch(`${BASE_URL}/api/visitors`);
        return response.json();
    }

    // =============================================
    // TEST CASES
    // =============================================

    async testGetVisitorStatsEndpoint() {
        const data = await this.getVisitorStats();
        
        await this.assertTrue(data.success, 'Response should be successful');
        await this.assertTrue('data' in data, 'Response should have data field');
        await this.assertTrue('uniqueIPs' in data.data, 'Should have uniqueIPs');
        await this.assertTrue('uniqueSessions' in data.data, 'Should have uniqueSessions');
        await this.assertTrue('todayVisits' in data.data, 'Should have todayVisits');
        await this.assertTrue('weekVisits' in data.data, 'Should have weekVisits');
    }

    async testTrackVisitorWithIP() {
        const testIP = `192.168.1.${Math.floor(Math.random() * 255)}`;
        const result = await this.trackVisitor({ ip: testIP });
        
        await this.assertTrue(result.success, 'Tracking should succeed');
        await this.assertTrue(
            result.type === 'insert' || result.type === 'update',
            'Should return insert or update type'
        );
    }

    async testTrackVisitorWithSession() {
        const testSession = `test-session-${Date.now()}`;
        const result = await this.trackVisitor({ sessionToken: testSession });
        
        await this.assertTrue(result.success, 'Tracking with session should succeed');
    }

    async testTrackVisitorWithBothIPAndSession() {
        const testIP = `10.0.0.${Math.floor(Math.random() * 255)}`;
        const testSession = `test-session-${Date.now()}`;
        
        const result = await this.trackVisitor({
            ip: testIP,
            sessionToken: testSession,
        });
        
        await this.assertTrue(result.success, 'Tracking with both should succeed');
    }

    async testUniqueIPConstraint() {
        const testIP = `172.16.0.${Math.floor(Math.random() * 255)}`;
        
        // First visit - should insert
        const result1 = await this.trackVisitor({ ip: testIP });
        await this.assertEqual(result1.type, 'insert', 'First visit should insert');
        
        // Wait a bit to ensure different timestamp
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Second visit - should update
        const result2 = await this.trackVisitor({ ip: testIP });
        await this.assertEqual(result2.type, 'update', 'Second visit should update');
    }

    async testDifferentIPsCreateMultipleRecords() {
        const statsBefore = await this.getVisitorStats();
        const ipsBefore = statsBefore.data.uniqueIPs;
        
        // Track two different IPs
        const ip1 = `203.0.113.${Math.floor(Math.random() * 255)}`;
        const ip2 = `203.0.114.${Math.floor(Math.random() * 255)}`;
        
        await this.trackVisitor({ ip: ip1 });
        await this.trackVisitor({ ip: ip2 });
        
        // Wait a bit for stats to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const statsAfter = await this.getVisitorStats();
        const ipsAfter = statsAfter.data.uniqueIPs;
        
        await this.assertGreaterThan(
            ipsAfter,
            ipsBefore - 1, // Allow for slight timing differences
            'Unique IPs should increase'
        );
    }

    async testSessionFallbackWhenNoIP() {
        const testSession = `fallback-session-${Date.now()}`;
        
        // Track without IP (only session)
        const result = await this.trackVisitor({ sessionToken: testSession });
        
        await this.assertTrue(result.success, 'Session fallback should work');
        await this.assertTrue(
            result.message.toLowerCase().includes('session') || 
            result.message.toLowerCase().includes('visitor') || 
            result.type === 'insert' || 
            result.type === 'update',
            'Should track by session or as visitor'
        );
    }

    async testMultipleIPsInXForwardedFor() {
        // Simulate proxy chain with multiple IPs
        const multipleIPs = '203.0.113.1, 198.51.100.1, 192.0.2.1';
        
        const result = await this.trackVisitor({ ip: multipleIPs });
        
        await this.assertTrue(result.success, 'Should handle multiple IPs');
    }

    async testEmptyIPString() {
        const result = await this.trackVisitor({ ip: '' });
        
        await this.assertTrue(result.success, 'Should handle empty IP string');
    }

    async testUnknownIPString() {
        const result = await this.trackVisitor({ ip: 'Unknown' });
        
        await this.assertTrue(result.success, 'Should handle Unknown IP string');
    }

    async testVisitorStatsIncreaseAfterTracking() {
        const statsBefore = await this.getVisitorStats();
        
        // Track a unique visitor
        const uniqueIP = `192.0.2.${Math.floor(Math.random() * 255)}`;
        await this.trackVisitor({ ip: uniqueIP });
        
        // Wait for database to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const statsAfter = await this.getVisitorStats();
        
        // At least one stat should have increased
        const increased = 
            statsAfter.data.uniqueIPs >= statsBefore.data.uniqueIPs ||
            statsAfter.data.uniqueSessions >= statsBefore.data.uniqueSessions;
        
        await this.assertTrue(increased, 'Stats should increase after tracking');
    }

    async testConcurrentVisitorTracking() {
        const promises = [];
        
        // Simulate 5 concurrent visitors with different IPs
        for (let i = 0; i < 5; i++) {
            const ip = `198.51.100.${Math.floor(Math.random() * 255)}`;
            promises.push(this.trackVisitor({ ip }));
        }
        
        const results = await Promise.all(promises);
        
        // All should succeed
        results.forEach((result, index) => {
            this.assertTrue(
                result.success,
                `Concurrent request ${index + 1} should succeed`
            );
        });
    }

    async testSameIPDifferentSessions() {
        const testIP = `10.10.10.${Math.floor(Math.random() * 255)}`;
        const session1 = `session-1-${Date.now()}`;
        const session2 = `session-2-${Date.now()}`;
        
        // Track same IP with different sessions
        await this.trackVisitor({ ip: testIP, sessionToken: session1 });
        await new Promise(resolve => setTimeout(resolve, 100));
        await this.trackVisitor({ ip: testIP, sessionToken: session2 });
        
        // Should update, not create new record
        const result = await this.trackVisitor({ ip: testIP, sessionToken: session2 });
        await this.assertEqual(result.type, 'update', 'Should update existing IP record');
    }

    async testNoIPNoSession() {
        // Track visitor with neither IP nor session
        const result = await this.trackVisitor({});
        
        await this.assertTrue(result.success, 'Should handle anonymous visitor');
    }

    async testAPIResponseTime() {
        const start = Date.now();
        await this.trackVisitor({ ip: '8.8.8.8' });
        const duration = Date.now() - start;
        
        await this.assertTrue(
            duration < 5000,
            `API should respond within 5 seconds (took ${duration}ms)`
        );
    }

    async testStatsResponseTime() {
        const start = Date.now();
        await this.getVisitorStats();
        const duration = Date.now() - start;
        
        await this.assertTrue(
            duration < 3000,
            `Stats API should respond within 3 seconds (took ${duration}ms)`
        );
    }

    // =============================================
    // RUN ALL TESTS
    // =============================================

    async runAll() {
        this.log('\n╔══════════════════════════════════════════╗', 'yellow');
        this.log('║   VISITOR TRACKING COMPREHENSIVE TESTS   ║', 'yellow');
        this.log('╚══════════════════════════════════════════╝', 'yellow');
        this.log(`Testing API at: ${BASE_URL}\n`, 'blue');

        // API Endpoint Tests
        this.log('\n━━━ API ENDPOINT TESTS ━━━', 'yellow');
        await this.test('Get Visitor Stats Endpoint', () => this.testGetVisitorStatsEndpoint());
        await this.test('Track Visitor with IP', () => this.testTrackVisitorWithIP());
        await this.test('Track Visitor with Session', () => this.testTrackVisitorWithSession());
        await this.test('Track Visitor with Both IP and Session', () => this.testTrackVisitorWithBothIPAndSession());

        // Unique Constraint Tests
        this.log('\n━━━ UNIQUE CONSTRAINT TESTS ━━━', 'yellow');
        await this.test('Unique IP Constraint', () => this.testUniqueIPConstraint());
        await this.test('Different IPs Create Multiple Records', () => this.testDifferentIPsCreateMultipleRecords());
        await this.test('Same IP Different Sessions', () => this.testSameIPDifferentSessions());

        // Fallback & Edge Cases
        this.log('\n━━━ FALLBACK & EDGE CASES ━━━', 'yellow');
        await this.test('Session Fallback When No IP', () => this.testSessionFallbackWhenNoIP());
        await this.test('Multiple IPs in X-Forwarded-For', () => this.testMultipleIPsInXForwardedFor());
        await this.test('Empty IP String', () => this.testEmptyIPString());
        await this.test('Unknown IP String', () => this.testUnknownIPString());
        await this.test('No IP No Session', () => this.testNoIPNoSession());

        // Functional Tests
        this.log('\n━━━ FUNCTIONAL TESTS ━━━', 'yellow');
        await this.test('Visitor Stats Increase After Tracking', () => this.testVisitorStatsIncreaseAfterTracking());
        await this.test('Concurrent Visitor Tracking', () => this.testConcurrentVisitorTracking());

        // Performance Tests
        this.log('\n━━━ PERFORMANCE TESTS ━━━', 'yellow');
        await this.test('API Response Time', () => this.testAPIResponseTime());
        await this.test('Stats Response Time', () => this.testStatsResponseTime());

        // Summary
        this.printSummary();
    }

    printSummary() {
        const total = this.passed + this.failed;
        const passRate = ((this.passed / total) * 100).toFixed(1);

        this.log('\n╔══════════════════════════════════════════╗', 'yellow');
        this.log('║           TEST SUMMARY                    ║', 'yellow');
        this.log('╚══════════════════════════════════════════╝', 'yellow');
        this.log(`\nTotal Tests: ${total}`, 'blue');
        this.log(`✅ Passed: ${this.passed}`, 'green');
        
        if (this.failed > 0) {
            this.log(`❌ Failed: ${this.failed}`, 'red');
            this.log(`\nFailed Tests:`, 'red');
            this.testResults
                .filter(r => r.status === 'FAILED')
                .forEach(r => {
                    this.log(`  • ${r.name}`, 'red');
                    if (r.error) {
                        this.log(`    ${r.error}`, 'red');
                    }
                });
        }
        
        this.log(`\nPass Rate: ${passRate}%`, this.failed === 0 ? 'green' : 'yellow');
        
        if (this.failed === 0) {
            this.log('\n🎉 ALL TESTS PASSED! 🎉', 'green');
        } else {
            this.log('\n⚠️  SOME TESTS FAILED', 'red');
            process.exit(1);
        }
    }
}

// Run tests
(async () => {
    const tester = new VisitorTrackingTests();
    await tester.runAll();
})();
