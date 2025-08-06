/**
 * Error Monitoring Service
 * Comprehensive error tracking and analytics system
 * Extracted from main HTML file for better maintainability
 */

export class ErrorMonitorService {
    constructor() {
        this.errors = [];
        this.sessionId = this.generateSessionId();
        this.userAgent = navigator.userAgent;
        this.maxErrors = 50;
        this.maxStoredErrors = 20;
        this.apiEndpoint = null;
        this.enabled = true;
        
        this.setupGlobalErrorHandlers();
        this.setupPerformanceMonitoring();
        this.setupConnectionMonitoring();
        
        if (typeof console !== 'undefined') {
            console.log(`[ErrorMonitor] Initialized with session ID: ${this.sessionId}`);
        }
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    setupGlobalErrorHandlers() {
        // JavaScript runtime errors
        window.addEventListener('error', (event) => {
            this.logError({
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: new Date().toISOString(),
                userAgent: this.userAgent,
                sessionId: this.sessionId
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                type: 'unhandled_promise_rejection',
                message: event.reason?.toString() || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId
            });
        });

        // Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.logError({
                    type: 'resource_error',
                    message: `Failed to load resource: ${event.target.src || event.target.href}`,
                    element: event.target.tagName,
                    timestamp: new Date().toISOString(),
                    sessionId: this.sessionId
                });
            }
        }, true);
    }

    setupPerformanceMonitoring() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (performance.getEntriesByType) {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData) {
                        this.logInfo({
                            type: 'performance_metrics',
                            loadTime: perfData.loadEventEnd - perfData.navigationStart,
                            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
                            firstContentfulPaint: this.getFirstContentfulPaint(),
                            timestamp: new Date().toISOString(),
                            sessionId: this.sessionId
                        });
                    }
                }
            }, 100);
        });
    }

    setupConnectionMonitoring() {
        window.addEventListener('online', () => {
            this.logInfo({
                type: 'connection_status',
                status: 'online',
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId
            });
        });

        window.addEventListener('offline', () => {
            this.logInfo({
                type: 'connection_status',
                status: 'offline',
                timestamp: new Date().toISOString(),
                sessionId: this.sessionId
            });
        });
    }

    getFirstContentfulPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcpEntry ? fcpEntry.startTime : null;
    }

    logError(errorData) {
        if (!this.enabled) return;
        
        const error = {
            id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            ...errorData,
            url: window.location.href,
            referrer: document.referrer
        };

        this.errors.push(error);
        this.trimErrorQueue();
        this.storeError(error);
        this.sendToExternalService(error);

        console.error('[ErrorMonitor]', error);
    }

    logWarning(warningData) {
        if (!this.enabled) return;
        
        const warning = {
            id: `warning_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            level: 'warning',
            ...warningData,
            url: window.location.href,
            sessionId: this.sessionId
        };

        this.logInfo(warning);
        console.warn('[ErrorMonitor]', warning);
    }

    logInfo(infoData) {
        if (!this.enabled) return;
        
        const info = {
            id: `info_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            level: 'info',
            ...infoData,
            url: window.location.href
        };

        this.errors.push(info);
        this.trimErrorQueue();
    }

    trackUserAction(action, data = {}) {
        if (!this.enabled) return;
        
        this.logInfo({
            type: 'user_action',
            action: action,
            data: data,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId
        });
    }

    trackError(context, error) {
        this.logError({
            type: 'application_error',
            context: context,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId
        });
    }

    trimErrorQueue() {
        if (this.errors.length > this.maxErrors) {
            this.errors = this.errors.slice(-this.maxErrors);
        }
    }

    storeError(error) {
        try {
            const storedErrors = this.getStoredErrors();
            storedErrors.push(error);
            
            if (storedErrors.length > this.maxStoredErrors) {
                storedErrors.shift();
            }
            
            localStorage.setItem('hotelReview_errors', JSON.stringify(storedErrors));
        } catch (e) {
            if (typeof console !== 'undefined') {
                console.warn('[ErrorMonitor] Could not store error in localStorage:', e);
            }
        }
    }

    getStoredErrors() {
        try {
            const stored = localStorage.getItem('hotelReview_errors');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    }

    clearStoredErrors() {
        try {
            localStorage.removeItem('hotelReview_errors');
        } catch (e) {
            if (typeof console !== 'undefined') {
                console.warn('[ErrorMonitor] Could not clear stored errors:', e);
            }
        }
    }

    async sendToExternalService(error) {
        if (!this.apiEndpoint) return;
        
        try {
            await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(error)
            });
        } catch (e) {
            if (typeof console !== 'undefined') {
                console.warn('[ErrorMonitor] Could not send error to external service:', e);
            }
        }
    }

    setApiEndpoint(endpoint) {
        this.apiEndpoint = endpoint;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    getErrors() {
        return [...this.errors];
    }

    getSessionId() {
        return this.sessionId;
    }
}