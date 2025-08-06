/**
 * Main Application Entry Point
 * Coordinates all services and initializes the modular application
 */

import { AppCore } from './modules/AppCore.js';
import { MonitoringService } from './services/MonitoringService.js';
import { getMonitoringConfig, initializeMonitoringEndpoints } from './config/monitoring.js';
import { AccessibilityTester } from './tests/accessibility.test.js';

class Application {
    constructor() {
        this.appCore = null;
        this.monitoringService = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('[App] Starting application initialization...');
            const initStart = performance.now();

            // Initialize core application
            this.appCore = new AppCore();
            const coreInitialized = await this.appCore.initialize();
            
            if (!coreInitialized) {
                throw new Error('Core application failed to initialize');
            }

            // Initialize monitoring with error monitor reference
            this.monitoringService = new MonitoringService(this.appCore.getServices().errorMonitor);
            
            // Configure monitoring with environment-specific settings
            this.monitoringConfig = initializeMonitoringEndpoints(this.monitoringService);

            // Setup cross-service integrations
            this.setupIntegrations();

            // Run accessibility tests in development
            if (window.location.hostname === 'localhost' || window.location.search.includes('a11y-test=true')) {
                setTimeout(() => {
                    this.runAccessibilityTests();
                }, 2000);
            }

            const initEnd = performance.now();
            console.log(`[App] Application fully initialized in ${initEnd - initStart}ms`);

            this.isInitialized = true;
            
            // Dispatch ready event
            document.dispatchEvent(new CustomEvent('app-ready', {
                detail: { 
                    initTime: initEnd - initStart,
                    services: this.getServiceStatus()
                }
            }));

            return true;
        } catch (error) {
            console.error('[App] Application initialization failed:', error);
            
            // Try to report error if error monitor is available
            if (this.appCore?.getServices()?.errorMonitor) {
                this.appCore.getServices().errorMonitor.trackError('app_initialization_fatal', error);
            }

            return false;
        }
    }

    setupIntegrations() {
        // Integrate monitoring with business events
        document.addEventListener('review-generated', () => {
            this.monitoringService.recordMetric('business.reviewGenerated', {
                timestamp: Date.now(),
                source: 'app_event'
            });
        });

        document.addEventListener('review-copied', () => {
            this.monitoringService.recordMetric('business.reviewCopied', {
                timestamp: Date.now(),
                source: 'app_event'
            });
        });

        document.addEventListener('feature-selected', (event) => {
            this.monitoringService.recordMetric('business.featureSelected', {
                timestamp: Date.now(),
                feature: event.detail?.feature || 'unknown',
                source: 'app_event'
            });
        });

        document.addEventListener('platform-clicked', (event) => {
            this.monitoringService.recordMetric('business.platformClick', {
                timestamp: Date.now(),
                platform: event.detail?.platform || 'unknown',
                source: 'app_event'
            });
        });

        // Setup monitoring dashboard updates
        this.setupMonitoringDashboard();
    }

    setupMonitoringDashboard() {
        // Create monitoring dashboard element if it doesn't exist
        if (!document.getElementById('monitoring-dashboard')) {
            this.createMonitoringDashboard();
        }

        // Update dashboard periodically
        setInterval(() => {
            this.updateMonitoringDashboard();
        }, 10000); // Every 10 seconds
    }

    createMonitoringDashboard() {
        const dashboard = document.createElement('div');
        dashboard.id = 'monitoring-dashboard';
        dashboard.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
            font-size: 12px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            z-index: 10000;
            display: none;
            transition: all 0.3s ease;
        `;

        dashboard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #374151;">System Health</h3>
                <button id="dashboard-toggle" style="background: none; border: none; font-size: 16px; cursor: pointer;">📊</button>
            </div>
            <div id="dashboard-content">
                <div class="metric-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Performance:</span>
                    <span id="perf-status" style="color: #10b981;">Good</span>
                </div>
                <div class="metric-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Memory:</span>
                    <span id="memory-status" style="color: #10b981;">Normal</span>
                </div>
                <div class="metric-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Errors:</span>
                    <span id="error-count" style="color: #10b981;">0</span>
                </div>
                <div class="metric-row" style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span>Alerts:</span>
                    <span id="alert-count" style="color: #10b981;">0</span>
                </div>
            </div>
        `;

        document.body.appendChild(dashboard);

        // Toggle dashboard visibility
        const toggleButton = document.getElementById('dashboard-toggle');
        let isVisible = false;

        toggleButton.addEventListener('click', () => {
            isVisible = !isVisible;
            dashboard.style.display = isVisible ? 'block' : 'none';
        });

        // Show/hide based on configuration
        const config = this.monitoringConfig || getMonitoringConfig();
        const shouldShow = (config.dashboard.showInDev && window.location.hostname === 'localhost') ||
                          (config.dashboard.showInProduction && window.location.hostname !== 'localhost') ||
                          window.location.search.includes('debug=true');
        
        if (shouldShow) {
            dashboard.style.display = 'block';
            isVisible = true;
        }
    }

    updateMonitoringDashboard() {
        if (!this.monitoringService || !this.isInitialized) return;

        try {
            const dashboardData = this.monitoringService.getDashboardData();

            // Update performance status
            const perfElement = document.getElementById('perf-status');
            if (perfElement && dashboardData.performance) {
                const perfValue = dashboardData.performance.value || 0;
                if (perfValue < 1000) {
                    perfElement.textContent = 'Excellent';
                    perfElement.style.color = '#10b981';
                } else if (perfValue < 2000) {
                    perfElement.textContent = 'Good';
                    perfElement.style.color = '#f59e0b';
                } else {
                    perfElement.textContent = 'Poor';
                    perfElement.style.color = '#ef4444';
                }
            }

            // Update memory status
            const memoryElement = document.getElementById('memory-status');
            if (memoryElement && dashboardData.metrics.memory) {
                const memoryUsage = dashboardData.metrics.memory.used || 0;
                const memoryLimit = 50 * 1024 * 1024; // 50MB threshold
                
                if (memoryUsage < memoryLimit * 0.5) {
                    memoryElement.textContent = 'Low';
                    memoryElement.style.color = '#10b981';
                } else if (memoryUsage < memoryLimit * 0.8) {
                    memoryElement.textContent = 'Normal';
                    memoryElement.style.color = '#f59e0b';
                } else {
                    memoryElement.textContent = 'High';
                    memoryElement.style.color = '#ef4444';
                }
            }

            // Update error count
            const errorElement = document.getElementById('error-count');
            if (errorElement) {
                const errorCount = dashboardData.metrics.errors || 0;
                errorElement.textContent = errorCount.toString();
                errorElement.style.color = errorCount === 0 ? '#10b981' : 
                                         errorCount < 5 ? '#f59e0b' : '#ef4444';
            }

            // Update alert count
            const alertElement = document.getElementById('alert-count');
            if (alertElement && dashboardData.alerts) {
                const alertCount = dashboardData.alerts.total || 0;
                alertElement.textContent = alertCount.toString();
                alertElement.style.color = alertCount === 0 ? '#10b981' : 
                                         alertCount < 3 ? '#f59e0b' : '#ef4444';
            }
        } catch (error) {
            console.warn('[App] Failed to update monitoring dashboard:', error);
        }
    }

    // Public API methods
    getAppCore() {
        return this.appCore;
    }

    getMonitoringService() {
        return this.monitoringService;
    }

    getServiceStatus() {
        return {
            appCore: !!this.appCore?.isInitialized(),
            errorMonitor: !!this.appCore?.getServices()?.errorMonitor,
            abTesting: !!this.appCore?.getServices()?.abTesting,
            hapticFeedback: !!this.appCore?.getServices()?.hapticFeedback,
            accessibility: !!this.appCore?.getServices()?.accessibility,
            platformOptimization: !!this.appCore?.getServices()?.platformOptimization,
            monitoring: !!this.monitoringService
        };
    }

    isReady() {
        return this.isInitialized;
    }

    async runAccessibilityTests() {
        console.log('[App] Running comprehensive accessibility tests...');
        
        try {
            const tester = new AccessibilityTester();
            const report = await tester.runAllTests();
            
            // Log to monitoring service
            this.monitoringService.recordMetric('accessibility.audit', {
                score: report.score,
                level: report.level,
                failed: report.summary.failed,
                warnings: report.summary.warnings,
                timestamp: Date.now()
            });
            
            // Store report for debugging
            window.accessibilityReport = report;
            
            console.log(`[App] Accessibility audit completed. Score: ${report.score}/100 (${report.level})`);
            
            return report;
        } catch (error) {
            console.error('[App] Accessibility testing failed:', error);
            this.appCore?.getServices()?.errorMonitor?.trackError('accessibility_testing_failed', error);
            return null;
        }
    }
}

// Initialize application when DOM is ready
let app = null;

function initializeApplication() {
    if (app) {
        console.warn('[App] Application already initialized');
        return app;
    }

    app = new Application();
    app.initialize().then(success => {
        if (success) {
            console.log('[App] ✅ Application ready');
            // Make app globally available for debugging
            window.hotelReviewApp = app;
        } else {
            console.error('[App] ❌ Application failed to start');
        }
    });

    return app;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
    // DOM already loaded
    initializeApplication();
}

// Export for manual initialization if needed
export { Application, initializeApplication };