import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * ARCHGUARD AI — Enterprise OTP Service
 * Generates, hashes, stores, and validates OTP codes.
 */

// In-memory fallback if Neon PG is offline
const memoryOtpStore = new Map();

/**
 * Generate a 6-digit cryptographically secure OTP.
 */
export function generateOtpCode(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
}

/**
 * Hash the OTP code before storing.
 */
export async function hashOtp(otpCode) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(otpCode, salt);
}

/**
 * Validate an OTP code against its hash.
 */
export async function verifyOtpHash(otpCode, hash) {
  return await bcrypt.compare(otpCode, hash);
}

/**
 * Generates and stores a hashed OTP. Returns the plaintext OTP to be emailed.
 */
export async function createAndStoreOtp(email, purpose, expiresMinutes = 10) {
  const code = generateOtpCode();
  const hashed = await hashOtp(code);
  const expiresAt = new Date(Date.now() + expiresMinutes * 60000);
  
  // Here we would use the DB repository, but we use memory store for fallback first.
  const otpRecord = {
    email: email.toLowerCase(),
    otpHash: hashed,
    purpose,
    expiresAt,
    attempts: 0,
    maxAttempts: 5,
    verifiedAt: null
  };
  
  memoryOtpStore.set(email.toLowerCase(), otpRecord);
  
  // Return the plaintext code only once so the email service can send it
  return code;
}

/**
 * Retrieves and validates the OTP.
 */
export async function validateOtp(email, code) {
  const normalizedEmail = email.toLowerCase();
  const record = memoryOtpStore.get(normalizedEmail);
  
  if (!record) {
    return { success: false, reason: 'No pending verification found or code expired.' };
  }
  
  if (record.verifiedAt) {
    return { success: false, reason: 'This code has already been used.' };
  }
  
  if (new Date() > record.expiresAt) {
    memoryOtpStore.delete(normalizedEmail);
    return { success: false, reason: 'Verification code has expired. Please request a new one.' };
  }
  
  if (record.attempts >= record.maxAttempts) {
    memoryOtpStore.delete(normalizedEmail);
    return { success: false, reason: 'Too many failed attempts. Verification locked.' };
  }
  
  record.attempts += 1;
  
  const isValid = await verifyOtpHash(code, record.otpHash);
  if (!isValid) {
    return { success: false, reason: `Invalid verification code. ${record.maxAttempts - record.attempts} attempts remaining.` };
  }
  
  record.verifiedAt = new Date();
  memoryOtpStore.delete(normalizedEmail);
  
  return { success: true };
}

export default {
  generateOtpCode,
  hashOtp,
  verifyOtpHash,
  createAndStoreOtp,
  validateOtp
};
