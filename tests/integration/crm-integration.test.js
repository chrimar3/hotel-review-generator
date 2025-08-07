/**
 * Integration Tests for CRM Integration Service
 */

import { CRMIntegrationService } from '../../src/services/CRMIntegrationService.js';

describe('CRM Integration Service - Integration Tests', () => {
    let crmService;

    beforeEach(() => {
        crmService = new CRMIntegrationService();
        // Mock localStorage for testing
        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('System Integration', () => {
        test('should successfully connect to Salesforce', async () => {
            const config = {
                systemType: 'crm',
                systemName: 'Salesforce',
                apiKey: 'test-api-key',
                baseUrl: 'https://test.salesforce.com',
                webhookUrl: 'https://api.hotel.com/webhooks/salesforce'
            };

            const result = await crmService.connectSystem(config);

            expect(result.success).toBe(true);
            expect(result.integrationId).toBeDefined();
            expect(result.message).toContain('successfully connected');
        });

        test('should handle connection failures gracefully', async () => {
            const config = {
                systemType: 'crm',
                systemName: 'InvalidSystem',
                apiKey: '',
                baseUrl: 'invalid-url'
            };

            const result = await crmService.connectSystem(config);

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should sync guest data between systems', async () => {
            // First connect a system
            const config = {
                systemType: 'pms',
                systemName: 'Opera',
                apiKey: 'test-key',
                baseUrl: 'https://opera.test.com'
            };

            await crmService.connectSystem(config);

            // Test data sync
            const syncResult = await crmService.syncGuestData('Opera');

            expect(syncResult).toBeDefined();
            expect(syncResult.success).toBeDefined();
        });
    });

    describe('Data Export', () => {
        test('should export guest data to CSV format', () => {
            const guestData = [
                { name: 'John Doe', email: 'john@test.com', checkIn: '2024-01-01' },
                { name: 'Jane Smith', email: 'jane@test.com', checkIn: '2024-01-02' }
            ];

            const csv = crmService.convertToCSV(guestData);

            expect(csv).toContain('name,email,checkIn');
            expect(csv).toContain('John Doe');
            expect(csv).toContain('Jane Smith');
        });

        test('should export guest data to JSON format', () => {
            const guestData = [
                { name: 'John Doe', email: 'john@test.com' }
            ];

            const json = crmService.convertToJSON(guestData);
            const parsed = JSON.parse(json);

            expect(parsed).toEqual(guestData);
        });
    });

    describe('Security', () => {
        test('should encrypt API keys before storage', () => {
            const apiKey = 'my-secret-api-key';
            const encrypted = crmService.encryptApiKey(apiKey);

            expect(encrypted).not.toBe(apiKey);
            expect(encrypted).toBeDefined();
            expect(encrypted.length).toBeGreaterThan(0);
        });

        test('should decrypt API keys correctly', () => {
            const apiKey = 'my-secret-api-key';
            const encrypted = crmService.encryptApiKey(apiKey);
            const decrypted = crmService.decryptApiKey(encrypted);

            expect(decrypted).toBe(apiKey);
        });
    });

    describe('Error Handling', () => {
        test('should handle network errors during sync', async () => {
            // Mock network error
            global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

            const result = await crmService.syncGuestData('TestSystem');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to sync');
        });

        test('should validate configuration before connection', async () => {
            const invalidConfig = {
                systemType: '',
                systemName: ''
            };

            const result = await crmService.connectSystem(invalidConfig);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid configuration');
        });
    });
});