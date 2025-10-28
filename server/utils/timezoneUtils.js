const { zonedTimeToUtc, utcToZonedTime, format } = require('date-fns-tz');
const { parseISO } = require('date-fns');

// Europe/Berlin timezone (handles both CEST and CET automatically)
const TIMEZONE = 'Europe/Berlin';

/**
 * Convert a date from the Berlin timezone to UTC for database storage
 * @param {Date|string} date - Date in Berlin timezone
 * @returns {Date} - Date in UTC
 */
const toUTC = (date) => {
  if (!date) return null;

  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return zonedTimeToUtc(dateObj, TIMEZONE);
};

/**
 * Convert a UTC date from database to Berlin timezone for display
 * @param {Date|string} date - Date in UTC
 * @returns {Date} - Date in Berlin timezone
 */
const toBerlinTime = (date) => {
  if (!date) return null;

  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return utcToZonedTime(dateObj, TIMEZONE);
};

/**
 * Format a date in Berlin timezone
 * @param {Date|string} date - Date to format
 * @param {string} formatStr - Format string (date-fns format)
 * @returns {string} - Formatted date string
 */
const formatBerlinTime = (date, formatStr = 'yyyy-MM-dd HH:mm:ss') => {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const berlinDate = utcToZonedTime(dateObj, TIMEZONE);
  return format(berlinDate, formatStr, { timeZone: TIMEZONE });
};

/**
 * Get current time in Berlin timezone
 * @returns {Date} - Current time in Berlin timezone
 */
const nowInBerlin = () => {
  return utcToZonedTime(new Date(), TIMEZONE);
};

/**
 * Check if a date is in DST (Daylight Saving Time / Summer Time)
 * @param {Date} date - Date to check
 * @returns {boolean} - True if in DST
 */
const isDST = (date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const jan = new Date(dateObj.getFullYear(), 0, 1);
  const jul = new Date(dateObj.getFullYear(), 6, 1);
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  return dateObj.getTimezoneOffset() < stdOffset;
};

module.exports = {
  TIMEZONE,
  toUTC,
  toBerlinTime,
  formatBerlinTime,
  nowInBerlin,
  isDST
};
