/**
 * Script to reset incorrectly auto-declined players
 *
 * Problem: Due to a past bug with recurring events and voting deadlines,
 * some players were incorrectly auto-declined even though the deadline
 * hadn't actually passed. The bug is now fixed, but the consequences remain.
 *
 * Solution:
 * 1. Find FUTURE events (startTime > now)
 * 2. Find players with reason "Automatisch abgelehnt - Abstimmungsfrist abgelaufen"
 * 3. Remove them from declinedPlayers
 * 4. Remove their response from playerResponses
 * 5. Reset autoDeclineProcessed flag
 * 6. Keep all manually declined players unchanged
 *
 * Usage:
 *   Local: node server/scripts/reset-auto-declined-players.js
 *   On Render: node scripts/reset-auto-declined-players.js
 */

// Try to load .env if running locally
try {
  require('dotenv').config({ path: './server/.env' });
} catch (e) {
  // .env not found, assume environment variables are set
}

try {
  require('dotenv').config();
} catch (e) {
  // Ignore
}

const mongoose = require('mongoose');
const Event = require('../models/Event');

const AUTO_DECLINE_REASON = 'Automatisch abgelehnt - Abstimmungsfrist abgelaufen';

async function resetAutoDeclinedPlayers() {
  try {
    // Check if MONGO_URI is available
    if (!process.env.MONGO_URI) {
      console.error('ERROR: MONGO_URI environment variable is not set!');
      console.error('\nTo run this script on Render.com:');
      console.error('1. Go to your backend service dashboard');
      console.error('2. Go to Shell tab');
      console.error('3. Run: node scripts/reset-auto-declined-players.js');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    const now = new Date();
    console.log(`Current time: ${now.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}\n`);

    // Find FUTURE events (startTime > now)
    const futureEvents = await Event.find({
      startTime: { $gt: now }
    }).populate('declinedPlayers', 'name email');

    console.log(`Found ${futureEvents.length} future events to check\n`);

    if (futureEvents.length === 0) {
      console.log('No future events found. Exiting...');
      await mongoose.connection.close();
      process.exit(0);
    }

    let totalPlayersReset = 0;
    let eventsFixed = 0;

    // Process each event
    for (const event of futureEvents) {
      // Find players who were auto-declined with the specific reason
      const autoDeclinedResponses = event.playerResponses.filter(
        response => response.status === 'declined' &&
                   response.reason === AUTO_DECLINE_REASON
      );

      if (autoDeclinedResponses.length === 0) {
        continue; // Skip this event, nothing to fix
      }

      console.log(`\n📅 Event: "${event.title}"`);
      console.log(`   Start: ${event.startTime.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`);
      if (event.votingDeadline) {
        console.log(`   Voting deadline: ${event.votingDeadline.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`);
      }
      console.log(`   Found ${autoDeclinedResponses.length} auto-declined players to reset`);

      const playersResetNames = [];

      // For each auto-declined player
      for (const response of autoDeclinedResponses) {
        const playerId = response.player.toString();

        // Find the player name
        const player = event.declinedPlayers.find(p => p._id.toString() === playerId);
        const playerName = player ? player.name : `ID: ${playerId}`;

        // Remove from declinedPlayers array
        event.declinedPlayers = event.declinedPlayers.filter(
          p => p._id.toString() !== playerId
        );

        // Remove the auto-decline response
        event.playerResponses = event.playerResponses.filter(
          r => !(r.player.toString() === playerId && r.reason === AUTO_DECLINE_REASON)
        );

        playersResetNames.push(playerName);
        totalPlayersReset++;
      }

      // Reset autoDeclineProcessed flag so the job can run again properly
      if (event.autoDeclineProcessed) {
        event.autoDeclineProcessed = false;
        console.log(`   ✓ Reset autoDeclineProcessed flag`);
      }

      // Save the event
      await event.save();

      console.log(`   ✓ Reset ${playersResetNames.length} players:`);
      playersResetNames.forEach(name => console.log(`      - ${name}`));

      eventsFixed++;
    }

    console.log('\n\n╔════════════════════════════════╗');
    console.log('║     RESET SUMMARY              ║');
    console.log('╚════════════════════════════════╝');
    console.log(`Future events checked: ${futureEvents.length}`);
    console.log(`Events fixed: ${eventsFixed}`);
    console.log(`Total players reset: ${totalPlayersReset}`);
    console.log('');

    if (totalPlayersReset > 0) {
      console.log('✅ SUCCESS!');
      console.log('   All incorrectly auto-declined players have been reset.');
      console.log('   They are now back to "not yet voted" status.');
      console.log('   The auto-decline job will run properly at the correct deadline.\n');
    } else {
      console.log('ℹ️  No auto-declined players found in future events.');
      console.log('   All events are clean!\n');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
console.log('╔════════════════════════════════════════════╗');
console.log('║  Reset Auto-Declined Players Script       ║');
console.log('╚════════════════════════════════════════════╝');
console.log('This script resets players who were incorrectly');
console.log('auto-declined due to past recurring event bugs.\n');

resetAutoDeclinedPlayers();
