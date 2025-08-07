/**
 * Centralized Error Handler
 * Provides consistent error handling across the application
 */

import logger from './logger.js';

export class ErrorHandler {
    constructor() {
        this.errorQueue = [];
        this.maxQueueSize = 100;
        this.errorListeners = new Set();
        this.setupGlobalErrorHandlers();
    }

    /**
     * Setup global error handlers for uncaught errors
     */
    setupGlobalErrorHandlers() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'uncaught',
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error
            });
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'unhandled_promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                error: event.reason
            });
        });
    }

    /**
     * Main error handling method
     * @param {Error|Object} error - Error object or error details
     * @param {Object} context - Additional context about the error
     * @returns {Object} Standardized error response
     */
    handleError(error, context = {}) {
        const errorInfo = this.normalizeError(error);
        const errorResponse = {
            success: false,
            error: {
                code: errorInfo.code,
                message: errorInfo.message,
                details: errorInfo.details,
                timestamp: new Date().toISOString(),
                context
            }
        };

        // Log the error
        this.logError(errorInfo, context);

        // Add to error queue
        this.addToQueue(errorResponse.error);

        // Notify listeners
        this.notifyListeners(errorResponse.error);

        // Send to monitoring service if critical
        if (errorInfo.severity === 'critical') {
            this.sendToMonitoring(errorResponse.error);
        }

        return errorResponse;
    }

    /**
     * Normalize different error formats into consistent structure
     */
    normalizeError(error) {
        if (error instanceof Error) {
            return {
                code: error.code || 'UNKNOWN_ERROR',
                message: error.message,
                details: error.stack,
                severity: this.determineSeverity(error),
                type: error.constructor.name
            };
        }

        if (typeof error === 'string') {
            return {
                code: 'STRING_ERROR',
                message: error,
                details: null,
                severity: 'medium',
                type: 'StringError'
            };
        }

        if (typeof error === 'object') {
            return {
                code: error.code || 'OBJECT_ERROR',
                message: error.message || JSON.stringify(error),
                details: error.details || error.stack || null,
                severity: error.severity || 'medium',
                type: error.type || 'ObjectError'
            };
        }

        return {
            code: 'UNKNOWN_ERROR',
            message: 'An unknown error occurred',
            details: String(error),
            severity: 'low',
            type: 'Unknown'
        };
    }

    /**
     * Determine error severity based on error type and content
     */
    determineSeverity(error) {
        const criticalPatterns = [
            /security/i,
            /authentication/i,
            /authorization/i,
            /database/i,
            /critical/i,
            /fatal/i
        ];

        const highPatterns = [
            /network/i,
            /api/i,
            /integration/i,
            /sync/i,
            /export/i
        ];

        const errorString = `${error.message} ${error.stack || ''}`;

        if (criticalPatterns.some(pattern => pattern.test(errorString))) {
            return 'critical';
        }

        if (highPatterns.some(pattern => pattern.test(errorString))) {
            return 'high';
        }

        if (error.name === 'TypeError' || error.name === 'ReferenceError') {
            return 'medium';
        }

        return 'low';
    }

    /**
     * Log error with appropriate level
     */
    logError(errorInfo, context) {
        const logData = {
            ...errorInfo,
            context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        switch (errorInfo.severity) {
            case 'critical':
                logger.critical(errorInfo.message, null, logData);
                break;
            case 'high':
                logger.error(errorInfo.message, null, logData);
                break;
            case 'medium':
                logger.warn(errorInfo.message, logData);
                break;
            default:
                logger.info(`Error: ${errorInfo.message}`, logData);
        }
    }

    /**
     * Add error to queue for batch processing
     */
    addToQueue(error) {
        this.errorQueue.push(error);
        
        // Maintain max queue size
        if (this.errorQueue.length > this.maxQueueSize) {
            this.errorQueue.shift();
        }
    }

    /**
     * Register error listener
     */
    addErrorListener(callback) {
        this.errorListeners.add(callback);
    }

    /**
     * Remove error listener
     */
    removeErrorListener(callback) {
        this.errorListeners.delete(callback);
    }

    /**
     * Notify all registered error listeners
     */
    notifyListeners(error) {
        this.errorListeners.forEach(listener => {
            try {
                listener(error);
            } catch (e) {
                logger.error('Error in error listener', e);
            }
        });
    }

    /**
     * Send critical errors to monitoring service
     */
    async sendToMonitoring(error) {
        try {
            await fetch('/api/errors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(error)
            });
        } catch (e) {
            // Silently fail to avoid infinite loop
            logger.error('Failed to send error to monitoring', e);
        }
    }

    /**
     * Get recent errors from queue
     */
    getRecentErrors(count = 10) {
        return this.errorQueue.slice(-count);
    }

    /**
     * Clear error queue
     */
    clearErrorQueue() {
        this.errorQueue = [];
    }

    /**
     * Standard error response factory methods
     */
    static validationError(message, field = null) {
        return {
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message,
                field,
                type: 'validation'
            }
        };
    }

    static networkError(message) {
        return {
            success: false,
            error: {
                code: 'NETWORK_ERROR',
                message: message || 'Network request failed',
                type: 'network'
            }
        };
    }

    static authenticationError(message) {
        return {
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: message || 'Authentication failed',
                type: 'authentication'
            }
        };
    }

    static permissionError(message) {
        return {
            success: false,
            error: {
                code: 'PERMISSION_ERROR',
                message: message || 'Permission denied',
                type: 'permission'
            }
        };
    }

    static notFoundError(resource) {
        return {
            success: false,
            error: {
                code: 'NOT_FOUND',
                message: `${resource} not found`,
                type: 'not_found'
            }
        };
    }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Export for use throughout application
export default errorHandler;

/**
 * Try-catch wrapper for async functions
 */
export async function tryAsync(fn, context = {}) {
    try {
        const result = await fn();
        return { success: true, data: result };
    } catch (error) {
        return errorHandler.handleError(error, context);
    }
}

/**
 * Try-catch wrapper for sync functions
 */
export function trySync(fn, context = {}) {
    try {
        const result = fn();
        return { success: true, data: result };
    } catch (error) {
        return errorHandler.handleError(error, context);
    }
}