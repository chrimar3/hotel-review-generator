/**
 * Environment Variable Validator
 * Validates required environment variables on startup
 */

import { validateSecurityConfig } from '../config/security.config.js';

export class EnvironmentValidator {
    static requiredVars = {
        production: [
            'ENCRYPTION_KEY',
            'SESSION_SECRET', 
            'JWT_SECRET',
            'JWT_PRIVATE_KEY',
            'DATABASE_URL',
            'REDIS_URL',
            'EMAIL_SERVICE_API_KEY'
        ],
        development: [
            'ENCRYPTION_KEY'
        ]
    };

    static optionalVars = {
        'API_BASE_URL': 'http://localhost:3001',
        'SESSION_TIMEOUT': '1800000', // 30 minutes
        'RATE_LIMIT_WINDOW': '60000',  // 1 minute
        'RATE_LIMIT_MAX': '100'
    };

    /**
     * Validate environment configuration
     * @returns {object} Validation result
     */
    static validate() {
        const env = process.env.NODE_ENV || 'development';
        const required = this.requiredVars[env] || this.requiredVars.development;
        const errors = [];
        const warnings = [];

        console.log(`🔍 Validating environment variables for: ${env}`);

        // Check required variables
        required.forEach(varName => {
            if (!process.env[varName]) {
                errors.push(`Missing required environment variable: ${varName}`);
            } else if (this.isWeakValue(varName, process.env[varName])) {
                errors.push(`Weak value for ${varName}. Use a strong, unique value.`);
            }
        });

        // Set defaults for optional variables
        Object.entries(this.optionalVars).forEach(([varName, defaultValue]) => {
            if (!process.env[varName]) {
                process.env[varName] = defaultValue;
                warnings.push(`Using default value for ${varName}: ${defaultValue}`);
            }
        });

        // Validate security configuration
        try {
            validateSecurityConfig();
        } catch (error) {
            errors.push(`Security configuration error: ${error.message}`);
        }

        // Environment-specific validations
        if (env === 'production') {
            this.validateProductionEnvironment(errors, warnings);
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            environment: env
        };
    }

    /**
     * Check if a value is considered weak
     * @param {string} varName - Variable name
     * @param {string} value - Variable value
     * @returns {boolean} True if value is weak
     */
    static isWeakValue(varName, value) {
        const weakPatterns = [
            'CHANGE_THIS',
            'TODO',
            'REPLACE_ME',
            'DEFAULT',
            'EXAMPLE',
            'TEST',
            '123456',
            'password',
            'secret',
            'key'
        ];

        // Check minimum length for keys
        if (varName.includes('KEY') || varName.includes('SECRET')) {
            if (value.length < 32) {
                return true;
            }
        }

        // Check for weak patterns
        return weakPatterns.some(pattern => 
            value.toUpperCase().includes(pattern)
        );
    }

    /**
     * Production-specific validations
     * @param {array} errors - Error array to populate
     * @param {array} warnings - Warning array to populate
     */
    static validateProductionEnvironment(errors, warnings) {
        // Ensure HTTPS
        if (process.env.API_BASE_URL && !process.env.API_BASE_URL.startsWith('https://')) {
            errors.push('API_BASE_URL must use HTTPS in production');
        }

        // Check for development values
        const devPatterns = ['localhost', '127.0.0.1', '.local', 'dev.', 'test.'];
        Object.entries(process.env).forEach(([key, value]) => {
            if (devPatterns.some(pattern => value.includes(pattern))) {
                warnings.push(`${key} contains development value in production: ${value}`);
            }
        });

        // Ensure debug is disabled
        if (process.env.DEBUG === 'true') {
            warnings.push('DEBUG mode is enabled in production');
        }
    }

    /**
     * Generate .env template
     * @returns {string} Environment file template
     */
    static generateTemplate() {
        return `# Hotel Guest Communication System - Environment Variables

# === REQUIRED VARIABLES ===

# Encryption key for sensitive data (32+ characters)
ENCRYPTION_KEY=your-secure-32-character-encryption-key-here

# Session management secret
SESSION_SECRET=your-secure-session-secret-32-chars

# JWT secrets for API authentication  
JWT_SECRET=your-jwt-secret-key-32-characters
JWT_PRIVATE_KEY=your-jwt-private-key-or-path

# Database connection
DATABASE_URL=postgresql://username:password@host:port/database

# Redis for sessions and caching
REDIS_URL=redis://localhost:6379

# Email service
EMAIL_SERVICE_API_KEY=your-email-service-api-key

# === OPTIONAL VARIABLES ===

# API configuration
API_BASE_URL=https://api.hotel-guest-communication.com
API_VERSION=v1

# Rate limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100

# Session configuration
SESSION_TIMEOUT=1800000

# Feature flags
ENABLE_ANALYTICS=true
ENABLE_MONITORING=true

# External integrations
SENTRY_DSN=your-sentry-dsn-for-error-tracking
DATADOG_API_KEY=your-datadog-key-for-monitoring

# === DEVELOPMENT ONLY ===
# Uncomment for development
# NODE_ENV=development
# DEBUG=true
`;
    }

    /**
     * Initialize and validate environment
     * Called on application startup
     */
    static init() {
        const result = this.validate();

        // Log results
        if (result.warnings.length > 0) {
            console.warn('⚠️  Environment Warnings:');
            result.warnings.forEach(warning => console.warn(`   ${warning}`));
        }

        if (!result.valid) {
            console.error('❌ Environment Validation Failed:');
            result.errors.forEach(error => console.error(`   ${error}`));
            
            console.log('\n💡 Create a .env file with required variables:');
            console.log('   Copy the template below to .env file\n');
            console.log(this.generateTemplate());
            
            process.exit(1);
        }

        console.log(`✅ Environment validation passed for ${result.environment}`);
        return result;
    }
}

// Auto-validate on import in browser environment
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
    // Server-side validation
    EnvironmentValidator.init();
} else if (typeof window !== 'undefined') {
    // Client-side validation (limited)
    const requiredClientVars = ['API_BASE_URL'];
    const missing = requiredClientVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
        console.warn('⚠️  Missing client environment variables:', missing);
    }
}

export default EnvironmentValidator;