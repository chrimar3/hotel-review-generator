/**
 * CRM/PMS Integration Service
 * Provides APIs to integrate with hotel management systems
 * Supports data synchronization and automated workflow triggers
 */

import logger from '../utils/logger.js';
import CryptoJS from 'crypto-js';

class CRMIntegrationService {
    constructor(errorMonitor) {
        this.errorMonitor = errorMonitor;
        this.integrations = new Map();
        this.webhookHandlers = new Map();
        this.syncSchedules = new Map();
        this.apiCache = new Map();
        
        this.config = {
            enabled: true,
            syncInterval: 300000, // 5 minutes
            cacheTimeout: 60000, // 1 minute
            retryAttempts: 3,
            retryDelay: 5000,
            webhookSecret: this.generateWebhookSecret()
        };

        this.supportedSystems = {
            pms: {
                opera: {
                    name: 'Oracle Opera PMS',
                    apiVersion: 'v1',
                    endpoints: {
                        reservations: '/api/v1/reservations',
                        guests: '/api/v1/guests',
                        rooms: '/api/v1/rooms'
                    }
                },
                protel: {
                    name: 'Protel PMS',
                    apiVersion: 'v2',
                    endpoints: {
                        bookings: '/api/v2/bookings',
                        customers: '/api/v2/customers',
                        properties: '/api/v2/properties'
                    }
                },
                cloudbeds: {
                    name: 'Cloudbeds',
                    apiVersion: 'v1.1',
                    endpoints: {
                        reservations: '/api/v1.1/reservations',
                        guests: '/api/v1.1/guests',
                        properties: '/api/v1.1/properties'
                    }
                }
            },
            crm: {
                salesforce: {
                    name: 'Salesforce',
                    apiVersion: 'v59.0',
                    endpoints: {
                        contacts: '/services/data/v59.0/sobjects/Contact',
                        accounts: '/services/data/v59.0/sobjects/Account',
                        cases: '/services/data/v59.0/sobjects/Case'
                    }
                },
                hubspot: {
                    name: 'HubSpot',
                    apiVersion: 'v3',
                    endpoints: {
                        contacts: '/crm/v3/objects/contacts',
                        companies: '/crm/v3/objects/companies',
                        deals: '/crm/v3/objects/deals'
                    }
                }
            }
        };

        this.initialize();
    }

    initialize() {
        this.loadStoredIntegrations();
        this.setupWebhookHandlers();
        this.startSyncScheduler();
        
        logger.info(`[CRMIntegration] Service initialized with ${this.integrations.size} integrations`);
    }

    // Integration Management
    async addIntegration(systemType, systemName, config) {
        const integrationId = this.generateIntegrationId(systemType, systemName);
        
        const integration = {
            id: integrationId,
            type: systemType,
            system: systemName,
            config: {
                ...config,
                apiKey: this.encryptApiKey(config.apiKey),
                createdAt: new Date().toISOString()
            },
            status: 'pending',
            lastSync: null,
            syncErrors: [],
            metrics: {
                totalSyncs: 0,
                successfulSyncs: 0,
                failedSyncs: 0,
                lastSyncDuration: 0
            }
        };

        try {
            // Test connection
            const connectionTest = await this.testConnection(integration);
            if (connectionTest.success) {
                integration.status = 'active';
                this.integrations.set(integrationId, integration);
                this.saveIntegrations();
                
                // Start sync schedule if configured
                if (config.autoSync) {
                    this.scheduleSyncForIntegration(integrationId);
                }

                this.errorMonitor?.trackUserAction('integration_added', {
                    systemType,
                    systemName,
                    integrationId
                });

                return { success: true, integrationId };
            } else {
                throw new Error(connectionTest.error);
            }
        } catch (error) {
            this.errorMonitor?.trackError('integration_add_failed', error, {
                systemType,
                systemName
            });
            return { success: false, error: error.message };
        }
    }

    async testConnection(integration) {
        const system = this.supportedSystems[integration.type]?.[integration.system];
        if (!system) {
            return { success: false, error: 'Unsupported system' };
        }

        try {
            const apiKey = this.decryptApiKey(integration.config.apiKey);
            const baseUrl = integration.config.baseUrl;
            
            // Simple connectivity test
            const response = await this.makeApiRequest(integration, 'GET', '/health');
            
            return { 
                success: response.ok, 
                error: response.ok ? null : 'Connection failed' 
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async makeApiRequest(integration, method, endpoint, data = null) {
        const system = this.supportedSystems[integration.type]?.[integration.system];
        if (!system) {
            throw new Error('Unsupported system');
        }

        const apiKey = this.decryptApiKey(integration.config.apiKey);
        const baseUrl = integration.config.baseUrl;
        const url = baseUrl + endpoint;

        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'HotelReviewOptimizer/1.0'
        };

        // Add authentication headers based on system
        switch (integration.system) {
            case 'opera':
                headers['Authorization'] = `Bearer ${apiKey}`;
                break;
            case 'salesforce':
                headers['Authorization'] = `Bearer ${apiKey}`;
                break;
            case 'hubspot':
                headers['Authorization'] = `Bearer ${apiKey}`;
                break;
            default:
                headers['X-API-Key'] = apiKey;
        }

        const requestOptions = {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined
        };

        try {
            const response = await fetch(url, requestOptions);
            
            // Log request for debugging
            this.errorMonitor?.logInfo({
                type: 'api_request',
                integration: integration.id,
                method,
                endpoint,
                status: response.status
            });

            return response;
        } catch (error) {
            this.errorMonitor?.trackError('api_request_failed', error, {
                integration: integration.id,
                method,
                endpoint
            });
            throw error;
        }
    }

    // Data Synchronization
    async syncGuestData(integrationId) {
        const integration = this.integrations.get(integrationId);
        if (!integration || integration.status !== 'active') {
            throw new Error('Integration not available');
        }

        const syncStart = Date.now();
        
        try {
            let guestData = [];

            switch (integration.system) {
                case 'opera':
                    guestData = await this.syncOperaGuests(integration);
                    break;
                case 'protel':
                    guestData = await this.syncProtelCustomers(integration);
                    break;
                case 'cloudbeds':
                    guestData = await this.syncCloudbedsGuests(integration);
                    break;
                case 'salesforce':
                    guestData = await this.syncSalesforceContacts(integration);
                    break;
                case 'hubspot':
                    guestData = await this.syncHubspotContacts(integration);
                    break;
                default:
                    throw new Error(`Sync not implemented for ${integration.system}`);
            }

            // Process and store guest data
            const processedGuests = await this.processGuestData(guestData, integration);
            
            // Update integration metrics
            const syncDuration = Date.now() - syncStart;
            integration.metrics.totalSyncs++;
            integration.metrics.successfulSyncs++;
            integration.metrics.lastSyncDuration = syncDuration;
            integration.lastSync = new Date().toISOString();

            // Cache the results
            this.cacheData(`guests_${integrationId}`, processedGuests);

            this.errorMonitor?.trackUserAction('guest_data_synced', {
                integrationId,
                guestCount: processedGuests.length,
                syncDuration
            });

            return { success: true, data: processedGuests };
        } catch (error) {
            integration.metrics.failedSyncs++;
            integration.syncErrors.push({
                timestamp: new Date().toISOString(),
                error: error.message
            });

            this.errorMonitor?.trackError('guest_data_sync_failed', error, {
                integrationId
            });

            return { success: false, error: error.message };
        }
    }

    async syncOperaGuests(integration) {
        const response = await this.makeApiRequest(integration, 'GET', '/api/v1/guests?limit=100');
        const data = await response.json();
        return data.guests || [];
    }

    async syncProtelCustomers(integration) {
        const response = await this.makeApiRequest(integration, 'GET', '/api/v2/customers?limit=100');
        const data = await response.json();
        return data.customers || [];
    }

    async syncCloudbedsGuests(integration) {
        const response = await this.makeApiRequest(integration, 'GET', '/api/v1.1/guests?limit=100');
        const data = await response.json();
        return data.data || [];
    }

    async syncSalesforceContacts(integration) {
        const response = await this.makeApiRequest(integration, 'GET', 
            '/services/data/v59.0/sobjects/Contact?fields=Id,Name,Email,Phone');
        const data = await response.json();
        return data.records || [];
    }

    async syncHubspotContacts(integration) {
        const response = await this.makeApiRequest(integration, 'GET', 
            '/crm/v3/objects/contacts?properties=email,firstname,lastname,phone');
        const data = await response.json();
        return data.results || [];
    }

    async processGuestData(rawData, integration) {
        const processed = rawData.map(guest => {
            // Normalize guest data structure
            const normalizedGuest = this.normalizeGuestData(guest, integration.system);
            
            // Add metadata
            normalizedGuest.sourceSystem = integration.system;
            normalizedGuest.sourceId = integration.id;
            normalizedGuest.lastUpdated = new Date().toISOString();

            return normalizedGuest;
        });

        return processed;
    }

    normalizeGuestData(guest, systemType) {
        const normalized = {
            id: null,
            name: '',
            email: '',
            phone: '',
            address: {},
            preferences: {},
            stayHistory: [],
            reviewEligible: false
        };

        switch (systemType) {
            case 'opera':
                normalized.id = guest.guestId;
                normalized.name = `${guest.firstName} ${guest.lastName}`;
                normalized.email = guest.email;
                normalized.phone = guest.phoneNumber;
                break;
                
            case 'salesforce':
                normalized.id = guest.Id;
                normalized.name = guest.Name;
                normalized.email = guest.Email;
                normalized.phone = guest.Phone;
                break;

            case 'hubspot':
                normalized.id = guest.id;
                normalized.name = `${guest.properties.firstname} ${guest.properties.lastname}`;
                normalized.email = guest.properties.email;
                normalized.phone = guest.properties.phone;
                break;

            // Add more system-specific mappings as needed
        }

        return normalized;
    }

    // Webhook Handling
    setupWebhookHandlers() {
        // This would typically be handled by a backend service
        // For client-side, we'll simulate webhook handling via custom events
        
        document.addEventListener('crm-webhook', (event) => {
            this.handleWebhook(event.detail);
        });
    }

    async handleWebhook(webhookData) {
        const { integrationId, eventType, data } = webhookData;
        
        const handler = this.webhookHandlers.get(`${integrationId}_${eventType}`);
        if (handler) {
            try {
                await handler(data);
                this.errorMonitor?.trackUserAction('webhook_processed', {
                    integrationId,
                    eventType
                });
            } catch (error) {
                this.errorMonitor?.trackError('webhook_processing_failed', error, {
                    integrationId,
                    eventType
                });
            }
        }
    }

    registerWebhookHandler(integrationId, eventType, handler) {
        const key = `${integrationId}_${eventType}`;
        this.webhookHandlers.set(key, handler);
    }

    // Automated Review Triggers
    async setupReviewTriggers(integrationId, triggerConfig) {
        const integration = this.integrations.get(integrationId);
        if (!integration) return false;

        // Set up automated triggers based on guest checkout events
        this.registerWebhookHandler(integrationId, 'guest_checkout', async (guestData) => {
            if (triggerConfig.autoReviewRequest) {
                await this.triggerReviewRequest(guestData, triggerConfig);
            }
        });

        // Set up satisfaction survey triggers
        this.registerWebhookHandler(integrationId, 'survey_completed', async (surveyData) => {
            if (triggerConfig.generateFromSurvey && surveyData.score >= triggerConfig.minSatisfactionScore) {
                await this.generateReviewFromSurvey(surveyData);
            }
        });

        return true;
    }

    async triggerReviewRequest(guestData, config) {
        // This would send a review request to the guest
        // For now, we'll just log the trigger
        this.errorMonitor?.trackUserAction('review_request_triggered', {
            guestId: guestData.id,
            guestEmail: guestData.email,
            triggerType: 'checkout'
        });

        return { success: true, message: 'Review request triggered' };
    }

    // Export/Import Integration Data
    async exportIntegrationData(integrationId, format = 'json') {
        const cachedData = this.getCachedData(`guests_${integrationId}`);
        if (!cachedData) {
            await this.syncGuestData(integrationId);
            return this.getCachedData(`guests_${integrationId}`);
        }

        switch (format) {
            case 'csv':
                return this.convertToCSV(cachedData);
            case 'xlsx':
                return this.convertToXLSX(cachedData);
            default:
                return cachedData;
        }
    }

    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        const csvRows = data.map(row => 
            headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(',')
        );

        return [csvHeaders, ...csvRows].join('\n');
    }

    // Scheduling and Caching
    startSyncScheduler() {
        setInterval(() => {
            this.runScheduledSyncs();
        }, this.config.syncInterval);
    }

    async runScheduledSyncs() {
        for (const [integrationId, schedule] of this.syncSchedules) {
            const integration = this.integrations.get(integrationId);
            if (integration && integration.status === 'active') {
                const now = Date.now();
                if (now - schedule.lastRun >= schedule.interval) {
                    await this.syncGuestData(integrationId);
                    schedule.lastRun = now;
                }
            }
        }
    }

    scheduleSyncForIntegration(integrationId, interval = this.config.syncInterval) {
        this.syncSchedules.set(integrationId, {
            interval,
            lastRun: 0
        });
    }

    cacheData(key, data) {
        this.apiCache.set(key, {
            data,
            timestamp: Date.now()
        });

        // Clean up expired cache entries
        setTimeout(() => {
            this.apiCache.delete(key);
        }, this.config.cacheTimeout);
    }

    getCachedData(key) {
        const cached = this.apiCache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.config.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    // Security and Utilities
    encryptApiKey(apiKey) {
        // Use proper AES encryption with secure secret key
        const secretKey = this.getEncryptionKey();
        return CryptoJS.AES.encrypt(apiKey, secretKey).toString();
    }

    decryptApiKey(encryptedKey) {
        const secretKey = this.getEncryptionKey();
        const bytes = CryptoJS.AES.decrypt(encryptedKey, secretKey);
        return bytes.toString(CryptoJS.enc.Utf8);
    }

    getEncryptionKey() {
        // In production, this should be from environment variables or secure key management
        // Never hardcode keys in production!
        return process.env.ENCRYPTION_KEY || 'CHANGE_THIS_IN_PRODUCTION_USE_ENV_VAR';
    }

    generateIntegrationId(systemType, systemName) {
        return `${systemType}_${systemName}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }

    generateWebhookSecret() {
        return 'wh_' + Math.random().toString(36).substr(2, 32);
    }

    // Storage
    loadStoredIntegrations() {
        try {
            const stored = localStorage.getItem('crm_integrations');
            if (stored) {
                const integrations = JSON.parse(stored);
                integrations.forEach(integration => {
                    this.integrations.set(integration.id, integration);
                });
            }
        } catch (error) {
            this.errorMonitor?.trackError('integration_load_failed', error);
        }
    }

    saveIntegrations() {
        try {
            const integrations = Array.from(this.integrations.values());
            localStorage.setItem('crm_integrations', JSON.stringify(integrations));
        } catch (error) {
            this.errorMonitor?.trackError('integration_save_failed', error);
        }
    }

    // Public API
    getIntegrations() {
        return Array.from(this.integrations.values());
    }

    getIntegration(integrationId) {
        return this.integrations.get(integrationId) || null;
    }

    getSupportedSystems() {
        return this.supportedSystems;
    }

    async removeIntegration(integrationId) {
        const integration = this.integrations.get(integrationId);
        if (integration) {
            this.integrations.delete(integrationId);
            this.syncSchedules.delete(integrationId);
            this.saveIntegrations();
            
            this.errorMonitor?.trackUserAction('integration_removed', {
                integrationId,
                systemType: integration.type,
                systemName: integration.system
            });
            
            return true;
        }
        return false;
    }

    getIntegrationMetrics(integrationId) {
        const integration = this.integrations.get(integrationId);
        return integration?.metrics || null;
    }

    async refreshIntegration(integrationId) {
        return await this.syncGuestData(integrationId);
    }
}