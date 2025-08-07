/**
 * Enhanced Security Utilities
 * Provides secure implementations for common security operations
 */

import DOMPurify from 'dompurify';
import CryptoJS from 'crypto-js';

/**
 * Secure Random Generator
 * Uses Web Crypto API for cryptographically secure random values
 */
export class SecureRandom {
    /**
     * Generate secure random string
     * @param {number} length - Length of the random string
     * @returns {string} Secure random string
     */
    static generateString(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Generate secure session ID
     * @returns {string} Cryptographically secure session ID
     */
    static generateSessionId() {
        const timestamp = Date.now().toString(36);
        const randomPart = this.generateString(16);
        return `sess_${timestamp}_${randomPart}`;
    }

    /**
     * Generate secure token
     * @param {number} bytes - Number of random bytes
     * @returns {string} Base64 encoded secure token
     */
    static generateToken(bytes = 32) {
        const array = new Uint8Array(bytes);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode.apply(null, array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }
}

/**
 * Enhanced Encryption Service
 * Implements AES-256-GCM with proper key management
 */
export class EnhancedEncryption {
    constructor() {
        this.algorithm = 'AES-256-GCM';
        this.keySize = 256;
        this.ivSize = 16;
        this.tagSize = 16;
        this.saltSize = 32;
        this.iterations = 100000;
    }

    /**
     * Derive encryption key from password
     * @param {string} password - Password to derive key from
     * @param {string} salt - Salt for key derivation
     * @returns {CryptoKey} Derived encryption key
     */
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode(salt),
                iterations: this.iterations,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: this.keySize },
            true,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypt data using AES-256-GCM
     * @param {string} data - Data to encrypt
     * @param {string} password - Encryption password
     * @returns {Promise<string>} Encrypted data with metadata
     */
    async encrypt(data, password) {
        try {
            const encoder = new TextEncoder();
            const salt = SecureRandom.generateString(this.saltSize);
            const iv = crypto.getRandomValues(new Uint8Array(this.ivSize));
            const key = await this.deriveKey(password, salt);

            const encrypted = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                    tagLength: this.tagSize * 8
                },
                key,
                encoder.encode(data)
            );

            // Combine salt, iv, and encrypted data
            const combined = {
                salt: salt,
                iv: Array.from(iv),
                data: Array.from(new Uint8Array(encrypted)),
                version: '1.0'
            };

            return btoa(JSON.stringify(combined));
        } catch (error) {
            throw new Error('Encryption failed: ' + error.message);
        }
    }

    /**
     * Decrypt data using AES-256-GCM
     * @param {string} encryptedData - Encrypted data with metadata
     * @param {string} password - Decryption password
     * @returns {Promise<string>} Decrypted data
     */
    async decrypt(encryptedData, password) {
        try {
            const combined = JSON.parse(atob(encryptedData));
            const decoder = new TextDecoder();
            
            const key = await this.deriveKey(password, combined.salt);
            const iv = new Uint8Array(combined.iv);
            const data = new Uint8Array(combined.data);

            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                    tagLength: this.tagSize * 8
                },
                key,
                data
            );

            return decoder.decode(decrypted);
        } catch (error) {
            throw new Error('Decryption failed: ' + error.message);
        }
    }
}

/**
 * Input Sanitization Service
 * Provides comprehensive input sanitization using DOMPurify
 */
export class InputSanitizer {
    constructor() {
        // Configure DOMPurify for maximum security
        this.config = {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
            ALLOWED_ATTR: ['href', 'title'],
            ALLOW_DATA_ATTR: false,
            ALLOW_UNKNOWN_PROTOCOLS: false,
            SAFE_FOR_TEMPLATES: true,
            WHOLE_DOCUMENT: false,
            RETURN_DOM: false,
            RETURN_DOM_FRAGMENT: false,
            FORCE_BODY: true,
            SANITIZE_DOM: true,
            KEEP_CONTENT: true
        };
    }

    /**
     * Sanitize HTML input
     * @param {string} input - HTML input to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitizeHTML(input) {
        if (!input) return '';
        return DOMPurify.sanitize(input, this.config);
    }

    /**
     * Sanitize plain text (remove all HTML)
     * @param {string} input - Input to sanitize
     * @returns {string} Plain text without HTML
     */
    sanitizeText(input) {
        if (!input) return '';
        const cleaned = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
        return cleaned.trim();
    }

    /**
     * Sanitize email address
     * @param {string} email - Email to validate and sanitize
     * @returns {string|null} Sanitized email or null if invalid
     */
    sanitizeEmail(email) {
        if (!email) return null;
        
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const cleaned = this.sanitizeText(email).toLowerCase();
        
        return emailRegex.test(cleaned) ? cleaned : null;
    }

    /**
     * Sanitize URL
     * @param {string} url - URL to sanitize
     * @returns {string|null} Sanitized URL or null if invalid
     */
    sanitizeURL(url) {
        if (!url) return null;
        
        try {
            const urlObj = new URL(url);
            // Only allow http and https protocols
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                return null;
            }
            return urlObj.toString();
        } catch {
            return null;
        }
    }

    /**
     * Sanitize object (recursive)
     * @param {object} obj - Object to sanitize
     * @returns {object} Sanitized object
     */
    sanitizeObject(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeText(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
}

/**
 * HTTPS Enforcement
 * Ensures all connections use HTTPS in production
 */
export class HTTPSEnforcer {
    /**
     * Check if current connection is secure
     * @returns {boolean} True if HTTPS or localhost
     */
    static isSecure() {
        return window.location.protocol === 'https:' || 
               window.location.hostname === 'localhost' ||
               window.location.hostname === '127.0.0.1';
    }

    /**
     * Redirect to HTTPS if not secure
     */
    static enforceHTTPS() {
        if (!this.isSecure() && process.env.NODE_ENV === 'production') {
            window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
        }
    }

    /**
     * Get secure URL
     * @param {string} url - URL to secure
     * @returns {string} HTTPS URL
     */
    static getSecureURL(url) {
        if (!url) return '';
        
        try {
            const urlObj = new URL(url);
            if (urlObj.protocol === 'http:' && process.env.NODE_ENV === 'production') {
                urlObj.protocol = 'https:';
            }
            return urlObj.toString();
        } catch {
            return url;
        }
    }
}

/**
 * Rate Limiter
 * Implements in-memory rate limiting for API calls
 */
export class RateLimiter {
    constructor() {
        this.limits = new Map();
        this.defaultLimit = 100; // requests per window
        this.windowMs = 60000; // 1 minute window
    }

    /**
     * Check if request is allowed
     * @param {string} identifier - User or IP identifier
     * @param {number} limit - Maximum requests allowed
     * @returns {boolean} True if request is allowed
     */
    checkLimit(identifier, limit = this.defaultLimit) {
        const now = Date.now();
        const userLimits = this.limits.get(identifier) || { count: 0, resetTime: now + this.windowMs };

        // Reset if window has passed
        if (now > userLimits.resetTime) {
            userLimits.count = 0;
            userLimits.resetTime = now + this.windowMs;
        }

        // Check if limit exceeded
        if (userLimits.count >= limit) {
            return false;
        }

        // Increment counter
        userLimits.count++;
        this.limits.set(identifier, userLimits);

        // Clean up old entries periodically
        if (this.limits.size > 1000) {
            this.cleanup();
        }

        return true;
    }

    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, value] of this.limits.entries()) {
            if (now > value.resetTime + this.windowMs) {
                this.limits.delete(key);
            }
        }
    }

    /**
     * Get remaining requests for identifier
     * @param {string} identifier - User or IP identifier
     * @returns {number} Remaining requests
     */
    getRemainingRequests(identifier) {
        const userLimits = this.limits.get(identifier);
        if (!userLimits) return this.defaultLimit;
        
        const now = Date.now();
        if (now > userLimits.resetTime) {
            return this.defaultLimit;
        }
        
        return Math.max(0, this.defaultLimit - userLimits.count);
    }
}

/**
 * Password Validator
 * Enforces strong password requirements
 */
export class PasswordValidator {
    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @returns {object} Validation result with score and issues
     */
    static validate(password) {
        const issues = [];
        let score = 0;

        if (!password) {
            return { valid: false, score: 0, issues: ['Password is required'] };
        }

        // Length check
        if (password.length < 12) {
            issues.push('Password must be at least 12 characters');
        } else if (password.length >= 16) {
            score += 2;
        } else {
            score += 1;
        }

        // Uppercase check
        if (!/[A-Z]/.test(password)) {
            issues.push('Password must contain at least one uppercase letter');
        } else {
            score += 1;
        }

        // Lowercase check
        if (!/[a-z]/.test(password)) {
            issues.push('Password must contain at least one lowercase letter');
        } else {
            score += 1;
        }

        // Number check
        if (!/\d/.test(password)) {
            issues.push('Password must contain at least one number');
        } else {
            score += 1;
        }

        // Special character check
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            issues.push('Password must contain at least one special character');
        } else {
            score += 1;
        }

        // Common password check
        const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
        if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
            issues.push('Password contains common patterns');
            score = Math.max(0, score - 2);
        }

        return {
            valid: issues.length === 0,
            score: Math.min(5, score),
            strength: score <= 2 ? 'Weak' : score <= 3 ? 'Medium' : 'Strong',
            issues
        };
    }
}

// Export singleton instances
export const secureRandom = new SecureRandom();
export const enhancedEncryption = new EnhancedEncryption();
export const inputSanitizer = new InputSanitizer();
export const httpsEnforcer = new HTTPSEnforcer();
export const rateLimiter = new RateLimiter();
export const passwordValidator = new PasswordValidator();

// Auto-enforce HTTPS on load
if (typeof window !== 'undefined') {
    HTTPSEnforcer.enforceHTTPS();
}