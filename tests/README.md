# Tests Directory

## Available Tests

### 1. Quick Visitor Test (Recommended First)
**File**: `quick-visitor-test.js`  
**Run**: `npm run test-visitor-quick`  
**Duration**: ~30 seconds  
**Purpose**: Quick sanity check to verify basic functionality

**Tests:**
- ✅ Visitor tracking works
- ✅ Stats retrieval works
- ✅ Unique IP constraint works

### 2. Comprehensive Visitor Tracking Tests
**File**: `visitor-tracking.test.js`  
**Run**: `npm run test-visitor-tracking`  
**Duration**: ~2-3 minutes  
**Purpose**: Complete test suite covering all scenarios

**Tests (17 total):**
- API Endpoint Tests (4)
- Unique Constraint Tests (3)
- Fallback & Edge Cases (5)
- Functional Tests (2)
- Performance Tests (2)

## Quick Start

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Run quick test:**
   ```bash
   npm run test-visitor-quick
   ```

3. **If quick test passes, run full suite:**
   ```bash
   npm run test-visitor-tracking
   ```

## Test Requirements

- Next.js app must be running (http://localhost:3000)
- Database migration must be applied in Supabase
- Environment variables must be configured

## Documentation

- **VISITOR_TRACKING_TESTS.md** - Detailed test documentation
- **VISITOR_TRACKING_CHECKLIST.md** - Pre-deployment checklist
- **VISITOR_COUNTER_UPDATE.md** - Implementation details

## Troubleshooting

### "ECONNREFUSED" Error
- Make sure app is running: `npm run dev`

### "relation 'visitors' does not exist"
- Apply database migration in Supabase SQL Editor

### Tests timing out
- Check your internet connection
- Verify Supabase is accessible
- Check app logs for errors
