/**
 * Security utilities and constants
 */

export const SECURITY_CONSTANTS = {
  // Maximum field sizes
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_BIO_LENGTH: 500,
  MAX_PHONE_LENGTH: 20,
  MAX_EMAIL_LENGTH: 255,
  MAX_IMAGE_URL_LENGTH: 2048,
  MAX_IMAGES_PER_LISTING: 10,

  // Price ranges (in currency units)
  MIN_PRICE: 0,
  MAX_PRICE: 999_999_999,

  // Location bounds
  LATITUDE_MIN: -90,
  LATITUDE_MAX: 90,
  LONGITUDE_MIN: -180,
  LONGITUDE_MAX: 180,

  // Pagination limits
  MIN_PAGE: 1,
  MAX_PAGE: 10_000,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,

  // Geographic radius limit (km)
  MAX_SEARCH_RADIUS: 500,
} as const;

/**
 * Input sanitization for LIKE queries
 * Escapes special characters that have meaning in LIKE patterns
 */
export function escapeLikePattern(input: string): string {
  return input.replace(/[%_\\]/g, "\\$&");
}

/**
 * Phone number validation regex
 * Allows: +, -, spaces, parentheses, digits
 */
export function isValidPhoneFormat(phone: string): boolean {
  return /^[0-9\-\+\s()]+$/.test(phone);
}

/**
 * Clerk User ID validation
 * Must be alphanumeric with underscores and hyphens only
 */
export function isValidClerkId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Category name validation
 * Allows letters, numbers, spaces, and hyphens only
 */
export function isValidCategoryName(category: string): boolean {
  return /^[a-zA-Z0-9\s\-]+$/.test(category);
}

/**
 * URL validation for image uploads
 * Ensures URL is well-formed and uses HTTPS in production
 */
export function isValidImageUrl(url: string, isProd: boolean = false): boolean {
  try {
    const parsedUrl = new URL(url);
    if (isProd && parsedUrl.protocol !== "https:") return false;
    if (url.length > SECURITY_CONSTANTS.MAX_IMAGE_URL_LENGTH) return false;
    // Allow only HTTP/HTTPS, no data: URLs, javascript: etc
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

/**
 * Email validation (basic format check)
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= SECURITY_CONSTANTS.MAX_EMAIL_LENGTH;
}

export default {
  SECURITY_CONSTANTS,
  escapeLikePattern,
  isValidPhoneFormat,
  isValidClerkId,
  isValidCategoryName,
  isValidImageUrl,
  isValidEmail,
};