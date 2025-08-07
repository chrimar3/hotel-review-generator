/**
 * Security Configuration
 * Centralized security settings for the hotel guest communication system
 */

export const securityConfig = {
    // Encryption settings
    encryption: {
        algorithm: 'AES-256-GCM',
        keySize: 256,
        iterations: 100000,
        saltSize: 32,
        ivSize: 16,
        tagSize: 16,
        keyRotationDays: 90
    },

    // Session management
    session: {
        timeout: 30 * 60 * 1000, // 30 minutes
        renewalThreshold: 5 * 60 * 1000, // Renew if < 5 minutes left
        maxConcurrentSessions: 3,
        secureCookie: true,
        sameSite: 'strict',
        httpOnly: true
    },

    // Password policy
    password: {
        minLength: 12,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventCommonPasswords: true,
        preventUserInfo: true,
        historyCount: 5,
        maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
        minAge: 24 * 60 * 60 * 1000 // 1 day
    },

    // Rate limiting
    rateLimit: {
        api: {
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 100,
            message: 'Too many requests, please try again later'
        },
        login: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxAttempts: 5,
            lockoutDuration: 30 * 60 * 1000, // 30 minutes
            message: 'Too many login attempts, account temporarily locked'
        },
        passwordReset: {
            windowMs: 60 * 60 * 1000, // 1 hour
            maxAttempts: 3,
            message: 'Too many password reset attempts'
        },
        feedbackSubmission: {
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 10,
            message: 'Feedback submission rate limit exceeded'
        }
    },

    // Content Security Policy
    csp: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'nonce-{{nonce}}'"],
            styleSrc: ["'self'", "'nonce-{{nonce}}'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.hotel-system.com"],
            mediaSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
            formAction: ["'self'"],
            baseUri: ["'self'"],
            upgradeInsecureRequests: true
        }
    },

    // Security headers
    headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
        'X-Permitted-Cross-Domain-Policies': 'none',
        'X-Download-Options': 'noopen',
        'X-DNS-Prefetch-Control': 'off'
    },

    // CORS configuration
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? ['https://hotel-guest-communication.com']
            : ['http://localhost:3000', 'http://127.0.0.1:3000'],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-CSRF-Token'],
        exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
        maxAge: 86400 // 24 hours
    },

    // Input validation
    validation: {
        maxInputLength: 10000,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
        allowedImageExtensions: ['.jpg', '.jpeg', '.png', '.gif'],
        allowedDocumentExtensions: ['.pdf', '.doc', '.docx'],
        sanitizeOptions: {
            allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
            allowedAttributes: {
                'a': ['href', 'title']
            },
            allowedSchemes: ['http', 'https', 'mailto']
        }
    },

    // Audit logging
    audit: {
        enabled: true,
        logLevel: 'info',
        events: [
            'login',
            'logout',
            'password_change',
            'permission_change',
            'data_access',
            'data_modification',
            'data_deletion',
            'api_access',
            'security_event'
        ],
        retention: 90 * 24 * 60 * 60 * 1000 // 90 days
    },

    // API security
    api: {
        requireAuthentication: true,
        requireHTTPS: true,
        apiKeyHeader: 'X-API-Key',
        jwtAlgorithm: 'RS256',
        jwtExpiration: '1h',
        refreshTokenExpiration: '7d',
        maxPayloadSize: '10mb'
    },

    // Data protection
    dataProtection: {
        encryptAtRest: true,
        encryptInTransit: true,
        anonymizeAfterDays: 365,
        deleteAfterDays: 730, // 2 years
        gdprCompliant: true,
        dataMinimization: true,
        purposeLimitation: true
    },

    // Security monitoring
    monitoring: {
        enableSecurityMonitoring: true,
        alertThresholds: {
            failedLogins: 10,
            suspiciousActivity: 5,
            highRiskOperations: 3
        },
        notificationChannels: ['email', 'sms', 'slack'],
        realTimeAlerts: true
    },

    // Backup and recovery
    backup: {
        enabled: true,
        frequency: 'daily',
        retention: 30, // days
        encryption: true,
        offsite: true,
        testRecovery: 'monthly'
    }
};

/**
 * Get CSP header with nonce
 * @param {string} nonce - Generated nonce value
 * @returns {string} CSP header value
 */
export function getCSPHeader(nonce) {
    const directives = Object.entries(securityConfig.csp.directives)
        .map(([key, values]) => {
            const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            const value = Array.isArray(values) 
                ? values.join(' ').replace(/{{nonce}}/g, nonce)
                : values;
            return `${directive} ${value}`;
        })
        .join('; ');
    
    return directives;
}

/**
 * Validate environment configuration
 * @throws {Error} If critical security configuration is missing
 */
export function validateSecurityConfig() {
    const requiredEnvVars = [
        'ENCRYPTION_KEY',
        'SESSION_SECRET',
        'JWT_SECRET'
    ];

    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required security environment variables: ${missing.join(', ')}`);
    }

    // Validate encryption key strength
    if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length < 32) {
        throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }

    // Ensure HTTPS in production
    if (process.env.NODE_ENV === 'production' && !securityConfig.api.requireHTTPS) {
        throw new Error('HTTPS must be required in production');
    }

    return true;
}

/**
 * Get security configuration for specific module
 * @param {string} module - Module name
 * @returns {object} Module-specific security configuration
 */
export function getModuleSecurityConfig(module) {
    return securityConfig[module] || {};
}

// Export default configuration
export default securityConfig;