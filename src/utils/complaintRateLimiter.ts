/**
 * Rate Limiter for Complaints / Support Reports sent to Admin
 * 
 * Rules:
 * 1. After sending a complaint, the email must wait at least 60 minutes before sending another.
 * 2. If the same email sends 5 complaints, they must wait at least 2 hours (120 minutes) before sending again.
 */

const LOCAL_STORAGE_KEY = 'benue_market_complaint_history';

interface ComplaintHistoryMap {
  [email: string]: number[]; // Array of millisecond timestamps
}

/**
 * Gets normalized email key
 */
const normalizeEmail = (email: string): string => {
  return (email || '').trim().toLowerCase();
};

/**
 * Reads local complaint history map from localStorage
 */
const getHistoryMap = (): ComplaintHistoryMap => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Failed to parse complaint history map:', err);
    return {};
  }
};

/**
 * Saves complaint history map to localStorage
 */
const saveHistoryMap = (map: ComplaintHistoryMap): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to save complaint history map:', err);
  }
};

/**
 * Retrieves all complaint timestamps (ms) for a given email address.
 * Combines localStorage timestamps with existing reports stored in state.
 */
export const getComplaintTimestamps = (
  email: string,
  existingReports: Array<{ reporterEmail?: string; createdAt: string }> = []
): number[] => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return [];

  const map = getHistoryMap();
  const localTimestamps: number[] = map[cleanEmail] || [];

  // Parse timestamps from existing reports state
  const reportTimestamps: number[] = existingReports
    .filter((r) => r.reporterEmail && normalizeEmail(r.reporterEmail) === cleanEmail)
    .map((r) => new Date(r.createdAt).getTime())
    .filter((ts) => !isNaN(ts));

  // Merge and deduplicate timestamps (within 1 second window)
  const combined = [...localTimestamps, ...reportTimestamps].sort((a, b) => a - b);
  const uniqueTimestamps: number[] = [];
  
  for (const ts of combined) {
    if (!uniqueTimestamps.some((existing) => Math.abs(existing - ts) < 1000)) {
      uniqueTimestamps.push(ts);
    }
  }

  return uniqueTimestamps.sort((a, b) => a - b);
};

export interface RateLimitCheckResult {
  allowed: boolean;
  waitMinutes: number;
  reason?: string;
  count: number;
}

/**
 * Checks if a given email is allowed to submit a new complaint.
 * 
 * Rules:
 * - 60 minutes wait after each complaint.
 * - 2 hours (120 minutes) wait if 5 or more complaints have been submitted by this email.
 */
export const checkComplaintRateLimit = (
  email: string,
  existingReports: Array<{ reporterEmail?: string; createdAt: string }> = []
): RateLimitCheckResult => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) {
    return { allowed: true, waitMinutes: 0, count: 0 };
  }

  const timestamps = getComplaintTimestamps(cleanEmail, existingReports);
  const count = timestamps.length;

  if (count === 0) {
    return { allowed: true, waitMinutes: 0, count: 0 };
  }

  const lastTimestamp = timestamps[timestamps.length - 1];
  const now = Date.now();
  const elapsedMs = now - lastTimestamp;

  // Determine required cooldown period in minutes:
  // If user has sent 5 or more complaints (or every 5th complaint milestone), wait is 2 hours (120 mins).
  // Otherwise, wait is 60 mins.
  const requiredCooldownMinutes = (count >= 5 || count % 5 === 0) ? 120 : 60;
  const requiredCooldownMs = requiredCooldownMinutes * 60 * 1000;

  if (elapsedMs < requiredCooldownMs) {
    const remainingMs = requiredCooldownMs - elapsedMs;
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    
    const isFivePlus = count >= 5;
    const reason = isFivePlus
      ? `Rate Limit Exceeded: You have submitted ${count} complaints with this email (${cleanEmail}). After 5 complaints, a mandatory 2-hour wait period applies. Please wait ${remainingMinutes} more minute(s) before sending another complaint.`
      : `Rate Limit Active: A 60-minute waiting period is required between complaints. Please wait ${remainingMinutes} more minute(s) before sending another complaint with this email (${cleanEmail}).`;

    return {
      allowed: false,
      waitMinutes: remainingMinutes,
      reason,
      count,
    };
  }

  return {
    allowed: true,
    waitMinutes: 0,
    count,
  };
};

/**
 * Records a new complaint submission for an email address.
 */
export const recordComplaintSubmission = (email: string): void => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return;

  const map = getHistoryMap();
  const timestamps = map[cleanEmail] || [];
  timestamps.push(Date.now());
  map[cleanEmail] = timestamps;
  saveHistoryMap(map);
};
