# Visitor Tracking Test Guide

## 🧪 Running the Tests

### Prerequisites
1. Make sure your Next.js app is running:
   ```bash
   npm run dev
   ```

2. Ensure the database migration has been applied in Supabase:
   ```sql
   -- Run this in Supabase SQL Editor first:
   DROP TABLE IF EXISTS visitors CASCADE;
   DROP VIEW IF EXISTS visitor_stats CASCADE;
   
   -- Then run the migration from:
   -- supabase/migrations/create_visitor_tracking.sql
   ```

### Run All Tests
```bash
npm run test-visitor-tracking
```

Or directly:
```bash
node tests/visitor-tracking.test.js
```

### Test Against Production
```bash
TEST_URL=https://your-production-url.com node tests/visitor-tracking.test.js
```

## 📋 Test Coverage

### ✅ API Endpoint Tests
- ✓ Get visitor statistics endpoint
- ✓ Track visitor with IP address
- ✓ Track visitor with session token
- ✓ Track visitor with both IP and session

### ✅ Unique Constraint Tests
- ✓ Unique IP constraint (same IP updates, not inserts)
- ✓ Different IPs create separate records
- ✓ Same IP with different sessions still updates single record

### ✅ Fallback & Edge Cases
- ✓ Session fallback when IP unavailable
- ✓ Multiple IPs in X-Forwarded-For header
- ✓ Empty IP string handling
- ✓ "Unknown" IP string handling
- ✓ No IP and no session (anonymous visitor)

### ✅ Functional Tests
- ✓ Visitor stats increase after tracking
- ✓ Concurrent visitor tracking (5 simultaneous requests)

### ✅ Performance Tests
- ✓ API response time (< 5 seconds)
- ✓ Stats endpoint response time (< 3 seconds)

## 🎯 Test Scenarios Explained

### 1. Unique IP Tracking
**Scenario**: Same IP visits twice  
**Expected**: First visit creates record, second visit updates it  
**Why**: Ensures accurate unique visitor count

### 2. Session Fallback
**Scenario**: IP is unavailable (e.g., behind certain proxies)  
**Expected**: System uses session token instead  
**Why**: Provides backup tracking method

### 3. Concurrent Requests
**Scenario**: Multiple visitors hit the site simultaneously  
**Expected**: All requests succeed without conflicts  
**Why**: Tests database constraint handling under load

### 4. Empty/Unknown IP
**Scenario**: IP header is empty or "Unknown"  
**Expected**: System treats as null and uses session fallback  
**Why**: Handles edge cases in deployment environments

### 5. Multiple IPs in Header
**Scenario**: Proxy chain sends multiple IPs (e.g., "1.2.3.4, 5.6.7.8")  
**Expected**: System extracts first IP (client's real IP)  
**Why**: Correctly handles reverse proxy scenarios

## 📊 Understanding Test Results

### Success Output
```
✅ PASSED: All tests passed
Pass Rate: 100%
🎉 ALL TESTS PASSED! 🎉
```

### Failure Output
```
❌ FAILED: Test Name
   Error: Detailed error message
Pass Rate: 85.7%
⚠️  SOME TESTS FAILED
```

## 🔍 Debugging Failed Tests

### Common Issues

#### 1. Database Not Migrated
**Error**: "relation 'visitors' does not exist"  
**Solution**: Run the migration in Supabase SQL Editor

#### 2. App Not Running
**Error**: "ECONNREFUSED"  
**Solution**: Start your app with `npm run dev`

#### 3. Supabase Not Configured
**Error**: "Supabase URL or Key not set"  
**Solution**: Check your `.env.local` file has:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

#### 4. Stats Don't Increase
**Issue**: Stats appear to increase but test fails  
**Solution**: Might be timing issue - database update lag. This is normal.

## 🛠️ Manual Testing

If automated tests fail, you can test manually:

### 1. Test Tracking Endpoint
```bash
curl -X POST http://localhost:3000/api/visitors \
  -H "Content-Type: application/json" \
  -H "X-Forwarded-For: 1.2.3.4" \
  -d '{"sessionToken":"test-session-123"}'
```

### 2. Test Stats Endpoint
```bash
curl http://localhost:3000/api/visitors
```

### 3. Check Database Directly
```sql
-- In Supabase SQL Editor
SELECT * FROM visitors ORDER BY last_visit_at DESC LIMIT 10;
SELECT * FROM visitor_stats;
```

## 📈 Expected Behavior

### First Visitor
- Creates new record with IP or session
- Returns `{ success: true, type: "insert" }`
- Stats increase by 1

### Returning Visitor (Same IP)
- Updates existing record
- Increments visit_count
- Updates last_visit_at
- Returns `{ success: true, type: "update" }`
- Stats remain same (unique count)

### Different Visitor
- Creates new record
- Stats increase by 1

## 🚨 Critical Tests

These tests MUST pass for production:
1. ✅ Unique IP Constraint
2. ✅ Session Fallback When No IP
3. ✅ Concurrent Visitor Tracking
4. ✅ Same IP Different Sessions

If any of these fail, DO NOT deploy.

## 💡 Tips

- Run tests after any code changes to visitor tracking
- Run tests before deploying to production
- Tests create random test data - safe to run multiple times
- Each test uses unique IPs/sessions to avoid conflicts
- Performance tests may fail on slow networks (increase timeout if needed)
