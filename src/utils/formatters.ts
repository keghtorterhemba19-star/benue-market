/**
 * Formats a number as Nigerian Naira currency string (e.g. ₦45,000)
 */
export const formatNaira = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('NGN', '₦');
};

/**
 * Normalizes any Nigerian phone string into standard international format without '+' or leading zeros
 * Handles: "08031234567", "+2348031234567", "+234 08031234567", "8031234567", "0803 123 4567", etc.
 */
export const cleanNigerianPhoneForWhatsapp = (phone?: string | null): string => {
  if (!phone || typeof phone !== 'string') {
    return '2348031234567'; // Fallback valid default
  }

  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');

  if (!digits) {
    return '2348031234567';
  }

  // If user entered +2340803... or 2340803... (extra '0' after country code 234)
  if (digits.startsWith('2340') && digits.length >= 14) {
    digits = '234' + digits.substring(4);
  }

  // If starts with 0 and length is 11 (e.g. 08031234567)
  if (digits.startsWith('0')) {
    digits = '234' + digits.substring(1);
  }

  // If 10 digits starting with 7, 8, 9 (e.g. 8031234567)
  if (digits.length === 10 && /^[789]/.test(digits)) {
    digits = '234' + digits;
  }

  // Ensure prefix 234
  if (!digits.startsWith('234')) {
    digits = '234' + digits;
  }

  return digits;
};

/**
 * Formats phone number into international display string (+234 803 123 4567)
 */
export const formatInternationalPhone = (phone?: string | null): string => {
  const digits = cleanNigerianPhoneForWhatsapp(phone);
  return `+${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 9)} ${digits.substring(9)}`;
};

/**
 * Generates direct, cross-compatible WhatsApp trade deep-link with prefilled inquiry message
 * Uses api.whatsapp.com/send which works seamlessly on WhatsApp Web, Mobile App, & Desktop without "invalid number" errors.
 */
export const generateWhatsappLink = (
  phone: string,
  sellerName: string,
  productName: string,
  price: number,
  unit: string
): string => {
  const cleanedPhone = cleanNigerianPhoneForWhatsapp(phone);
  const formattedPrice = price > 0 ? ` (${formatNaira(price)} / ${unit})` : '';
  const message = `Hello ${sellerName}, I am contacting you from Benue Market regarding your produce listing for "${productName}"${formattedPrice}. Is this still available for trade?`;
  return `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(message)}`;
};

/**
 * Generates direct telephone call link
 */
export const generateTelLink = (phone?: string | null): string => {
  if (!phone) return 'tel:08031234567';
  const cleanedPhone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  if (cleanedPhone.startsWith('0')) {
    return `tel:${cleanedPhone}`;
  }
  const digits = cleanNigerianPhoneForWhatsapp(phone);
  return `tel:+${digits}`;
};

/**
 * Formats a date string into readable calendar date (e.g. 17 Oct 2026)
 */
export const formatSubscriptionDate = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formats a date string into readable 12-hour time (e.g. 12:15 PM or 02:45:30 PM)
 */
export const formatSubscriptionTime = (dateStr?: string | null, includeSeconds = false): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
    hour12: true,
  });
};

/**
 * Formats a date string into combined date and time (e.g. 17 Oct 2026, 12:15 PM)
 */
export const formatSubscriptionDateTime = (dateStr?: string | null, includeSeconds = false): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const date = formatSubscriptionDate(dateStr);
  const time = formatSubscriptionTime(dateStr, includeSeconds);
  return `${date} at ${time}`;
};

/**
 * Formats date into formal West Africa Time / Nigerian full timestamp
 * e.g. "Saturday, 17 Oct 2026 at 12:15:30 PM"
 */
export const formatFullDateTimeWAT = (dateStr?: string | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const dayName = d.toLocaleDateString('en-GB', { weekday: 'long' });
  const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  return `${dayName}, ${datePart} at ${timePart}`;
};

export interface SubscriptionTimeStatus {
  isActive: boolean;
  isExpired: boolean;
  startsAtFormatted: { date: string; time: string; full: string };
  expiresAtFormatted: { date: string; time: string; full: string };
  countdownText: string;
  relativeShort: string;
  urgency: 'active' | 'warning' | 'danger' | 'expired' | 'pending';
}

/**
 * Calculates real-time countdown, remaining days/hours, and expiration status for a subscription
 */
export const getSubscriptionTimeDetails = (
  startsAt?: string | null,
  expiresAt?: string | null,
  status?: string
): SubscriptionTimeStatus => {
  const startsAtFormatted = {
    date: formatSubscriptionDate(startsAt),
    time: formatSubscriptionTime(startsAt),
    full: formatSubscriptionDateTime(startsAt),
  };

  const expiresAtFormatted = {
    date: formatSubscriptionDate(expiresAt),
    time: formatSubscriptionTime(expiresAt),
    full: formatSubscriptionDateTime(expiresAt),
  };

  if (!expiresAt) {
    const isPending = status === 'pending';
    return {
      isActive: false,
      isExpired: false,
      startsAtFormatted,
      expiresAtFormatted,
      countdownText: isPending ? 'Awaiting Payment & Activation' : 'No Expiration Set',
      relativeShort: isPending ? 'Pending' : 'No Date',
      urgency: 'pending',
    };
  }

  const now = Date.now();
  const expTime = new Date(expiresAt).getTime();
  const diffMs = expTime - now;

  if (diffMs <= 0) {
    const elapsedMs = Math.abs(diffMs);
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    const elapsedHours = Math.floor((elapsedMs / (1000 * 60 * 60)) % 24);

    let text = '';
    let shortText = '';
    if (elapsedDays === 0) {
      text = `Expired today (${elapsedHours}h ago)`;
      shortText = `Expired ${elapsedHours}h ago`;
    } else if (elapsedDays === 1) {
      text = `Expired yesterday (${elapsedDays} day ago)`;
      shortText = 'Expired 1d ago';
    } else {
      text = `Expired ${elapsedDays} days ago`;
      shortText = `Expired ${elapsedDays}d ago`;
    }

    return {
      isActive: false,
      isExpired: true,
      startsAtFormatted,
      expiresAtFormatted,
      countdownText: text,
      relativeShort: shortText,
      urgency: 'expired',
    };
  }

  // Active / Countdown
  const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutesLeft = Math.floor((diffMs / (1000 * 60)) % 60);

  if (daysLeft === 0) {
    if (hoursLeft === 0) {
      return {
        isActive: true,
        isExpired: false,
        startsAtFormatted,
        expiresAtFormatted,
        countdownText: `Expires in ${minutesLeft} mins (Immediate Action)`,
        relativeShort: `${minutesLeft}m left`,
        urgency: 'danger',
      };
    }
    return {
      isActive: true,
      isExpired: false,
      startsAtFormatted,
      expiresAtFormatted,
      countdownText: `Expires today in ${hoursLeft}h ${minutesLeft}m`,
      relativeShort: `${hoursLeft}h left`,
      urgency: 'danger',
    };
  }

  if (daysLeft <= 3) {
    return {
      isActive: true,
      isExpired: false,
      startsAtFormatted,
      expiresAtFormatted,
      countdownText: `${daysLeft}d ${hoursLeft}h remaining (Expiring soon)`,
      relativeShort: `${daysLeft}d ${hoursLeft}h left`,
      urgency: 'warning',
    };
  }

  return {
    isActive: true,
    isExpired: false,
    startsAtFormatted,
    expiresAtFormatted,
    countdownText: `${daysLeft} days remaining`,
    relativeShort: `${daysLeft}d left`,
    urgency: 'active',
  };
};
