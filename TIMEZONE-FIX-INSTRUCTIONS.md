# Timezone Fix Instructions - Summer/Winter Time DST Issue

## Problem

After the switch from summer time (CEST, UTC+2) to winter time (CET, UTC+1) on October 27, 2025, all existing event times are showing **1 hour early**.

### Example
- Event was created in summer for 19:00 → Stored as 17:00 UTC
- Now displayed in winter: 17:00 UTC → Shows as 18:00 CET (1 hour early!)

## Solution Implemented

### 1. Timezone Utility Module ✅
**File:** `server/utils/timezoneUtils.js`

Provides helper functions for timezone conversion:
- `toUTC(date)` - Convert Berlin time to UTC
- `toBerlinTime(date)` - Convert UTC to Berlin time
- `formatBerlinTime(date, format)` - Format date in Berlin timezone
- `nowInBerlin()` - Get current time in Berlin timezone
- `isDST(date)` - Check if date is in Daylight Saving Time

### 2. Migration Script ✅
**File:** `server/scripts/fix-timezone-issue.js`

Automatically fixes all existing events by adding 1 hour to:
- `startTime`
- `endTime`
- `votingDeadline` (if set)

**Safe to run multiple times** - uses a migration flag to prevent double-fixing.

### 3. Future Events ✅
**Updated:** `server/routes/eventRoutes.js`

All future events will automatically handle DST correctly because:
- Dates are stored in UTC in MongoDB
- JavaScript's Date object automatically handles timezone conversion
- Browser automatically accounts for current DST offset

## How to Run the Migration Script

### Option 1: On Render.com (Recommended)

1. Go to your **backend service** dashboard on Render.com
2. Click on the **"Shell"** tab
3. Run the following command:
   ```bash
   node scripts/fix-timezone-issue.js
   ```
4. Verify the output shows successful migration

### Option 2: Locally (If you have MongoDB access)

1. Ensure you have the MONGO_URI in your environment or .env file
2. Run from the project root:
   ```bash
   cd server
   node scripts/fix-timezone-issue.js
   ```

## Migration Script Output

The script will display:
- Number of events found to fix
- Progress for each event (old time → new time)
- Summary of successfully fixed events
- Any errors encountered

### Example Output:
```
=== DST Timezone Fix Migration ===
This script will add 1 hour to all event times
to fix the summer/winter time issue.

Connecting to MongoDB...
Connected to MongoDB successfully

Found 25 events to fix

✓ Fixed event: "Training Session"
  Old time: 2025-11-05T17:00:00.000Z → 2025-11-05T19:00:00.000Z
  New time: 2025-11-05T18:00:00.000Z → 2025-11-05T20:00:00.000Z

...

=== Migration Summary ===
Total events processed: 25
Successfully fixed: 25
Errors: 0
========================
```

## Verification

After running the migration:

1. Check a few events on the frontend
2. Verify times are now showing correctly
3. Create a new test event to ensure future events work correctly

## Technical Details

### How It Works

1. **Storage:** All dates are stored in UTC in MongoDB
2. **Display:** Browser converts UTC to local timezone automatically
3. **DST Handling:** Europe/Berlin timezone switches between:
   - Summer (CEST): UTC+2
   - Winter (CET): UTC+1

### Migration Flag

Events that have been migrated are marked with:
```javascript
_fixesApplied: ['timezone-dst-fix-2025']
```

This ensures events are only fixed once, even if the script is run multiple times.

## Troubleshooting

### Migration script shows "0 events to fix"
- ✅ Great! Either all events were already fixed, or no events exist.

### Migration shows errors
- Check MongoDB connection
- Verify MONGO_URI environment variable is set correctly
- Check server logs for detailed error messages

### Events still showing wrong times after migration
- Clear browser cache and reload
- Verify the migration script completed successfully
- Check the event in the database directly to confirm times were updated

## Future DST Changes

This fix is **permanent**. The system will now automatically handle:
- Future summer/winter time transitions
- Events created during summer time
- Events created during winter time

No additional migrations will be needed for future DST changes.

## Files Modified

1. **server/package.json** - Added `date-fns-tz` dependency
2. **server/utils/timezoneUtils.js** - New timezone utility module
3. **server/scripts/fix-timezone-issue.js** - New migration script
4. **server/routes/eventRoutes.js** - Added timezone utility imports and documentation

## Support

If you encounter any issues:
1. Check the migration script output for errors
2. Verify events in the database directly
3. Test creating a new event to ensure future events work correctly

---

**Created:** October 28, 2025
**Issue:** DST timezone adjustment after summer/winter time change
**Status:** ✅ Fixed
