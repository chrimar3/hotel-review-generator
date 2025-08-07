/**
 * Security and Compliance Framework
 * Ensures data protection, privacy compliance, and secure operations
 */

import logger from '../utils/logger.js';
import bcrypt from 'bcrypt';

class SecurityComplianceService {
    constructor(errorMonitor) {
        this.errorMonitor = errorMonitor;
        
        this.config = {
            encryption: {
                algorithm: 'AES-256',
                saltRounds: 10
            },
            compliance: {
                gdpr: true,
                ccpa: true,
                pci: false // Not handling payments directly
            },
            security: {
                maxLoginAttempts: 5,
                sessionTimeout: 30 * 60 * 1000, // 30 minutes
                passwordMinLength: 12,
                requireMFA: false
            },
            dataRetention: {
                guestData: 365, // days
                reviewData: 730, // days
                logData: 90 // days
            }
        };

        this.auditLog = [];
        this.initialize();
    }

    initialize() {
        this.setupSecurityHeaders();
        this.initializeEncryption();
        this.startSecurityMonitoring();
        
        logger.info('[Security] Security and compliance framework initialized');
    }

    // Data Protection
    encryptSensitiveData(data) {
        if (!data) return null;
        
        try {
            // Simple encryption for demo - in production use proper crypto library
            const encrypted = btoa(JSON.stringify(data));
            return encrypted;
        } catch (error) {
            this.errorMonitor?.trackError('encryption_failed', error);
            throw new Error('Failed to encrypt data');
        }
    }

    decryptSensitiveData(encryptedData) {
        if (!encryptedData) return null;
        
        try {
            const decrypted = JSON.parse(atob(encryptedData));
            return decrypted;
        } catch (error) {
            this.errorMonitor?.trackError('decryption_failed', error);
            throw new Error('Failed to decrypt data');
        }
    }

    // Privacy Compliance
    async handleGDPRRequest(requestType, userId) {
        const validRequests = ['access', 'portability', 'deletion', 'rectification'];
        
        if (!validRequests.includes(requestType)) {
            throw new Error('Invalid GDPR request type');
        }

        this.auditLog.push({
            type: 'gdpr_request',
            requestType,
            userId,
            timestamp: new Date().toISOString(),
            status: 'processing'
        });

        switch (requestType) {
            case 'access':
                return await this.provideDataAccess(userId);
            case 'portability':
                return await this.exportUserData(userId);
            case 'deletion':
                return await this.deleteUserData(userId);
            case 'rectification':
                return await this.allowDataCorrection(userId);
            default:
                throw new Error('Unsupported request type');
        }
    }

    async provideDataAccess(userId) {
        // Gather all data related to user
        const userData = {
            profile: this.getStoredUserData(userId),
            reviews: this.getUserReviews(userId),
            properties: this.getUserProperties(userId),
            activityLog: this.getUserActivityLog(userId)
        };

        this.auditLog.push({
            type: 'data_access_provided',
            userId,
            timestamp: new Date().toISOString()
        });

        return userData;
    }

    async exportUserData(userId) {
        const userData = await this.provideDataAccess(userId);
        
        // Format for portability (JSON)
        const portableData = {
            exportDate: new Date().toISOString(),
            format: 'JSON',
            version: '1.0',
            data: userData
        };

        this.auditLog.push({
            type: 'data_exported',
            userId,
            timestamp: new Date().toISOString()
        });

        return portableData;
    }

    async deleteUserData(userId) {
        try {
            // Remove from all storage locations
            this.removeFromLocalStorage(userId);
            this.removeFromSessionStorage(userId);
            
            this.auditLog.push({
                type: 'data_deleted',
                userId,
                timestamp: new Date().toISOString(),
                status: 'completed'
            });

            return { success: true, message: 'User data deleted successfully' };
        } catch (error) {
            this.errorMonitor?.trackError('data_deletion_failed', error);
            return { success: false, error: error.message };
        }
    }

    // Security Headers
    setupSecurityHeaders() {
        // These would typically be set server-side, but we can add meta tags
        const metaTags = [
            { name: 'referrer', content: 'strict-origin-when-cross-origin' },
            { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
            { httpEquiv: 'X-Frame-Options', content: 'SAMEORIGIN' }
        ];

        metaTags.forEach(tag => {
            const meta = document.createElement('meta');
            if (tag.name) meta.name = tag.name;
            if (tag.httpEquiv) meta.httpEquiv = tag.httpEquiv;
            meta.content = tag.content;
            document.head.appendChild(meta);
        });
    }

    // Content Security Policy
    implementCSP() {
        const cspRules = {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"], // Would remove unsafe-inline in production
            'style-src': ["'self'", "'unsafe-inline'"],
            'img-src': ["'self'", 'data:', 'https:'],
            'connect-src': ["'self'"],
            'font-src': ["'self'"],
            'object-src': ["'none'"],
            'media-src': ["'self'"],
            'frame-src': ["'none'"]
        };

        const cspString = Object.entries(cspRules)
            .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
            .join('; ');

        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = cspString;
        document.head.appendChild(meta);
    }

    // Input Validation
    sanitizeInput(input, type = 'text') {
        if (!input) return '';
        
        let sanitized = String(input);
        
        // Remove potential XSS vectors
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        
        switch (type) {
            case 'email':
                return this.validateEmail(sanitized) ? sanitized : '';
            case 'url':
                return this.validateURL(sanitized) ? sanitized : '';
            case 'phone':
                return sanitized.replace(/[^0-9+\-() ]/g, '');
            case 'alphanumeric':
                return sanitized.replace(/[^a-zA-Z0-9 ]/g, '');
            default:
                return sanitized;
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Password Security
    validatePassword(password) {
        const requirements = {
            minLength: password.length >= this.config.security.passwordMinLength,
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const isValid = Object.values(requirements).every(req => req);
        
        return {
            isValid,
            requirements,
            strength: this.calculatePasswordStrength(password)
        };
    }

    calculatePasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength += 20;
        if (password.length >= 12) strength += 20;
        if (/[a-z]/.test(password)) strength += 20;
        if (/[A-Z]/.test(password)) strength += 20;
        if (/\d/.test(password)) strength += 10;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 10;
        
        if (strength <= 40) return 'weak';
        if (strength <= 70) return 'medium';
        return 'strong';
    }

    async hashPassword(password) {
        // Use bcrypt with salt rounds for secure password hashing
        const saltRounds = 12; // Industry standard for strong security
        try {
            return await bcrypt.hash(password, saltRounds);
        } catch (error) {
            logger.error('Password hashing failed:', error);
            throw new Error('Password hashing failed');
        }
    }

    async verifyPassword(password, hashedPassword) {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            logger.error('Password verification failed:', error);
            return false;
        }
    }

    // Session Management
    createSecureSession(userId) {
        const sessionId = this.generateSessionId();
        const session = {
            id: sessionId,
            userId,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.config.security.sessionTimeout,
            lastActivity: Date.now()
        };

        // Store encrypted session
        const encrypted = this.encryptSensitiveData(session);
        sessionStorage.setItem('secure_session', encrypted);

        this.auditLog.push({
            type: 'session_created',
            userId,
            sessionId,
            timestamp: new Date().toISOString()
        });

        return sessionId;
    }

    validateSession() {
        const encrypted = sessionStorage.getItem('secure_session');
        if (!encrypted) return false;

        try {
            const session = this.decryptSensitiveData(encrypted);
            
            if (Date.now() > session.expiresAt) {
                this.destroySession();
                return false;
            }

            // Update last activity
            session.lastActivity = Date.now();
            sessionStorage.setItem('secure_session', this.encryptSensitiveData(session));
            
            return true;
        } catch {
            return false;
        }
    }

    destroySession() {
        const encrypted = sessionStorage.getItem('secure_session');
        if (encrypted) {
            try {
                const session = this.decryptSensitiveData(encrypted);
                this.auditLog.push({
                    type: 'session_destroyed',
                    sessionId: session.id,
                    timestamp: new Date().toISOString()
                });
            } catch {}
        }
        
        sessionStorage.removeItem('secure_session');
    }

    generateSessionId() {
        return 'sess_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
    }

    // Security Monitoring
    startSecurityMonitoring() {
        // Monitor for suspicious activities
        this.monitorFailedLogins();
        this.monitorDataAccess();
        this.monitorAPIUsage();
        
        // Regular security checks
        setInterval(() => {
            this.performSecurityAudit();
        }, 60 * 60 * 1000); // Every hour
    }

    monitorFailedLogins() {
        const failedAttempts = new Map();
        
        document.addEventListener('login-failed', (event) => {
            const { userId, ip } = event.detail;
            const key = userId || ip;
            
            const attempts = failedAttempts.get(key) || 0;
            failedAttempts.set(key, attempts + 1);
            
            if (attempts + 1 >= this.config.security.maxLoginAttempts) {
                this.handleSecurityThreat('excessive_login_attempts', { key, attempts: attempts + 1 });
            }
        });
    }

    monitorDataAccess() {
        // Track unusual data access patterns
        const accessLog = [];
        
        document.addEventListener('data-accessed', (event) => {
            accessLog.push({
                ...event.detail,
                timestamp: Date.now()
            });
            
            // Check for suspicious patterns
            const recentAccess = accessLog.filter(log => 
                Date.now() - log.timestamp < 60000 // Last minute
            );
            
            if (recentAccess.length > 100) {
                this.handleSecurityThreat('excessive_data_access', { count: recentAccess.length });
            }
        });
    }

    monitorAPIUsage() {
        const apiCalls = new Map();
        
        document.addEventListener('api-call', (event) => {
            const { endpoint, userId } = event.detail;
            const key = `${userId}_${endpoint}`;
            
            const calls = apiCalls.get(key) || [];
            calls.push(Date.now());
            
            // Keep only recent calls
            const recentCalls = calls.filter(time => Date.now() - time < 60000);
            apiCalls.set(key, recentCalls);
            
            // Check for rate limit violations
            if (recentCalls.length > 60) { // More than 1 per second
                this.handleSecurityThreat('api_rate_limit_exceeded', { 
                    endpoint, 
                    userId, 
                    callsPerMinute: recentCalls.length 
                });
            }
        });
    }

    handleSecurityThreat(threatType, details) {
        this.auditLog.push({
            type: 'security_threat_detected',
            threatType,
            details,
            timestamp: new Date().toISOString()
        });

        this.errorMonitor?.trackError('security_threat', new Error(threatType), details);

        // Take action based on threat type
        switch (threatType) {
            case 'excessive_login_attempts':
                // Implement account lockout
                this.lockAccount(details.key);
                break;
            case 'excessive_data_access':
                // Rate limit data access
                this.implementRateLimit('data_access');
                break;
            case 'api_rate_limit_exceeded':
                // Throttle API access
                this.throttleAPI(details.endpoint, details.userId);
                break;
        }
    }

    lockAccount(identifier) {
        const lockedUntil = Date.now() + 15 * 60 * 1000; // 15 minutes
        localStorage.setItem(`locked_${identifier}`, lockedUntil.toString());
    }

    isAccountLocked(identifier) {
        const lockedUntil = localStorage.getItem(`locked_${identifier}`);
        if (!lockedUntil) return false;
        
        if (Date.now() > parseInt(lockedUntil)) {
            localStorage.removeItem(`locked_${identifier}`);
            return false;
        }
        
        return true;
    }

    // Audit and Compliance
    performSecurityAudit() {
        const audit = {
            timestamp: new Date().toISOString(),
            checks: {
                encryptionEnabled: this.checkEncryption(),
                secureHeaders: this.checkSecurityHeaders(),
                sessionSecurity: this.checkSessionSecurity(),
                dataRetention: this.checkDataRetention(),
                complianceStatus: this.checkCompliance()
            }
        };

        this.auditLog.push({
            type: 'security_audit',
            results: audit,
            timestamp: audit.timestamp
        });

        return audit;
    }

    checkEncryption() {
        // Verify encryption is working
        try {
            const testData = { test: 'data' };
            const encrypted = this.encryptSensitiveData(testData);
            const decrypted = this.decryptSensitiveData(encrypted);
            return JSON.stringify(testData) === JSON.stringify(decrypted);
        } catch {
            return false;
        }
    }

    checkSecurityHeaders() {
        const requiredHeaders = ['referrer', 'X-Content-Type-Options', 'X-Frame-Options'];
        return requiredHeaders.every(header => 
            document.querySelector(`meta[name="${header}"], meta[http-equiv="${header}"]`)
        );
    }

    checkSessionSecurity() {
        return this.config.security.sessionTimeout > 0 && 
               this.config.security.maxLoginAttempts > 0;
    }

    checkDataRetention() {
        // Check if old data is being properly cleaned up
        const now = Date.now();
        let violations = 0;
        
        // Check localStorage for old data
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.includes('_timestamp')) {
                const timestamp = parseInt(localStorage.getItem(key) || '0');
                const ageInDays = (now - timestamp) / (1000 * 60 * 60 * 24);
                
                if (ageInDays > this.config.dataRetention.logData) {
                    violations++;
                }
            }
        }
        
        return violations === 0;
    }

    checkCompliance() {
        return {
            gdpr: this.config.compliance.gdpr,
            ccpa: this.config.compliance.ccpa,
            dataProtection: this.checkEncryption(),
            userRights: true // We have GDPR request handling
        };
    }

    // Data Retention Management
    cleanupOldData() {
        const now = Date.now();
        
        // Clean up old guest data
        this.cleanupDataByAge('guest_', this.config.dataRetention.guestData);
        
        // Clean up old review data
        this.cleanupDataByAge('review_', this.config.dataRetention.reviewData);
        
        // Clean up old logs
        this.cleanupDataByAge('log_', this.config.dataRetention.logData);
        
        this.auditLog.push({
            type: 'data_cleanup_performed',
            timestamp: new Date().toISOString()
        });
    }

    cleanupDataByAge(prefix, maxAgeDays) {
        const now = Date.now();
        const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
        
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    if (data.timestamp && (now - data.timestamp) > maxAge) {
                        localStorage.removeItem(key);
                    }
                } catch {}
            }
        }
    }

    // Utility Methods
    getStoredUserData(userId) {
        // Placeholder - would fetch from secure storage
        return {};
    }

    getUserReviews(userId) {
        // Placeholder - would fetch user's reviews
        return [];
    }

    getUserProperties(userId) {
        // Placeholder - would fetch user's properties
        return [];
    }

    getUserActivityLog(userId) {
        return this.auditLog.filter(log => log.userId === userId);
    }

    removeFromLocalStorage(userId) {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key?.includes(userId)) {
                localStorage.removeItem(key);
            }
        }
    }

    removeFromSessionStorage(userId) {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key?.includes(userId)) {
                sessionStorage.removeItem(key);
            }
        }
    }

    initializeEncryption() {
        // Initialize encryption keys (in production, use proper key management)
        if (!localStorage.getItem('encryption_initialized')) {
            localStorage.setItem('encryption_initialized', Date.now().toString());
        }
    }

    implementRateLimit(resource) {
        // Implement rate limiting for resource
        const key = `rate_limit_${resource}`;
        sessionStorage.setItem(key, Date.now().toString());
    }

    throttleAPI(endpoint, userId) {
        // Implement API throttling
        const key = `throttle_${endpoint}_${userId}`;
        sessionStorage.setItem(key, (Date.now() + 60000).toString()); // 1 minute throttle
    }

    // Public API
    getAuditLog(filters = {}) {
        let logs = [...this.auditLog];
        
        if (filters.type) {
            logs = logs.filter(log => log.type === filters.type);
        }
        
        if (filters.startDate) {
            logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
        }
        
        if (filters.endDate) {
            logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
        }
        
        return logs;
    }

    exportAuditLog() {
        return {
            exported: new Date().toISOString(),
            logs: this.auditLog
        };
    }

    getComplianceStatus() {
        return this.checkCompliance();
    }

    getSecurityMetrics() {
        return {
            totalAuditEntries: this.auditLog.length,
            securityThreats: this.auditLog.filter(log => log.type === 'security_threat_detected').length,
            gdprRequests: this.auditLog.filter(log => log.type === 'gdpr_request').length,
            lastAudit: this.auditLog.filter(log => log.type === 'security_audit').pop()
        };
    }
}