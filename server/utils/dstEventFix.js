const Event = require('../models/Event');
const { berlinOffsetMs, DAY_MS } = require('./berlinTime');

// Audit marker written to every event that was realigned by this fix
const FIX_FLAG = 'dst-recurring-realign';
// Events already shifted by the old one-time script (server/scripts/fix-timezone-issue.js) are left alone
const LEGACY_FLAG = 'timezone-dst-fix-2025';

/**
 * Most recent Europe/Berlin summer/winter time switch before `now`
 * (returned a day early so the switch day itself is always inside the window).
 */
const getLastDstSwitch = (now = new Date()) => {
  for (let i = 0; i < 370; i++) {
    const t = now.getTime() - i * DAY_MS;
    if (berlinOffsetMs(t) !== berlinOffsetMs(t - DAY_MS)) {
      return new Date(t - DAY_MS);
    }
  }
  return new Date(now.getTime() - 370 * DAY_MS);
};

/**
 * Realign recurring event instances that were generated before the server
 * handled summer/winter time.
 *
 * The old generator kept the UTC time of day constant for every instance of a
 * series, so after a time switch the instances showed one hour early/late in
 * Berlin time. Such an instance is recognisable by having exactly the same UTC
 * time of day as its series start (parent event / originalStartTime) while the
 * Berlin UTC offset differs. Only those instances are shifted.
 *
 * Never touched:
 *  - single (non-recurring) events and the series parent events
 *  - instances whose time was changed manually (different UTC time of day)
 *  - instances whose Berlin offset equals the series start's offset (nothing to fix)
 *  - events created after a switch whose instances lie in the same time period
 *  - instances before the last switch and events already fixed by the 2025 script
 *
 * Safe to run on every start: a fixed instance no longer matches the criteria.
 * Set DST_FIX_DRY_RUN=true to only log what would be changed.
 */
async function fixRecurringEventDstShift({ dryRun = process.env.DST_FIX_DRY_RUN === 'true' } = {}) {
  try {
    const since = getLastDstSwitch();
    console.log(`[DST Fix] Checking recurring instances from ${since.toISOString()}${dryRun ? ' (dry run)' : ''}`);

    const instances = await Event.find({
      isRecurringInstance: true,
      recurringGroupId: { $ne: null },
      startTime: { $gte: since },
      _fixesApplied: { $ne: LEGACY_FLAG }
    }).select('title startTime endTime votingDeadline recurringGroupId originalStartTime').lean();

    if (instances.length === 0) {
      console.log('[DST Fix] No recurring instances to check');
      return { success: true, checked: 0, fixed: 0 };
    }

    const groupIds = [...new Set(instances.map(e => e.recurringGroupId.toString()))];
    const parents = await Event.find({
      _id: { $in: groupIds },
      _fixesApplied: { $ne: LEGACY_FLAG }
    }).select('startTime').lean();
    const parentStartById = new Map(parents.map(p => [p._id.toString(), p.startTime]));

    const operations = [];
    const fixedIds = [];

    for (const instance of instances) {
      if (instance._id.toString() === instance.recurringGroupId.toString()) continue;

      // Series start references: the parent's start and the start stored at generation time
      const references = [
        parentStartById.get(instance.recurringGroupId.toString()),
        instance.originalStartTime
      ].filter(Boolean);

      let delta = 0;
      for (const reference of references) {
        // Different UTC time of day -> time was edited manually, leave it alone
        const sameUtcTimeOfDay = (instance.startTime.getTime() - new Date(reference).getTime()) % DAY_MS === 0;
        if (!sameUtcTimeOfDay) continue;
        delta = berlinOffsetMs(reference) - berlinOffsetMs(instance.startTime);
        break;
      }
      if (delta === 0) continue;

      const set = {
        startTime: new Date(instance.startTime.getTime() + delta),
        endTime: new Date(instance.endTime.getTime() + delta)
      };
      if (instance.votingDeadline) {
        set.votingDeadline = new Date(instance.votingDeadline.getTime() + delta);
      }

      console.log(`[DST Fix] ${dryRun ? 'Would shift' : 'Shifting'} "${instance.title}" (${instance._id}) by ${delta / 60000} min: ` +
        `${instance.startTime.toISOString()} -> ${set.startTime.toISOString()}`);

      operations.push({
        updateOne: {
          filter: { _id: instance._id, startTime: instance.startTime },
          update: { $set: set, $addToSet: { _fixesApplied: FIX_FLAG } }
        }
      });
      fixedIds.push({ id: instance._id, startTime: set.startTime });
    }

    if (operations.length === 0) {
      console.log(`[DST Fix] Checked ${instances.length} recurring instances - nothing to fix`);
      return { success: true, checked: instances.length, fixed: 0 };
    }

    if (dryRun) {
      return { success: true, checked: instances.length, fixed: 0, wouldFix: operations.length };
    }

    // bulkWrite bypasses the Event save hooks (no auto-decline / auto-invite side effects)
    await Event.bulkWrite(operations);

    // Reminders were scheduled for the old start time - schedule them again
    const { scheduleEventNotifications } = require('./notificationQueue');
    const now = new Date();
    for (const { id, startTime } of fixedIds) {
      if (startTime > now) {
        await scheduleEventNotifications(id);
      }
    }

    console.log(`[DST Fix] Realigned ${operations.length} of ${instances.length} recurring instances`);
    return { success: true, checked: instances.length, fixed: operations.length };
  } catch (error) {
    console.error('[DST Fix] Error realigning recurring events:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  fixRecurringEventDstShift,
  getLastDstSwitch
};
