/**
 * Europe/Berlin wall-clock helpers (built on Intl, no external packages).
 *
 * The server runs in UTC, so plain Date arithmetic (setDate, setMonth, setHours)
 * keeps the UTC time of day fixed. Across a summer/winter time switch this moves
 * the local (Berlin) time by one hour. These helpers do the calendar arithmetic
 * on the Berlin wall clock instead, so "19:00" stays "19:00" in CEST and CET.
 */

const TIMEZONE = 'Europe/Berlin';
const DAY_MS = 24 * 60 * 60 * 1000;

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric'
});

/**
 * Berlin wall-clock time of an instant, expressed as a "fake UTC" timestamp
 * (the wall-clock fields read through Date.UTC). Millisecond precision is kept.
 */
const toBerlinWallMs = (date) => {
  const instant = new Date(date).getTime();
  const parts = {};
  for (const { type, value } of formatter.formatToParts(instant)) {
    parts[type] = parseInt(value, 10);
  }
  const wall = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  // formatToParts drops milliseconds - restore them
  return wall + (((instant % 1000) + 1000) % 1000);
};

/**
 * Convert a Berlin wall-clock "fake UTC" timestamp back to the real instant.
 * Non-existent times (spring-forward gap) resolve to the instant after the gap,
 * ambiguous times (autumn overlap) resolve to the first (summer time) occurrence.
 */
const fromBerlinWallMs = (wallMs) => {
  // Offsets (wall - instant) on either side of the guess cover a DST switch nearby
  const offsetBefore = toBerlinWallMs(wallMs - DAY_MS) - (wallMs - DAY_MS);
  const offsetAfter = toBerlinWallMs(wallMs + DAY_MS) - (wallMs + DAY_MS);

  const candidates = [offsetBefore, offsetAfter]
    .map(offset => wallMs - offset)
    .filter(instant => toBerlinWallMs(instant) === wallMs);

  if (candidates.length > 0) {
    return new Date(Math.min(...candidates));
  }
  // Wall time falls into the spring-forward gap
  return new Date(wallMs - offsetBefore);
};

/** UTC offset of Europe/Berlin at the given instant, in milliseconds (CET 3600000, CEST 7200000). */
const berlinOffsetMs = (date) => {
  const instant = new Date(date).getTime();
  return toBerlinWallMs(instant) - instant;
};

/** Berlin calendar weekday of an instant (0 = Sunday ... 6 = Saturday). */
const berlinWeekday = (date) => new Date(toBerlinWallMs(date)).getUTCDay();

/** Berlin wall-clock hours and minutes of an instant. */
const berlinHoursMinutes = (date) => {
  const wall = new Date(toBerlinWallMs(date));
  return { hours: wall.getUTCHours(), minutes: wall.getUTCMinutes() };
};

/** Move an instant by whole calendar days, keeping the Berlin wall-clock time. */
const addBerlinDays = (date, days) => fromBerlinWallMs(toBerlinWallMs(date) + days * DAY_MS);

/** Move an instant by calendar months, keeping the Berlin wall-clock time (JS setMonth overflow semantics). */
const addBerlinMonths = (date, months) => {
  const wall = new Date(toBerlinWallMs(date));
  wall.setUTCMonth(wall.getUTCMonth() + months);
  return fromBerlinWallMs(wall.getTime());
};

/** Keep the Berlin calendar day of an instant but set its wall-clock hours and minutes. */
const setBerlinHoursMinutes = (date, hours, minutes) => {
  const wall = new Date(toBerlinWallMs(date));
  wall.setUTCHours(hours, minutes);
  return fromBerlinWallMs(wall.getTime());
};

/** Wall-clock distance in ms from `from` to `to` in Berlin time (differs from `to - from` across a DST switch). */
const berlinWallDiffMs = (from, to) => toBerlinWallMs(to) - toBerlinWallMs(from);

/** Instant that lies `wallDiffMs` of Berlin wall-clock time after `date`. */
const addBerlinWallMs = (date, wallDiffMs) => fromBerlinWallMs(toBerlinWallMs(date) + wallDiffMs);

module.exports = {
  TIMEZONE,
  DAY_MS,
  toBerlinWallMs,
  fromBerlinWallMs,
  berlinOffsetMs,
  berlinWeekday,
  berlinHoursMinutes,
  addBerlinDays,
  addBerlinMonths,
  setBerlinHoursMinutes,
  berlinWallDiffMs,
  addBerlinWallMs
};
