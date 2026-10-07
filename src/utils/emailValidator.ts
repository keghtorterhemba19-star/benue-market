/**
 * Strict Email Validator for Benue Market Platform
 * Prevents fake, disposable, and invalid email registrations
 */

const DISPOSABLE_DOMAINS = new Set([
  'test.com',
  'fake.com',
  'example.com',
  'tempmail.com',
  'mailinator.com',
  '10minutemail.com',
  'trashmail.com',
  'yopmail.com',
  'dispostable.com',
  'guerrillamail.com',
  'sharklasers.com',
  'getnada.com',
  'throwawaymail.com',
  'temp-mail.org',
  'crazymailing.com',
  'fakeinbox.com',
  'asdf.com',
  'qwer.com',
]);

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
}

/**
 * Validates whether an email address is a real, active personal/business email
 */
export const validatePersonalEmail = (email: string): EmailValidationResult => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email address is required.' };
  }

  const clean = email.trim().toLowerCase();

  // Basic RFC 5322 regex
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(clean)) {
    return {
      isValid: false,
      error: 'Please enter a valid personal email address (e.g. name@gmail.com, name@yahoo.com).',
    };
  }

  const parts = clean.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Invalid email format.' };
  }

  const [username, domain] = parts;

  // Check username length & junk values
  if (username.length < 2) {
    return { isValid: false, error: 'Email username is too short.' };
  }

  if (['test', 'fake', 'admin1', 'asdf', 'qwerty', '123456', 'abcd'].includes(username)) {
    return { isValid: false, error: 'Please enter your actual personal email address instead of a test email.' };
  }

  // Check disposable / dummy domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: `The email domain "${domain}" is not permitted. Please use your real personal email address (Gmail, Yahoo, Outlook, etc.).`,
    };
  }

  // Common typo suggestions
  if (domain === 'gmial.com' || domain === 'gamil.com' || domain === 'gmaill.com') {
    return { isValid: false, error: 'Did you mean name@gmail.com?', suggestion: `${username}@gmail.com` };
  }
  if (domain === 'yaho.com' || domain === 'yahooo.com') {
    return { isValid: false, error: 'Did you mean name@yahoo.com?', suggestion: `${username}@yahoo.com` };
  }
  if (domain === 'outlok.com' || domain === 'hotmial.com') {
    return { isValid: false, error: 'Did you mean name@outlook.com?', suggestion: `${username}@outlook.com` };
  }

  return { isValid: true };
};
