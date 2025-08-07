/**
 * End-to-End Tests for Guest Feedback Flow
 */

import { GuestFeedbackService } from '../../src/services/GuestFeedbackService.js';
import { TextQualityService } from '../../src/services/TextQualityService.js';
import { SecurityComplianceService } from '../../src/services/SecurityComplianceService.js';

describe('Guest Feedback Flow - E2E Tests', () => {
    let feedbackService;
    let textService;
    let securityService;

    beforeEach(() => {
        feedbackService = new GuestFeedbackService();
        textService = new TextQualityService();
        securityService = new SecurityComplianceService();

        // Mock DOM for testing
        document.body.innerHTML = `
            <div id="feedback-form">
                <input id="guest-name" value="John Doe" />
                <input id="guest-email" value="john@test.com" />
                <textarea id="feedback-text">Great hotel experience!</textarea>
                <button id="submit-feedback">Submit</button>
            </div>
            <div id="feedback-list"></div>
        `;

        // Mock localStorage
        global.localStorage = {
            getItem: jest.fn(() => '[]'),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '';
    });

    describe('Complete Feedback Submission Flow', () => {
        test('should handle complete feedback submission from form to storage', async () => {
            // Step 1: Collect feedback from form
            const feedbackData = {
                guestName: document.getElementById('guest-name').value,
                guestEmail: document.getElementById('guest-email').value,
                feedbackText: document.getElementById('feedback-text').value,
                propertyId: 'hotel-001',
                roomNumber: '501'
            };

            // Step 2: Enhance text quality
            const enhancedText = await textService.enhanceText(feedbackData.feedbackText);
            expect(enhancedText).toBeDefined();
            expect(enhancedText.improved).toBeDefined();

            // Step 3: Validate GDPR compliance
            const gdprCompliant = securityService.validateGDPRCompliance({
                hasConsent: true,
                dataType: 'feedback',
                purpose: 'service_improvement'
            });
            expect(gdprCompliant).toBe(true);

            // Step 4: Submit feedback
            const result = feedbackService.submitFeedback(feedbackData);
            expect(result.success).toBe(true);
            expect(result.feedbackId).toBeDefined();

            // Step 5: Verify storage
            const storedFeedback = feedbackService.getFeedbackById(result.feedbackId);
            expect(storedFeedback).toBeDefined();
            expect(storedFeedback.guestName).toBe('John Doe');
        });

        test('should handle feedback request email flow', async () => {
            // Step 1: Create feedback request
            const request = feedbackService.createFeedbackRequest({
                guestName: 'Jane Smith',
                guestEmail: 'jane@test.com',
                checkoutDate: '2024-01-15',
                propertyName: 'Grand Hotel'
            });

            expect(request).toBeDefined();
            expect(request.template).toContain('Dear Jane Smith');
            expect(request.template).toContain('Grand Hotel');

            // Step 2: Schedule follow-up
            const followUp = feedbackService.scheduleFollowUp(request.id, 3);
            expect(followUp.scheduled).toBe(true);
            expect(followUp.followUpDate).toBeDefined();

            // Step 3: Track response
            feedbackService.trackEmailOpen(request.id);
            const analytics = feedbackService.getEmailAnalytics(request.id);
            expect(analytics.opened).toBe(true);
        });
    });

    describe('Multi-Property Management Flow', () => {
        test('should handle feedback across multiple properties', () => {
            // Submit feedback for Property A
            const feedbackA = feedbackService.submitFeedback({
                guestName: 'Guest A',
                propertyId: 'hotel-A',
                feedbackText: 'Excellent service',
                rating: 5
            });

            // Submit feedback for Property B
            const feedbackB = feedbackService.submitFeedback({
                guestName: 'Guest B',
                propertyId: 'hotel-B',
                feedbackText: 'Good experience',
                rating: 4
            });

            // Get property-specific feedback
            const propertyAFeedback = feedbackService.getFeedbackByProperty('hotel-A');
            const propertyBFeedback = feedbackService.getFeedbackByProperty('hotel-B');

            expect(propertyAFeedback.length).toBeGreaterThan(0);
            expect(propertyBFeedback.length).toBeGreaterThan(0);
            expect(propertyAFeedback[0].propertyId).toBe('hotel-A');
            expect(propertyBFeedback[0].propertyId).toBe('hotel-B');
        });

        test('should generate cross-property analytics', () => {
            // Add multiple feedback entries
            const properties = ['hotel-A', 'hotel-B', 'hotel-C'];
            properties.forEach(propertyId => {
                for (let i = 0; i < 3; i++) {
                    feedbackService.submitFeedback({
                        guestName: `Guest ${i}`,
                        propertyId,
                        rating: Math.floor(Math.random() * 5) + 1
                    });
                }
            });

            // Generate analytics
            const analytics = feedbackService.generateAnalytics({
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31'),
                groupBy: 'property'
            });

            expect(analytics).toBeDefined();
            expect(analytics.properties).toBeDefined();
            expect(Object.keys(analytics.properties).length).toBe(3);
        });
    });

    describe('Error Recovery Flow', () => {
        test('should handle and recover from submission errors', async () => {
            // Simulate network error
            const originalFetch = global.fetch;
            global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

            const feedbackData = {
                guestName: 'Error Test',
                feedbackText: 'Testing error handling'
            };

            // First attempt should fail
            const firstAttempt = await feedbackService.submitWithRetry(feedbackData);
            expect(firstAttempt.success).toBe(false);
            expect(firstAttempt.error).toContain('Network error');

            // Restore fetch for retry
            global.fetch = originalFetch;

            // Retry should succeed
            const retryAttempt = await feedbackService.retryFailedSubmissions();
            expect(retryAttempt.retried).toBeGreaterThan(0);
        });

        test('should validate and sanitize user input', () => {
            const maliciousInput = {
                guestName: '<script>alert("XSS")</script>',
                feedbackText: 'Normal feedback',
                email: 'invalid-email'
            };

            const sanitized = feedbackService.sanitizeInput(maliciousInput);
            
            expect(sanitized.guestName).not.toContain('<script>');
            expect(sanitized.email).toBe(null); // Invalid email rejected
            expect(sanitized.feedbackText).toBe('Normal feedback');
        });
    });

    describe('Integration with Other Services', () => {
        test('should integrate feedback with CRM system', async () => {
            // Submit feedback
            const feedback = feedbackService.submitFeedback({
                guestName: 'CRM Test',
                guestEmail: 'crm@test.com',
                feedbackText: 'Integration test'
            });

            // Simulate CRM sync
            const crmSync = await feedbackService.syncWithCRM(feedback.feedbackId, {
                crmSystem: 'Salesforce',
                apiKey: 'test-key'
            });

            expect(crmSync.success).toBe(true);
            expect(crmSync.crmRecordId).toBeDefined();
        });

        test('should export feedback for reporting', () => {
            // Add sample feedback
            for (let i = 0; i < 5; i++) {
                feedbackService.submitFeedback({
                    guestName: `Guest ${i}`,
                    rating: 4,
                    feedbackText: `Feedback ${i}`
                });
            }

            // Export in different formats
            const csvExport = feedbackService.exportFeedback('csv');
            const jsonExport = feedbackService.exportFeedback('json');
            const xlsxExport = feedbackService.exportFeedback('xlsx');

            expect(csvExport).toContain('guestName,rating,feedbackText');
            expect(JSON.parse(jsonExport)).toHaveLength(5);
            expect(xlsxExport).toBeDefined();
        });
    });
});