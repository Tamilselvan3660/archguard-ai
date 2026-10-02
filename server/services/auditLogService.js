/**
 * ARCHGUARD AI — Audit & Security Log Service
 */

const memorySecurityEvents = [];

export async function logSecurityEvent(userId, email, eventType, ipAddress, userAgent, success, metadata = {}) {
  const event = {
    id: `sec-evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    userId,
    email,
    eventType,
    ipAddress,
    userAgent,
    success,
    metadata,
    timestamp: new Date().toISOString()
  };

  memorySecurityEvents.unshift(event);
  console.log(`[SECURITY EVENT] ${eventType} | ${email} | Success: ${success}`);

  // In production, this would persist to arch_security_events via Neon PG
}

export async function getRecentSecurityEvents(limit = 100) {
  // In production, this would fetch from arch_security_events
  return memorySecurityEvents.slice(0, limit);
}

export default {
  logSecurityEvent,
  getRecentSecurityEvents
};
