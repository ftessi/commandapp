# Visitor Tracking Pre-Deployment Checklist

## 🔍 Before Running Tests

### 1. Database Setup
- [ ] Open Supabase SQL Editor
- [ ] Run the following to clean up old tables:
  ```sql
  DROP TABLE IF EXISTS visitors CASCADE;
  DROP VIEW IF EXISTS visitor_stats CASCADE;
  ```
- [ ] Copy and run entire content of `supabase/migrations/create_visitor_tracking.sql`
- [ ] Verify table created: `SELECT * FROM visitors LIMIT 1;`
- [ ] Verify view created: `SELECT * FROM visitor_stats;`

### 2. App Setup
- [ ] Environment variables are set in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Run `npm install` (if needed)
- [ ] Start the app: `npm run dev`
- [ ] Verify app is accessible at http://localhost:3000

## ✅ Running Tests

### Quick Test (30 seconds)
```bash
npm run test-visitor-quick
```

**Expected output:**
```
✅ Visitor tracking works!
✅ Stats retrieval works!
✅ Unique IP constraint works!
✅ ALL QUICK TESTS PASSED!
```

### Full Test Suite (2-3 minutes)
```bash
npm run test-visitor-tracking
```

**Expected output:**
```
Total Tests: 17
✅ Passed: 17
Pass Rate: 100%
🎉 ALL TESTS PASSED! 🎉
```

## 🧪 Manual Verification

### 1. Test in Browser
- [ ] Open http://localhost:3000
- [ ] Landing page loads without errors
- [ ] Open browser console (F12)
- [ ] Look for: `👁️ Visitor tracked with session: ...`

### 2. Test Admin Dashboard
- [ ] Go to http://localhost:3000/admin
- [ ] Login with credentials
- [ ] Navigate to Tickets Admin
- [ ] Verify visitor stats show at the top:
  - 🌐 Unique IPs: (should be > 0)
  - 👤 Sessions: (should be > 0)
  - 📅 Today: (should be > 0)
  - 📊 This Week: (should be > 0)

### 3. Test Database
In Supabase SQL Editor:
```sql
-- Should show visitors
SELECT * FROM visitors ORDER BY last_visit_at DESC LIMIT 10;

-- Should show stats
SELECT * FROM visitor_stats;

-- Check for duplicates (should be 0 or very few)
SELECT ip_address, COUNT(*) 
FROM visitors 
WHERE ip_address IS NOT NULL 
GROUP BY ip_address 
HAVING COUNT(*) > 1;
```

## 🚨 Critical Tests That MUST Pass

- [ ] ✅ Unique IP Constraint Test
- [ ] ✅ Session Fallback When No IP Test
- [ ] ✅ Concurrent Visitor Tracking Test
- [ ] ✅ Same IP Different Sessions Test

**If any of these fail, DO NOT deploy to production!**

## 🐛 Troubleshooting

### Test Fails: "ECONNREFUSED"
**Problem**: App not running  
**Solution**: Run `npm run dev`

### Test Fails: "relation 'visitors' does not exist"
**Problem**: Database migration not applied  
**Solution**: Run migration in Supabase SQL Editor

### Test Fails: "Supabase URL or Key not set"
**Problem**: Environment variables missing  
**Solution**: Check `.env.local` file

### Stats Show 0 in Admin Dashboard
**Problem**: No visitors tracked yet OR view not working  
**Solution**: 
1. Visit the landing page first to create a visitor
2. Verify view in SQL: `SELECT * FROM visitor_stats;`

### Multiple Records for Same IP
**Problem**: Unique constraint not working  
**Solution**: 
1. Check migration was applied correctly
2. Recreate table with proper UNIQUE constraint

## 📋 Post-Deployment Verification

After deploying to production:

### 1. Test Production API
```bash
TEST_URL=https://your-domain.com npm run test-visitor-quick
```

### 2. Check Production Dashboard
- [ ] Visit your production URL
- [ ] Login to admin
- [ ] Verify visitor stats are displaying
- [ ] Stats should increase as you visit the site

### 3. Monitor Database
- [ ] Check Supabase dashboard for visitor records
- [ ] Verify no duplicate IPs being created
- [ ] Monitor query performance

## ✅ Final Checklist Before Going Live

- [ ] All tests pass locally
- [ ] Database migration applied to production Supabase
- [ ] Environment variables set in production (Vercel/hosting)
- [ ] Visitor stats display correctly in admin dashboard
- [ ] No console errors in browser
- [ ] Tested with multiple different browsers/devices
- [ ] Verified unique IP tracking works
- [ ] Verified session fallback works
- [ ] Performance is acceptable (< 5s response time)

## 📊 Expected Production Behavior

### Normal Operation
- Each unique visitor creates ONE record
- Returning visitors update their record (visit_count increases)
- Stats display unique IPs and sessions separately
- Response times under 5 seconds

### Red Flags
- ⚠️ Multiple records per IP (unique constraint broken)
- ⚠️ Stats always showing 0 (tracking not working)
- ⚠️ Response times over 10 seconds (performance issue)
- ⚠️ Console errors about Supabase connection

## 🎯 Success Criteria

✅ **The system is working correctly when:**
1. Tests pass with 100% success rate
2. Visitor stats increase in admin dashboard
3. Same IP visiting twice updates (doesn't create new record)
4. Different IPs create separate records
5. No errors in browser console
6. Stats show realistic numbers (not duplicating)

---

## 📞 Need Help?

If tests fail and you can't figure out why:
1. Check console logs in browser (F12)
2. Check Supabase logs
3. Run `npm run test-visitor-quick` for detailed output
4. Review error messages carefully
5. Check database has correct schema

**Common mistakes:**
- Forgetting to run migration
- Environment variables not set
- App not running when testing
- Using wrong Supabase project
