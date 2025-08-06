/**
 * Monitoring Configuration
 * Centralized configuration for production monitoring and alerting
 */

export const monitoringConfig = {
    // External monitoring services
    endpoints: {
        // Example endpoints - replace with actual monitoring service URLs
        metrics: process.env.METRICS_ENDPOINT || null,
        alerts: process.env.ALERTS_ENDPOINT || null,
        logs: process.env.LOGS_ENDPOINT || null,
    },
    
    // Performance thresholds for alerting
    thresholds: {
        performance: {
            firstContentfulPaint: 1500, // 1.5s
            largestContentfulPaint: 2500, // 2.5s
            firstInputDelay: 100, // 100ms
            cumulativeLayoutShift: 0.1,
            timeToInteractive: 3000, // 3s
            totalBlockingTime: 200 // 200ms
        },
        resource: {
            memoryUsage: 75 * 1024 * 1024, // 75MB threshold (increased for production)
            bundleSize: 1024 * 1024, // 1MB threshold
            requestCount: 20,
            errorRate: 0.03 // 3% error rate threshold
        },
        user: {
            sessionDuration: 45000, // 45s minimum for quality engagement
            interactionRate: 0.15, // 15% minimum interaction rate
            conversionRate: 0.05 // 5% minimum conversion rate
        },
        business: {
            reviewGenerationRate: 0.7, // 70% of users should generate reviews
            clipboardSuccessRate: 0.98, // 98% clipboard success rate
            featureSelectionRate: 0.85, // 85% should select features
            platformClickRate: 0.4 // 40% should click platform buttons
        }
    },
    
    // Alert severity levels
    severity: {
        thresholds: {
            critical: 2.0, // 2x over threshold
            warning: 1.5,  // 1.5x over threshold
            info: 1.2      // 1.2x over threshold
        }
    },
    
    // Sampling rates for different metric types
    sampling: {
        performance: 1.0,      // Sample all performance metrics
        userActions: 1.0,      // Sample all user actions
        errors: 1.0,           // Sample all errors
        businessMetrics: 1.0,  // Sample all business metrics
        debug: 0.1            // Sample 10% of debug events
    },
    
    // Data retention periods
    retention: {
        metrics: 3600000,      // 1 hour for detailed metrics
        alerts: 86400000,      // 24 hours for alerts
        errors: 604800000,     // 1 week for errors
        userSessions: 3600000  // 1 hour for user sessions
    },
    
    // Feature flags for monitoring components
    features: {
        realTimeMonitoring: true,
        performanceObserver: true,
        userBehaviorTracking: true,
        businessMetrics: true,
        memoryMonitoring: true,
        networkMonitoring: true,
        errorTracking: true,
        a11yMonitoring: true,
        dashboard: true
    },
    
    // Dashboard configuration
    dashboard: {
        updateInterval: 10000, // 10 seconds
        autoRefresh: true,
        showInDev: true,
        showInProduction: false, // Hide in production unless explicitly enabled
        position: 'bottom-right',
        minimized: false
    }
};

/**
 * Get environment-specific monitoring configuration
 */
export function getMonitoringConfig() {
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname.includes('dev') ||
                         window.location.protocol === 'file:';
    
    const isProduction = !isDevelopment && 
                        (window.location.hostname.includes('.com') || 
                         window.location.hostname.includes('.net') ||
                         window.location.hostname.includes('.org'));
    
    // Adjust configuration based on environment
    const config = { ...monitoringConfig };
    
    if (isDevelopment) {
        // More verbose monitoring in development
        config.sampling.debug = 1.0;
        config.dashboard.showInDev = true;
        config.thresholds.performance.firstContentfulPaint = 2000; // Relaxed for dev
    }
    
    if (isProduction) {
        // Production optimizations
        config.sampling.debug = 0.01; // Minimal debug sampling
        config.dashboard.showInProduction = false;
        config.retention.metrics = 7200000; // 2 hours in production
    }
    
    return config;
}

/**
 * Initialize monitoring with external service endpoints
 */
export function initializeMonitoringEndpoints(monitoringService) {
    const config = getMonitoringConfig();
    
    if (config.endpoints.metrics && config.endpoints.alerts) {
        monitoringService.setExternalEndpoints(
            config.endpoints.metrics,
            config.endpoints.alerts
        );
        console.log('[Monitoring] External endpoints configured');
    }
    
    // Apply custom thresholds
    monitoringService.setThresholds(config.thresholds);
    
    return config;
}