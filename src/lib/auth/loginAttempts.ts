// Simple client-side login attempt tracking for rate limiting
// Note: This is a basic implementation. In production, this should be handled server-side.

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

interface LoginAttempt {
  timestamp: number;
  success: boolean;
}

// Get stored login attempts for an email
const getLoginAttempts = (email: string): LoginAttempt[] => {
  try {
    const stored = localStorage.getItem(`login_attempts_${email.toLowerCase()}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to parse login attempts:', error);
    return [];
  }
};

// Store login attempts for an email
const setLoginAttempts = (email: string, attempts: LoginAttempt[]): void => {
  try {
    // Keep only attempts from the last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentAttempts = attempts.filter(attempt => attempt.timestamp > oneHourAgo);
    
    localStorage.setItem(
      `login_attempts_${email.toLowerCase()}`, 
      JSON.stringify(recentAttempts)
    );
  } catch (error) {
    console.warn('Failed to store login attempts:', error);
  }
};

// Record a login attempt
export const recordLoginAttempt = (email: string, success: boolean): void => {
  const attempts = getLoginAttempts(email);
  attempts.push({
    timestamp: Date.now(),
    success
  });
  setLoginAttempts(email, attempts);
};

// Check if an email is locked out due to too many failed attempts
export const isLockedOut = (email: string): boolean => {
  const attempts = getLoginAttempts(email);
  
  // Filter for recent failed attempts (within lockout duration)
  const failedAttempts = attempts.filter(
    attempt => !attempt.success && 
    Date.now() - attempt.timestamp < LOCKOUT_DURATION
  );
  
  return failedAttempts.length >= MAX_ATTEMPTS;
};

// Get remaining attempts before lockout
export const getRemainingAttempts = (email: string): number => {
  const attempts = getLoginAttempts(email);
  
  // Count recent failed attempts
  const failedAttempts = attempts.filter(
    attempt => !attempt.success && 
    Date.now() - attempt.timestamp < LOCKOUT_DURATION
  ).length;
  
  return Math.max(0, MAX_ATTEMPTS - failedAttempts);
};

// Get time until lockout expires (in milliseconds)
export const getTimeUntilUnlock = (email: string): number => {
  const attempts = getLoginAttempts(email);
  
  // Find the oldest failed attempt within lockout duration
  const failedAttempts = attempts
    .filter(attempt => !attempt.success)
    .sort((a, b) => a.timestamp - b.timestamp);
  
  if (failedAttempts.length < MAX_ATTEMPTS) {
    return 0;
  }
  
  const oldestRelevantAttempt = failedAttempts[failedAttempts.length - MAX_ATTEMPTS];
  const lockoutEnd = oldestRelevantAttempt.timestamp + LOCKOUT_DURATION;
  
  return Math.max(0, lockoutEnd - Date.now());
};

// Clear all login attempts for an email (use after successful login)
export const clearLoginAttempts = (email: string): void => {
  localStorage.removeItem(`login_attempts_${email.toLowerCase()}`);
};