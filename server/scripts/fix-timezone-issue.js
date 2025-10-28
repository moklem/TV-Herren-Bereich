/**
 * Migration script to fix timezone issue caused by DST change
 *
 * Problem: Events created during summer time (CEST, UTC+2) are now showing
 * 1 hour early after the switch to winter time (CET, UTC+1).
 *
 * Solution: Add 1 hour to all event times that haven't been migrated yet.
 *
 * Usage:
 *   Local: node server/scripts/fix-timezone-issue.js
 *   On Render: node scripts/fix-timezone-issue.js
 *
 * Note: Requires MONGO_URI environment variable to be set.
 * On Render.com, this is automatically available from your environment.
 */

// Try to load .env if running locally
try {
  require('dotenv').config({ path: './server/.env' });
} catch (e) {
  // .env not found, assume environment variables are set (e.g., on Render)
}

// Also try root .env
try {
  require('dotenv').config();
} catch (e) {
  // Ignore
}

const mongoose = require('mongoose');
const Event = require('../models/Event');

const MIGRATION_FLAG = 'timezone-dst-fix-2025';

async function fixTimezoneIssue() {
  try {
    // Check if MONGO_URI is available
    if (!process.env.MONGO_URI) {
      console.error('ERROR: MONGO_URI environment variable is not set!');
      console.error('Please set MONGO_URI in your environment or .env file.');
      console.error('\nTo run this script on Render.com:');
      console.error('1. Go to your backend service dashboard');
      console.error('2. Go to Shell tab');
      console.error('3. Run: node scripts/fix-timezone-issue.js');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully');

    // Find all events that haven't been migrated yet
    const eventsToFix = await Event.find({
      _fixesApplied: { $ne: MIGRATION_FLAG }
    });

    console.log(`\nFound ${eventsToFix.length} events to fix`);

    if (eventsToFix.length === 0) {
      console.log('No events need to be fixed. Exiting...');
      process.exit(0);
    }

    let fixedCount = 0;
    let errorCount = 0;

    // Process each event
    for (const event of eventsToFix) {
      try {
        const oldStartTime = new Date(event.startTime);
        const oldEndTime = new Date(event.endTime);
        const oldVotingDeadline = event.votingDeadline ? new Date(event.votingDeadline) : null;

        // Add 1 hour to startTime and endTime
        const newStartTime = new Date(oldStartTime.getTime() + 60 * 60 * 1000);
        const newEndTime = new Date(oldEndTime.getTime() + 60 * 60 * 1000);
        const newVotingDeadline = oldVotingDeadline
          ? new Date(oldVotingDeadline.getTime() + 60 * 60 * 1000)
          : null;

        // Update the event
        event.startTime = newStartTime;
        event.endTime = newEndTime;
        if (newVotingDeadline) {
          event.votingDeadline = newVotingDeadline;
        }

        // Mark as migrated
        if (!event._fixesApplied) {
          event._fixesApplied = [];
        }
        event._fixesApplied.push(MIGRATION_FLAG);

        await event.save();

        console.log(`✓ Fixed event: "${event.title}"`);
        console.log(`  Old time: ${oldStartTime.toISOString()} → ${oldEndTime.toISOString()}`);
        console.log(`  New time: ${newStartTime.toISOString()} → ${newEndTime.toISOString()}`);
        if (oldVotingDeadline && newVotingDeadline) {
          console.log(`  Voting deadline: ${oldVotingDeadline.toISOString()} → ${newVotingDeadline.toISOString()}`);
        }
        console.log('');

        fixedCount++;
      } catch (error) {
        console.error(`✗ Error fixing event "${event.title}":`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total events processed: ${eventsToFix.length}`);
    console.log(`Successfully fixed: ${fixedCount}`);
    console.log(`Errors: ${errorCount}`);
    console.log('========================\n');

    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run the migration
console.log('=== DST Timezone Fix Migration ===');
console.log('This script will add 1 hour to all event times');
console.log('to fix the summer/winter time issue.\n');

fixTimezoneIssue();
