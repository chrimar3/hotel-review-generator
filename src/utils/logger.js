/**
 * Production-Ready Logger Service
 * Replaces console.log statements with structured logging
 */

class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3,
            critical: 4
        };
        this.isDevelopment = process.env.NODE_ENV !== 'production';
    }

    shouldLog(level) {
        return this.levels[level] >= this.levels[this.logLevel];
    }

    formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        return {
            timestamp,
            level,
            message,
            ...context,
            environment: process.env.NODE_ENV || 'development'
        };
    }

    log(level, message, context = {}) {
        if (!this.shouldLog(level)) return;

        const logEntry = this.formatMessage(level, message, context);

        // In production, send to logging service
        if (!this.isDevelopment) {
            this.sendToLoggingService(logEntry);
        } else {
            // In development, use console with proper formatting
            const consoleMethod = level === 'error' || level === 'critical' ? 'error' : 
                                level === 'warn' ? 'warn' : 'log';
            console[consoleMethod](`[${logEntry.timestamp}] [${level.toUpperCase()}] ${message}`, context);
        }
    }

    debug(message, context = {}) {
        this.log('debug', message, context);
    }

    info(message, context = {}) {
        this.log('info', message, context);
    }

    warn(message, context = {}) {
        this.log('warn', message, context);
    }

    error(message, error = null, context = {}) {
        const errorContext = {
            ...context,
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : null
        };
        this.log('error', message, errorContext);
    }

    critical(message, error = null, context = {}) {
        const errorContext = {
            ...context,
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : null
        };
        this.log('critical', message, errorContext);
    }

    sendToLoggingService(logEntry) {
        // In production, send to external logging service
        // This could be DataDog, LogRocket, Sentry, etc.
        if (typeof window !== 'undefined' && window.fetch) {
            // Example: Send to logging endpoint
            fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logEntry)
            }).catch(() => {
                // Silently fail to avoid infinite loop
            });
        }
    }

    // Group related logs
    group(label) {
        if (this.isDevelopment && console.group) {
            console.group(label);
        }
    }

    groupEnd() {
        if (this.isDevelopment && console.groupEnd) {
            console.groupEnd();
        }
    }

    // Performance logging
    time(label) {
        if (this.isDevelopment) {
            console.time(label);
        }
    }

    timeEnd(label) {
        if (this.isDevelopment) {
            console.timeEnd(label);
        }
    }
}

// Create singleton instance
const logger = new Logger();

// Export for use throughout application
export default logger;
export { Logger };