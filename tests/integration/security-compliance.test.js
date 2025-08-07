/**
 * Integration Tests for Security and Compliance
 */

import { SecurityComplianceService } from '../../src/services/SecurityComplianceService.js';
import bcrypt from 'bcrypt';

describe('Security Compliance Service - Integration Tests', () => {
    let securityService;

    beforeEach(() => {
        securityService = new SecurityComplianceService();
        
        // Mock localStorage
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };

        // Mock fetch for API calls
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Password Security', () => {
        test('should hash passwords using bcrypt with proper salt rounds', async () => {
            const password = 'MySecurePassword123!';
            const hashedPassword = await securityService.hashPassword(password);

            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hashes are long
            expect(hashedPassword).toMatch(/^\$2[aby]\$/); // bcrypt hash format
        });

        test('should verify passwords correctly', async () => {
            const password = 'TestPassword456!';
            const hashedPassword = await securityService.hashPassword(password);

            const isValid = await securityService.verifyPassword(password, hashedPassword);
            const isInvalid = await securityService.verifyPassword('WrongPassword', hashedPassword);

            expect(isValid).toBe(true);
            expect(isInvalid).toBe(false);
        });

        test('should handle bcrypt errors gracefully', async () => {
            // Test with invalid input
            await expect(securityService.hashPassword(null)).rejects.toThrow();
            
            const result = await securityService.verifyPassword('password', 'invalid-hash');
            expect(result).toBe(false);
        });
    });

    describe('GDPR Compliance', () => {
        test('should handle data erasure requests', async () => {
            const userId = 'user-123';
            
            // Store some user data
            securityService.storeUserData(userId, {
                name: 'John Doe',
                email: 'john@test.com',
                preferences: { newsletter: true }
            });

            // Request erasure
            const result = await securityService.handleDataErasure(userId);

            expect(result.success).toBe(true);
            expect(result.erasedData).toContain('personal_data');
            expect(result.erasedData).toContain('preferences');
            expect(result.timestamp).toBeDefined();
        });

        test('should export user data for portability', async () => {
            const userId = 'user-456';
            
            // Store various user data
            securityService.storeUserData(userId, {
                profile: { name: 'Jane Smith', email: 'jane@test.com' },
                feedback: ['Great service', 'Nice hotel'],
                bookings: [{ date: '2024-01-01', room: '101' }]
            });

            // Export data
            const exportedData = await securityService.exportUserData(userId);

            expect(exportedData).toBeDefined();
            expect(exportedData.profile).toBeDefined();
            expect(exportedData.feedback).toHaveLength(2);
            expect(exportedData.bookings).toHaveLength(1);
            expect(exportedData.exportDate).toBeDefined();
        });

        test('should track and validate consent', () => {
            const userId = 'user-789';

            // Grant consent
            securityService.recordConsent(userId, {
                purpose: 'marketing',
                granted: true,
                timestamp: new Date()
            });

            // Validate consent
            const hasConsent = securityService.hasValidConsent(userId, 'marketing');
            const noConsent = securityService.hasValidConsent(userId, 'analytics');

            expect(hasConsent).toBe(true);
            expect(noConsent).toBe(false);
        });
    });

    describe('Session Management', () => {
        test('should create secure sessions with proper tokens', () => {
            const userId = 'user-001';
            const session = securityService.createSecureSession(userId);

            expect(session.sessionId).toBeDefined();
            expect(session.sessionId.length).toBeGreaterThan(20);
            expect(session.userId).toBe(userId);
            expect(session.createdAt).toBeDefined();
            expect(session.expiresAt).toBeDefined();
        });

        test('should validate session tokens correctly', () => {
            const userId = 'user-002';
            const session = securityService.createSecureSession(userId);

            const isValid = securityService.validateSession(session.sessionId);
            const isInvalid = securityService.validateSession('fake-session-id');

            expect(isValid).toBe(true);
            expect(isInvalid).toBe(false);
        });

        test('should handle session expiration', () => {
            const userId = 'user-003';
            const session = securityService.createSecureSession(userId, { duration: 1 }); // 1ms duration

            // Wait for expiration
            setTimeout(() => {
                const isExpired = securityService.validateSession(session.sessionId);
                expect(isExpired).toBe(false);
            }, 10);
        });
    });

    describe('Audit Logging', () => {
        test('should log security events', () => {
            const events = [
                { type: 'login', userId: 'user-001', success: true },
                { type: 'data_access', userId: 'user-002', resource: 'feedback' },
                { type: 'password_change', userId: 'user-001', success: true }
            ];

            events.forEach(event => {
                securityService.logSecurityEvent(event);
            });

            const auditLog = securityService.getAuditLog();
            expect(auditLog.length).toBeGreaterThanOrEqual(3);
            expect(auditLog[0].type).toBe('login');
        });

        test('should detect suspicious activity patterns', () => {
            const userId = 'suspicious-user';

            // Simulate multiple failed login attempts
            for (let i = 0; i < 5; i++) {
                securityService.logSecurityEvent({
                    type: 'login',
                    userId,
                    success: false
                });
            }

            const isSuspicious = securityService.detectSuspiciousActivity(userId);
            expect(isSuspicious).toBe(true);
            expect(isSuspicious.reason).toContain('failed login attempts');
        });
    });

    describe('Data Encryption', () => {
        test('should encrypt sensitive data at rest', () => {
            const sensitiveData = {
                creditCard: '1234-5678-9012-3456',
                ssn: '123-45-6789',
                apiKey: 'secret-api-key'
            };

            const encrypted = securityService.encryptSensitiveData(sensitiveData);
            
            expect(encrypted).not.toEqual(sensitiveData);
            expect(encrypted.creditCard).not.toContain('1234');
            expect(encrypted.ssn).not.toContain('123');
            expect(encrypted.apiKey).not.toBe('secret-api-key');
        });

        test('should decrypt data correctly', () => {
            const originalData = {
                email: 'test@example.com',
                phone: '+1234567890'
            };

            const encrypted = securityService.encryptSensitiveData(originalData);
            const decrypted = securityService.decryptSensitiveData(encrypted);

            expect(decrypted).toEqual(originalData);
        });
    });

    describe('Rate Limiting', () => {
        test('should enforce rate limits on sensitive operations', async () => {
            const userId = 'rate-limited-user';
            const operation = 'password_reset';

            // First few attempts should succeed
            for (let i = 0; i < 3; i++) {
                const allowed = await securityService.checkRateLimit(userId, operation);
                expect(allowed).toBe(true);
            }

            // Exceeding rate limit should fail
            const blocked = await securityService.checkRateLimit(userId, operation);
            expect(blocked).toBe(false);
        });

        test('should reset rate limits after cooldown period', async () => {
            const userId = 'cooldown-user';
            const operation = 'api_request';

            // Exhaust rate limit
            for (let i = 0; i < 5; i++) {
                await securityService.checkRateLimit(userId, operation);
            }

            // Should be blocked
            let blocked = await securityService.checkRateLimit(userId, operation);
            expect(blocked).toBe(false);

            // Simulate cooldown period
            await securityService.resetRateLimit(userId, operation);

            // Should be allowed again
            const allowed = await securityService.checkRateLimit(userId, operation);
            expect(allowed).toBe(true);
        });
    });
});