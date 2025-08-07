/**
 * Health Check Endpoints
 * Monitoring and status endpoints for the hotel guest communication system
 */

import logger from '../utils/logger.js';
import errorHandler from '../utils/errorHandler.js';

export class HealthCheckService {
    constructor(services) {
        this.services = services;
        this.startTime = Date.now();
    }

    /**
     * Basic health check endpoint
     */
    async basicHealthCheck() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            uptime: Date.now() - this.startTime,
            environment: process.env.NODE_ENV || 'development'
        };
    }

    /**
     * Comprehensive health check with service status
     */
    async detailedHealthCheck() {
        const healthData = await this.basicHealthCheck();
        
        try {
            const serviceHealth = await this.checkAllServices();
            
            return {
                ...healthData,
                services: serviceHealth,
                overall: this.determineOverallHealth(serviceHealth)
            };
        } catch (error) {
            logger.error('Health check failed', error);
            return {
                ...healthData,
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Check health of all integrated services
     */
    async checkAllServices() {
        const services = {
            database: await this.checkDatabase(),
            email: await this.checkEmailService(),
            integrations: await this.checkCrmIntegrations(),
            storage: await this.checkStorage(),
            security: await this.checkSecurityServices(),
            monitoring: await this.checkMonitoring()
        };

        return services;
    }

    /**
     * Database connectivity check
     */
    async checkDatabase() {
        try {
            // Mock database check - replace with actual database ping
            const start = Date.now();
            
            // Simulate database query
            await new Promise(resolve => setTimeout(resolve, 10));
            
            const responseTime = Date.now() - start;
            
            return {
                status: 'healthy',
                responseTime: `${responseTime}ms`,
                connections: {
                    active: 5,
                    idle: 15,
                    total: 20
                }
            };
        } catch (error) {
            logger.error('Database health check failed', error);
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Email service health check
     */
    async checkEmailService() {
        try {
            const start = Date.now();
            
            // Mock email service check
            const serviceStatus = {
                smtp: 'connected',
                queue: {
                    pending: 3,
                    failed: 0,
                    processed: 1247
                },
                responseTime: Date.now() - start
            };

            return {
                status: 'healthy',
                ...serviceStatus
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * CRM integration health check
     */
    async checkCrmIntegrations() {
        try {
            if (!this.services?.crmService) {
                return {
                    status: 'not_configured',
                    message: 'CRM service not initialized'
                };
            }

            const connectedSystems = this.services.crmService.getConnectedSystems();
            const healthyConnections = connectedSystems.filter(system => 
                system.status === 'connected'
            );

            return {
                status: healthyConnections.length > 0 ? 'healthy' : 'degraded',
                totalSystems: connectedSystems.length,
                healthySystems: healthyConnections.length,
                systems: connectedSystems.map(system => ({
                    name: system.systemName,
                    type: system.systemType,
                    status: system.status,
                    lastSync: system.lastSyncAt
                }))
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Storage system health check
     */
    async checkStorage() {
        try {
            // Check localStorage and other storage mechanisms
            const storageTests = {
                localStorage: this.testLocalStorage(),
                sessionStorage: this.testSessionStorage(),
                indexedDB: await this.testIndexedDB()
            };

            const healthyStorage = Object.values(storageTests).filter(test => test.status === 'healthy').length;
            
            return {
                status: healthyStorage > 0 ? 'healthy' : 'degraded',
                storage: storageTests
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Security services health check
     */
    async checkSecurityServices() {
        try {
            const securityChecks = {
                encryption: this.testEncryption(),
                authentication: this.testAuthentication(),
                headers: this.checkSecurityHeaders(),
                rateLimiting: this.checkRateLimiting()
            };

            const healthyChecks = Object.values(securityChecks).filter(check => check.status === 'healthy').length;
            
            return {
                status: healthyChecks === Object.keys(securityChecks).length ? 'healthy' : 'degraded',
                checks: securityChecks
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Monitoring system health check
     */
    async checkMonitoring() {
        try {
            if (!this.services?.monitoringService) {
                return {
                    status: 'not_configured',
                    message: 'Monitoring service not initialized'
                };
            }

            const systemStatus = this.services.monitoringService.getSystemStatus();
            
            return {
                status: 'healthy',
                metrics: systemStatus.metrics,
                alerts: systemStatus.alerts || [],
                lastUpdate: systemStatus.lastUpdate
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Test local storage functionality
     */
    testLocalStorage() {
        try {
            const testKey = '__health_check__';
            const testValue = 'test';
            
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            return {
                status: retrieved === testValue ? 'healthy' : 'unhealthy',
                available: true
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Test session storage functionality
     */
    testSessionStorage() {
        try {
            const testKey = '__health_check__';
            const testValue = 'test';
            
            sessionStorage.setItem(testKey, testValue);
            const retrieved = sessionStorage.getItem(testKey);
            sessionStorage.removeItem(testKey);
            
            return {
                status: retrieved === testValue ? 'healthy' : 'unhealthy',
                available: true
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Test IndexedDB functionality
     */
    async testIndexedDB() {
        try {
            if (!window.indexedDB) {
                return {
                    status: 'unavailable',
                    available: false,
                    message: 'IndexedDB not supported'
                };
            }

            return new Promise((resolve) => {
                const request = indexedDB.open('__health_check__', 1);
                
                request.onsuccess = () => {
                    request.result.close();
                    indexedDB.deleteDatabase('__health_check__');
                    resolve({
                        status: 'healthy',
                        available: true
                    });
                };
                
                request.onerror = () => {
                    resolve({
                        status: 'unhealthy',
                        available: true,
                        error: request.error?.message
                    });
                };
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    resolve({
                        status: 'timeout',
                        available: true,
                        error: 'IndexedDB test timeout'
                    });
                }, 5000);
            });
        } catch (error) {
            return {
                status: 'unhealthy',
                available: false,
                error: error.message
            };
        }
    }

    /**
     * Test encryption functionality
     */
    testEncryption() {
        try {
            if (this.services?.securityService) {
                const testData = 'health-check-test';
                const encrypted = this.services.securityService.encryptApiKey(testData);
                const decrypted = this.services.securityService.decryptApiKey(encrypted);
                
                return {
                    status: decrypted === testData ? 'healthy' : 'unhealthy',
                    functional: decrypted === testData
                };
            }
            
            return {
                status: 'not_configured',
                message: 'Security service not available'
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Test authentication functionality
     */
    testAuthentication() {
        try {
            if (this.services?.securityService) {
                // Test session creation
                const testSession = this.services.securityService.createSecureSession('health-check-user');
                const isValid = this.services.securityService.validateSession(testSession.sessionId);
                
                return {
                    status: isValid ? 'healthy' : 'unhealthy',
                    functional: isValid
                };
            }
            
            return {
                status: 'not_configured',
                message: 'Authentication service not available'
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Check security headers
     */
    checkSecurityHeaders() {
        try {
            const requiredHeaders = [
                'Content-Security-Policy',
                'X-Frame-Options',
                'X-Content-Type-Options'
            ];
            
            const metaTags = document.querySelectorAll('meta[http-equiv]');
            const presentHeaders = Array.from(metaTags).map(tag => 
                tag.getAttribute('http-equiv')
            );
            
            const hasRequiredHeaders = requiredHeaders.every(header => 
                presentHeaders.includes(header)
            );
            
            return {
                status: hasRequiredHeaders ? 'healthy' : 'degraded',
                requiredHeaders: requiredHeaders.length,
                presentHeaders: presentHeaders.length,
                missing: requiredHeaders.filter(header => 
                    !presentHeaders.includes(header)
                )
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Check rate limiting functionality
     */
    checkRateLimiting() {
        try {
            if (this.services?.securityService && 
                typeof this.services.securityService.checkRateLimit === 'function') {
                return {
                    status: 'healthy',
                    functional: true
                };
            }
            
            return {
                status: 'not_configured',
                message: 'Rate limiting not implemented'
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Determine overall system health
     */
    determineOverallHealth(serviceHealth) {
        const services = Object.values(serviceHealth);
        const healthyCount = services.filter(service => service.status === 'healthy').length;
        const unhealthyCount = services.filter(service => service.status === 'unhealthy').length;
        
        if (unhealthyCount > 0) {
            return 'unhealthy';
        }
        
        if (healthyCount === services.length) {
            return 'healthy';
        }
        
        return 'degraded';
    }

    /**
     * Performance metrics endpoint
     */
    async getPerformanceMetrics() {
        try {
            const navigation = performance.getEntriesByType('navigation')[0];
            const paintMetrics = performance.getEntriesByType('paint');
            
            return {
                timestamp: new Date().toISOString(),
                navigation: {
                    domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
                    loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
                    totalTime: navigation?.loadEventEnd - navigation?.fetchStart || 0
                },
                paint: {
                    firstPaint: paintMetrics.find(m => m.name === 'first-paint')?.startTime || 0,
                    firstContentfulPaint: paintMetrics.find(m => m.name === 'first-contentful-paint')?.startTime || 0
                },
                memory: {
                    used: performance.memory?.usedJSHeapSize || 0,
                    total: performance.memory?.totalJSHeapSize || 0,
                    limit: performance.memory?.jsHeapSizeLimit || 0
                },
                timing: {
                    responseStart: Date.now() - this.startTime
                }
            };
        } catch (error) {
            logger.error('Failed to get performance metrics', error);
            return errorHandler.handleError(error, { context: 'performance_metrics' });
        }
    }
}