/**
 * A/B Testing Service
 * Comprehensive experimentation framework for conversion optimization
 * Extracted from main HTML file for better maintainability
 */

import logger from '../utils/logger.js';

export class ABTestingService {
    constructor(errorMonitor) {
        this.errorMonitor = errorMonitor;
        this.tests = new Map();
        this.userVariants = this.loadUserVariants();
        this.conversionEvents = ['review_generated', 'review_copied', 'platform_redirect', 'feature_selected'];
        
        this.initializeDefaultTests();
        logger.info(`[ABTesting] Framework initialized with ${this.tests.size} tests`);
    }

    loadUserVariants() {
        try {
            const stored = localStorage.getItem('hotelReview_abTests');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            this.errorMonitor?.trackError('ab_testing_load_variants', error);
            return {};
        }
    }

    saveUserVariants() {
        try {
            localStorage.setItem('hotelReview_abTests', JSON.stringify(this.userVariants));
        } catch (error) {
            this.errorMonitor?.trackError('ab_testing_save_variants', error);
        }
    }

    defineTest(testName, config) {
        const testConfig = {
            name: testName,
            variants: config.variants || ['control', 'variation'],
            trafficAllocation: config.trafficAllocation || 0.5,
            description: config.description || '',
            startDate: config.startDate || new Date().toISOString(),
            endDate: config.endDate || null,
            active: config.active !== false,
            conversionEvents: config.conversionEvents || this.conversionEvents
        };

        this.tests.set(testName, testConfig);

        // Assign user to variant if not already assigned
        if (!this.userVariants[testName] && this.isTestActive(testName)) {
            this.assignUserToVariant(testName);
        }

        return testConfig;
    }

    isTestActive(testName) {
        const test = this.tests.get(testName);
        if (!test || !test.active) return false;

        const now = new Date();
        const startDate = new Date(test.startDate);
        if (now < startDate) return false;

        if (test.endDate && now > new Date(test.endDate)) return false;

        return true;
    }

    assignUserToVariant(testName) {
        const test = this.tests.get(testName);
        if (!test) return null;

        // Use deterministic assignment based on sessionId for consistency
        const sessionId = this.errorMonitor?.getSessionId() || 'anonymous_' + Date.now();
        const hash = this.hashString(sessionId + testName);
        const random = (hash % 10000) / 10000; // 0-1 range

        // Determine variant based on traffic allocation
        let variant = 'control';
        let threshold = 0;
        
        for (const [index, variantName] of test.variants.entries()) {
            const allocation = Array.isArray(test.trafficAllocation) 
                ? test.trafficAllocation[index] || (1 / test.variants.length)
                : (1 / test.variants.length);
            
            threshold += allocation;
            if (random < threshold) {
                variant = variantName;
                break;
            }
        }

        this.userVariants[testName] = {
            variant: variant,
            assignedAt: new Date().toISOString(),
            sessionId: sessionId
        };

        this.saveUserVariants();

        // Track assignment
        this.errorMonitor?.trackUserAction('ab_test_assigned', {
            testName: testName,
            variant: variant,
            timestamp: new Date().toISOString()
        });

        logger.info(`[ABTesting] User assigned to ${testName}: ${variant}`);
        return variant;
    }

    getVariant(testName) {
        if (!this.isTestActive(testName)) return 'control';
        
        const userVariant = this.userVariants[testName];
        return userVariant ? userVariant.variant : 'control';
    }

    trackConversion(eventType, data = {}) {
        for (const [testName, test] of this.tests.entries()) {
            if (test.conversionEvents.includes(eventType) && this.isTestActive(testName)) {
                const variant = this.getVariant(testName);
                
                this.errorMonitor?.trackUserAction('ab_test_conversion', {
                    testName: testName,
                    variant: variant,
                    eventType: eventType,
                    data: data,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    initializeDefaultTests() {
        // Test 1: Copy Button Styling
        this.defineTest('copy_button_style', {
            description: 'Test different copy button designs for better conversion',
            variants: ['control', 'prominent', 'animated'],
            trafficAllocation: [0.4, 0.3, 0.3],
            conversionEvents: ['review_copied']
        });

        // Test 2: Feature Selection Layout
        this.defineTest('feature_layout', {
            description: 'Test grid vs list layout for feature selection',
            variants: ['grid', 'list'],
            trafficAllocation: 0.5,
            conversionEvents: ['feature_selected', 'review_generated']
        });

        // Test 3: Review Preview Position
        this.defineTest('preview_position', {
            description: 'Test preview position for better engagement',
            variants: ['bottom', 'right', 'modal'],
            trafficAllocation: [0.4, 0.3, 0.3],
            conversionEvents: ['review_generated', 'review_copied']
        });

        // Test 4: Character Counter Style
        this.defineTest('character_counter', {
            description: 'Test different character counter presentations',
            variants: ['minimal', 'detailed', 'progress_bar'],
            trafficAllocation: [0.33, 0.33, 0.34],
            conversionEvents: ['review_generated']
        });
    }

    applyVariantModifications() {
        // Apply all active test variants
        for (const [testName, test] of this.tests.entries()) {
            if (this.isTestActive(testName)) {
                const variant = this.getVariant(testName);
                this.applyTestVariant(testName, variant);
            }
        }
    }

    applyTestVariant(testName, variant) {
        switch (testName) {
            case 'copy_button_style':
                this.applyCopyButtonVariant(variant);
                break;
            case 'feature_layout':
                this.applyFeatureLayoutVariant(variant);
                break;
            case 'preview_position':
                this.applyPreviewPositionVariant(variant);
                break;
            case 'character_counter':
                this.applyCharacterCounterVariant(variant);
                break;
            default:
                logger.warn(`[ABTesting] Unknown test: ${testName}`);
        }
    }

    applyCopyButtonVariant(variant) {
        const copyButton = document.getElementById('copyButton');
        const stickyCopyButton = document.getElementById('stickyCopyButton');

        switch (variant) {
            case 'prominent':
                [copyButton, stickyCopyButton].forEach(button => {
                    if (button) {
                        button.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                        button.style.transform = 'scale(1.05)';
                        button.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
                        button.style.fontSize = '1.1rem';
                        button.style.fontWeight = '600';
                    }
                });
                break;

            case 'animated':
                [copyButton, stickyCopyButton].forEach(button => {
                    if (button) {
                        button.style.background = '#3b82f6';
                        button.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                        button.addEventListener('mouseenter', () => {
                            button.style.transform = 'translateY(-2px) scale(1.02)';
                            button.style.boxShadow = '0 12px 30px rgba(59, 130, 246, 0.4)';
                        });
                        button.addEventListener('mouseleave', () => {
                            button.style.transform = 'translateY(0) scale(1)';
                            button.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
                        });
                    }
                });
                break;

            default: // control
                // Keep default styling
                break;
        }
    }

    applyFeatureLayoutVariant(variant) {
        const featuresGrid = document.getElementById('featuresGrid');
        
        if (variant === 'list' && featuresGrid) {
            featuresGrid.style.display = 'flex';
            featuresGrid.style.flexDirection = 'column';
            featuresGrid.style.gap = '8px';
            
            // Modify feature items to list style
            const featureItems = featuresGrid.querySelectorAll('.feature-item');
            featureItems.forEach(item => {
                item.style.display = 'flex';
                item.style.alignItems = 'center';
                item.style.padding = '12px 16px';
                item.style.borderRadius = '8px';
                item.style.border = '2px solid #e2e8f0';
                item.style.backgroundColor = '#ffffff';
            });
        }
    }

    applyPreviewPositionVariant(variant) {
        const reviewPreview = document.getElementById('reviewPreview');
        
        switch (variant) {
            case 'right':
                if (reviewPreview && window.innerWidth > 768) {
                    const container = reviewPreview.closest('.container') || document.querySelector('.container');
                    if (container) {
                        container.style.display = 'grid';
                        container.style.gridTemplateColumns = '1fr 1fr';
                        container.style.gap = '24px';
                        reviewPreview.style.position = 'sticky';
                        reviewPreview.style.top = '24px';
                        reviewPreview.style.height = 'fit-content';
                    }
                }
                break;

            case 'modal':
                if (reviewPreview) {
                    reviewPreview.style.display = 'none'; // Hide default preview
                    // Modal preview will be shown on demand
                }
                break;

            default: // bottom (control)
                // Keep default position
                break;
        }
    }

    applyCharacterCounterVariant(variant) {
        const charCounter = document.getElementById('charCounter');
        
        switch (variant) {
            case 'detailed':
                if (charCounter) {
                    charCounter.style.fontSize = '0.9rem';
                    charCounter.style.padding = '8px 12px';
                    charCounter.style.backgroundColor = '#f8fafc';
                    charCounter.style.borderRadius = '6px';
                    charCounter.style.border = '1px solid #e2e8f0';
                }
                break;

            case 'progress_bar':
                if (charCounter && !document.getElementById('char-progress-bar')) {
                    const progressContainer = document.createElement('div');
                    progressContainer.style.width = '100%';
                    progressContainer.style.height = '4px';
                    progressContainer.style.backgroundColor = '#e2e8f0';
                    progressContainer.style.borderRadius = '2px';
                    progressContainer.style.marginTop = '4px';
                    
                    const progressBar = document.createElement('div');
                    progressBar.id = 'char-progress-bar';
                    progressBar.style.height = '100%';
                    progressBar.style.backgroundColor = '#3b82f6';
                    progressBar.style.borderRadius = '2px';
                    progressBar.style.transition = 'width 0.3s ease';
                    progressBar.style.width = '0%';
                    
                    progressContainer.appendChild(progressBar);
                    charCounter.appendChild(progressContainer);
                }
                break;

            default: // minimal (control)
                // Keep default styling
                break;
        }
    }

    getTestResults() {
        const results = {};
        for (const [testName, test] of this.tests.entries()) {
            results[testName] = {
                variant: this.getVariant(testName),
                active: this.isTestActive(testName),
                description: test.description
            };
        }
        return results;
    }

    getAllTests() {
        return Array.from(this.tests.values());
    }

    getUserVariants() {
        return { ...this.userVariants };
    }
}