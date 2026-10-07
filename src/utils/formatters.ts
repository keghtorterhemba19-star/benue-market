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
