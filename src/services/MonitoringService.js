/**
 * Advanced Production Monitoring Service
 * Comprehensive monitoring, alerting, and performance tracking
 */

export class MonitoringService {
    constructor(errorMonitor) {
        this.errorMonitor = errorMonitor;
        this.metrics = new Map();
        this.alerts = [];
        this.thresholds = this.getDefaultThresholds();
        this.collectors = new Set();
        this.isEnabled = true;
        
        this.initializeMonitoring();
        console.log('[Monitoring] Advanced monitoring service initialized');
    }

    getDefaultThresholds() {
        return {
            performance: {
                firstContentfulPaint: 1500, // 1.5s
                largestContentfulPaint: 2500, // 2.5s
                firstInputDelay: 100, // 100ms
                cumulativeLayoutShift: 0.1,
                timeToInteractive: 3000, // 3s
                totalBlockingTime: 200 // 200ms
            },
            resource: {
                memoryUsage: 50 * 1024 * 1024, // 50MB
                bundleSize: 500 * 1024, // 500KB
                requestCount: 10,
                errorRate: 0.05 // 5%
            },
            user: {
                sessionDuration: 30000, // 30s minimum
                interactionRate: 0.1, // 10% minimum
                conversionRate: 0.02 // 2% minimum
            },
            business: {
                reviewGenerationRate: 0.6, // 60%
                clipboardSuccessRate: 0.95, // 95%
                featureSelectionRate: 0.8 // 80%
            }
        };
    }

    initializeMonitoring() {
        this.setupPerformanceObserver();
        this.setupMemoryMonitoring();
        this.setupNetworkMonitoring();
        this.setupUserBehaviorTracking();
        this.setupBusinessMetricsTracking();
        this.setupRealTimeAlerts();
        
        // Start monitoring loop
        this.startMonitoringLoop();
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // Core Web Vitals monitoring
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordMetric(`performance.${entry.name}`, {
                        value: entry.value || entry.startTime,
                        timestamp: Date.now(),
                        entryType: entry.entryType,
                        details: entry
                    });

                    this.checkThreshold(`performance.${entry.name}`, entry.value || entry.startTime);
                }
            });

            // Observe different performance metrics
            try {
                observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
            } catch (e) {
                console.warn('[Monitoring] Some performance observers not supported:', e);
            }

            // Navigation timing
            window.addEventListener('load', () => {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    this.recordMetric('performance.navigationTiming', {
                        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
                        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
                        firstByte: navigation.responseStart - navigation.navigationStart,
                        timestamp: Date.now()
                    });
                }
            });
        }
    }

    setupMemoryMonitoring() {
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                this.recordMetric('resource.memory', {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                });

                this.checkThreshold('resource.memory', memory.usedJSHeapSize);
            }, 30000); // Every 30 seconds
        }
    }

    setupNetworkMonitoring() {
        // Connection quality monitoring
        if ('connection' in navigator) {
            const connection = navigator.connection;
            this.recordMetric('network.connection', {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData,
                timestamp: Date.now()
            });

            connection.addEventListener('change', () => {
                this.recordMetric('network.connectionChange', {
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt,
                    timestamp: Date.now()
                });
            });
        }

        // Resource loading monitoring
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 1000) { // Log slow resources
                        this.recordMetric('resource.slowLoad', {
                            name: entry.name,
                            duration: entry.duration,
                            size: entry.transferSize,
                            timestamp: Date.now()
                        });
                    }
                }
            });

            try {
                resourceObserver.observe({ entryTypes: ['resource'] });
            } catch (e) {
                console.warn('[Monitoring] Resource observer not supported:', e);
            }
        }
    }

    setupUserBehaviorTracking() {
        let sessionStart = Date.now();
        let interactionCount = 0;
        let lastInteraction = sessionStart;

        // Track user interactions
        ['click', 'keydown', 'scroll', 'touchstart'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                interactionCount++;
                lastInteraction = Date.now();
            }, { passive: true });
        });

        // Track session metrics periodically
        setInterval(() => {
            const sessionDuration = Date.now() - sessionStart;
            const timeSinceLastInteraction = Date.now() - lastInteraction;
            
            this.recordMetric('user.session', {
                duration: sessionDuration,
                interactions: interactionCount,
                interactionRate: interactionCount / (sessionDuration / 1000 / 60), // interactions per minute
                lastInteraction: timeSinceLastInteraction,
                timestamp: Date.now()
            });

            // Session timeout detection
            if (timeSinceLastInteraction > 300000) { // 5 minutes
                this.recordMetric('user.sessionTimeout', {
                    duration: sessionDuration,
                    finalInteractionCount: interactionCount,
                    timestamp: Date.now()
                });
            }
        }, 60000); // Every minute

        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.recordMetric('user.visibilityChange', {
                visible: !document.hidden,
                timestamp: Date.now()
            });
        });

        // Rage clicks detection
        let clickTimes = [];
        document.addEventListener('click', (e) => {
            const now = Date.now();
            clickTimes.push(now);
            clickTimes = clickTimes.filter(time => now - time < 1000); // Last 1 second
            
            if (clickTimes.length >= 5) { // 5 clicks in 1 second
                this.recordMetric('user.rageClicks', {
                    element: e.target.tagName,
                    className: e.target.className,
                    clickCount: clickTimes.length,
                    timestamp: now
                });
                clickTimes = []; // Reset
            }
        });
    }

    setupBusinessMetricsTracking() {
        // Track key business metrics
        let reviewsGenerated = 0;
        let reviewsCopied = 0;
        let featuresSelected = 0;
        let platformClicks = 0;

        // Listen for business events
        document.addEventListener('review-generated', () => {
            reviewsGenerated++;
            this.recordMetric('business.reviewGenerated', {
                total: reviewsGenerated,
                timestamp: Date.now()
            });
        });

        document.addEventListener('review-copied', () => {
            reviewsCopied++;
            this.recordMetric('business.reviewCopied', {
                total: reviewsCopied,
                conversionRate: reviewsCopied / Math.max(reviewsGenerated, 1),
                timestamp: Date.now()
            });
        });

        document.addEventListener('feature-selected', () => {
            featuresSelected++;
            this.recordMetric('business.featureSelected', {
                total: featuresSelected,
                timestamp: Date.now()
            });
        });

        document.addEventListener('platform-clicked', () => {
            platformClicks++;
            this.recordMetric('business.platformClick', {
                total: platformClicks,
                timestamp: Date.now()
            });
        });

        // Periodic business metrics summary
        setInterval(() => {
            this.recordMetric('business.summary', {
                reviewsGenerated,
                reviewsCopied,
                featuresSelected,
                platformClicks,
                conversionRate: reviewsCopied / Math.max(reviewsGenerated, 1),
                timestamp: Date.now()
            });
        }, 300000); // Every 5 minutes
    }

    setupRealTimeAlerts() {
        // Critical error threshold
        let errorCount = 0;
        const errorWindow = 300000; // 5 minutes
        let errorTimes = [];

        this.errorMonitor.onError = (error) => {
            errorCount++;
            errorTimes.push(Date.now());
            errorTimes = errorTimes.filter(time => Date.now() - time < errorWindow);
            
            const errorRate = errorTimes.length / (errorWindow / 1000 / 60); // errors per minute
            
            if (errorRate > 2) { // More than 2 errors per minute
                this.createAlert('high_error_rate', {
                    rate: errorRate,
                    recentErrors: errorTimes.length,
                    severity: 'critical',
                    timestamp: Date.now()
                });
            }
        };
    }

    recordMetric(key, data) {
        if (!this.isEnabled) return;

        if (!this.metrics.has(key)) {
            this.metrics.set(key, []);
        }

        const metrics = this.metrics.get(key);
        metrics.push(data);

        // Keep only last 100 entries per metric
        if (metrics.length > 100) {
            metrics.shift();
        }

        // Send to external monitoring service
        this.sendToExternalService(key, data);
    }

    checkThreshold(metricKey, value) {
        const thresholdPath = metricKey.split('.');
        let threshold = this.thresholds;
        
        for (const path of thresholdPath) {
            threshold = threshold[path];
            if (!threshold) return;
        }

        if (value > threshold) {
            this.createAlert(`threshold_exceeded_${metricKey}`, {
                metric: metricKey,
                value: value,
                threshold: threshold,
                severity: this.getSeverity(metricKey, value, threshold),
                timestamp: Date.now()
            });
        }
    }

    getSeverity(metricKey, value, threshold) {
        const ratio = value / threshold;
        if (ratio > 2) return 'critical';
        if (ratio > 1.5) return 'warning';
        return 'info';
    }

    createAlert(type, data) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: type,
            ...data,
            acknowledged: false
        };

        this.alerts.push(alert);
        
        // Keep only last 50 alerts
        if (this.alerts.length > 50) {
            this.alerts.shift();
        }

        console.warn('[Monitoring] Alert created:', alert);
        
        // Send alert to external service
        this.sendAlert(alert);
        
        return alert;
    }

    async sendToExternalService(key, data) {
        // Send metrics to external monitoring service (e.g., DataDog, New Relic, etc.)
        if (this.externalEndpoint) {
            try {
                await fetch(`${this.externalEndpoint}/metrics`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key, data, timestamp: Date.now() })
                });
            } catch (error) {
                console.warn('[Monitoring] Failed to send metrics to external service:', error);
            }
        }
    }

    async sendAlert(alert) {
        if (this.alertEndpoint) {
            try {
                await fetch(`${this.alertEndpoint}/alerts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(alert)
                });
            } catch (error) {
                console.warn('[Monitoring] Failed to send alert:', error);
            }
        }
    }

    startMonitoringLoop() {
        setInterval(() => {
            this.collectSystemMetrics();
            this.performHealthCheck();
            this.cleanupOldData();
        }, 60000); // Every minute
    }

    collectSystemMetrics() {
        // Collect various system metrics
        const now = Date.now();
        
        // DOM metrics
        this.recordMetric('system.dom', {
            elements: document.querySelectorAll('*').length,
            scripts: document.scripts.length,
            styleSheets: document.styleSheets.length,
            timestamp: now
        });

        // Storage metrics
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            navigator.storage.estimate().then(estimate => {
                this.recordMetric('system.storage', {
                    quota: estimate.quota,
                    usage: estimate.usage,
                    usageDetails: estimate.usageDetails,
                    timestamp: now
                });
            });
        }

        // Battery API (if available)
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                this.recordMetric('system.battery', {
                    level: battery.level,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime,
                    timestamp: now
                });
            });
        }
    }

    performHealthCheck() {
        const healthMetrics = {
            timestamp: Date.now(),
            status: 'healthy',
            checks: {}
        };

        // Check error rate
        const recentErrors = this.getRecentMetrics('error', 300000); // Last 5 minutes
        healthMetrics.checks.errorRate = {
            status: recentErrors.length < 5 ? 'pass' : 'fail',
            value: recentErrors.length,
            threshold: 5
        };

        // Check memory usage
        const memoryMetrics = this.getLatestMetric('resource.memory');
        if (memoryMetrics) {
            const memoryOk = memoryMetrics.used < this.thresholds.resource.memoryUsage;
            healthMetrics.checks.memory = {
                status: memoryOk ? 'pass' : 'fail',
                value: memoryMetrics.used,
                threshold: this.thresholds.resource.memoryUsage
            };
        }

        // Check performance
        const performanceMetrics = this.getLatestMetric('performance.firstContentfulPaint');
        if (performanceMetrics) {
            const perfOk = performanceMetrics.value < this.thresholds.performance.firstContentfulPaint;
            healthMetrics.checks.performance = {
                status: perfOk ? 'pass' : 'fail',
                value: performanceMetrics.value,
                threshold: this.thresholds.performance.firstContentfulPaint
            };
        }

        // Overall health status
        const failedChecks = Object.values(healthMetrics.checks).filter(check => check.status === 'fail');
        if (failedChecks.length > 0) {
            healthMetrics.status = failedChecks.length > 2 ? 'critical' : 'degraded';
        }

        this.recordMetric('system.health', healthMetrics);
    }

    cleanupOldData() {
        const cutoffTime = Date.now() - 3600000; // 1 hour ago
        
        // Clean up old metrics
        for (const [key, metrics] of this.metrics) {
            const filteredMetrics = metrics.filter(metric => metric.timestamp > cutoffTime);
            this.metrics.set(key, filteredMetrics);
        }

        // Clean up old alerts
        this.alerts = this.alerts.filter(alert => alert.timestamp > cutoffTime);
    }

    // Public API methods
    getMetrics(key) {
        return this.metrics.get(key) || [];
    }

    getLatestMetric(key) {
        const metrics = this.getMetrics(key);
        return metrics[metrics.length - 1];
    }

    getRecentMetrics(key, timeWindow = 300000) { // 5 minutes default
        const cutoff = Date.now() - timeWindow;
        return this.getMetrics(key).filter(metric => metric.timestamp > cutoff);
    }

    getAlerts(severity = null) {
        if (severity) {
            return this.alerts.filter(alert => alert.severity === severity);
        }
        return [...this.alerts];
    }

    acknowledgeAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.acknowledgedAt = Date.now();
        }
        return alert;
    }

    getDashboardData() {
        return {
            metrics: {
                performance: this.getLatestMetric('performance.firstContentfulPaint'),
                memory: this.getLatestMetric('resource.memory'),
                errors: this.getRecentMetrics('error', 3600000).length, // Last hour
                users: this.getLatestMetric('user.session')
            },
            alerts: {
                critical: this.getAlerts('critical').filter(a => !a.acknowledged).length,
                warning: this.getAlerts('warning').filter(a => !a.acknowledged).length,
                total: this.alerts.filter(a => !a.acknowledged).length
            },
            health: this.getLatestMetric('system.health'),
            business: this.getLatestMetric('business.summary')
        };
    }

    setExternalEndpoints(metricsEndpoint, alertEndpoint) {
        this.externalEndpoint = metricsEndpoint;
        this.alertEndpoint = alertEndpoint;
    }

    setThresholds(newThresholds) {
        this.thresholds = { ...this.thresholds, ...newThresholds };
    }

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
    }
}