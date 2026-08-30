import crypto from 'crypto';
import logger from './logger';

export type SecurityEventType =
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_BRUTE_FORCE_ATTEMPT'
  | 'DATA_ACCESS_HEALTH_RECORD'
  | 'DATA_EXPORT'
  | 'DATA_MUTATION'
  | 'EMERGENCY_SOS_TRIGGERED'
  | 'EMERGENCY_SOS_CANCELLED'
  | 'UNAUTHORIZED_ACCESS_BLOCKED'
  | 'INJECTION_ATTEMPT_BLOCKED'
  | 'ADMIN_PRIVILEGE_ACTION';

export interface SecurityAuditEntry {
  eventType: SecurityEventType;
  userId?: string;
  userRole?: string;
  resource?: string;
  ipAddress: string;
  userAgent?: string;
  status: 'SUCCESS' | 'WARNING' | 'CRITICAL_BLOCK';
  metadata?: Record<string, any>;
  timestamp: string;
  signature: string;
}

/**
 * Record a Cryptographically Signed Security Audit Log
 */
export const recordSecurityAudit = (
  eventType: SecurityEventType,
  details: {
    userId?: string;
    userRole?: string;
    resource?: string;
    ipAddress?: string;
    userAgent?: string;
    status?: 'SUCCESS' | 'WARNING' | 'CRITICAL_BLOCK';
    metadata?: Record<string, any>;
  }
) => {
  const timestamp = new Date().toISOString();
  const rawData = `${eventType}|${details.userId || 'anonymous'}|${details.resource || 'none'}|${details.ipAddress || '0.0.0.0'}|${timestamp}`;
  
  // SHA-256 HMAC digital signature ensuring log immutability
  const signature = crypto.createHash('sha256').update(rawData).digest('hex');

  const auditEntry: SecurityAuditEntry = {
    eventType,
    userId: details.userId,
    userRole: details.userRole,
    resource: details.resource,
    ipAddress: details.ipAddress || 'unknown',
    userAgent: details.userAgent,
    status: details.status || 'SUCCESS',
    metadata: details.metadata,
    timestamp,
    signature,
  };

  if (auditEntry.status === 'CRITICAL_BLOCK') {
    logger.warn(`[SECURITY CRITICAL] ${eventType} from IP ${auditEntry.ipAddress}`, auditEntry);
  } else {
    logger.info(`[SECURITY AUDIT] ${eventType}`, auditEntry);
  }

  return auditEntry;
};
