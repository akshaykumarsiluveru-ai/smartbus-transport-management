// SmartBus Local Storage & Security Utilities
import { INITIAL_USERS } from './mockData';

const REGISTERED_USERS_KEY = 'smartbus_registered_users';
const CREDENTIALS_KEY = 'smartbus_credentials';
const CURRENT_USER_KEY = 'smartbus_current_user';

/**
 * SHA-256 Hashing helper using Web Crypto API with synchronous fallback
 */
export async function hashPassword(password) {
  if (!password) return '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('WebCrypto not available, using fallback hash', err);
  }
  // Fallback deterministic string hash
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}_${password.length}`;
}

/**
 * Synchronous fallback hash for initial setup or sync validation
 */
export function hashPasswordSync(password) {
  if (!password) return '';
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(16)}_${password.length}`;
}

/**
 * Retrieve registered students from localStorage
 */
export function getRegisteredUsers() {
  try {
    const data = localStorage.getItem(REGISTERED_USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to read registered users from localStorage', e);
    return [];
  }
}

/**
 * Save registered students to localStorage
 */
export function saveRegisteredUsers(users) {
  try {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save registered users to localStorage', e);
  }
}

/**
 * Retrieve credential hashes from localStorage
 */
export function getStoredCredentials() {
  try {
    const data = localStorage.getItem(CREDENTIALS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Failed to read credentials from localStorage', e);
    return {};
  }
}

/**
 * Save credential hashes to localStorage (maps email -> passwordHash)
 */
export function saveStoredCredentials(credentials) {
  try {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch (e) {
    console.error('Failed to save credentials to localStorage', e);
  }
}

/**
 * Get active user session
 */
export function getCurrentUserSession() {
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to read current user session', e);
    return null;
  }
}

/**
 * Save active user session
 */
export function saveCurrentUserSession(user) {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error('Failed to save current user session', e);
  }
}

/**
 * Clear user session
 */
export function clearCurrentUserSession() {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
  } catch (e) {
    console.error('Failed to clear current user session', e);
  }
}

/**
 * Generate a unique Digital Pass ID in the format SB-STU-YYYY-XXX
 */
export function generateDigitalPassId(yearName = '') {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(100 + Math.random() * 900); // 3 digits
  return `SB-STU-${currentYear}-${randomSuffix}`;
}
