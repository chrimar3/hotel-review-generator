/**
 * Application Core Module
 * Main application coordination and state management
 * Extracted from main HTML file for better maintainability
 */

import { ErrorMonitorService } from '../services/ErrorMonitorService.js';
import { ABTestingService } from '../services/ABTestingService.js';
import { HapticFeedbackService } from '../services/HapticFeedbackService.js';
import { AccessibilityService } from '../services/AccessibilityService.js';
import { TextQualityService } from '../services/TextQualityService.js';
import { GuestFeedbackService } from '../services/GuestFeedbackService.js';
import { MultiPropertyDashboard } from '../components/MultiPropertyDashboard.js';
import { CRMIntegrationService } from '../services/CRMIntegrationService.js';
import { CRMIntegrationPanel } from '../components/CRMIntegrationPanel.js';
import { ExportReportingService } from '../services/ExportReportingService.js';
import { ExportReportingPanel } from '../components/ExportReportingPanel.js';
import { SecurityComplianceService } from '../services/SecurityComplianceService.js';
import { UIEnhancementService } from '../services/UIEnhancementService.js';

export class AppCore {
    constructor() {
        this.config = {
            hotelName: 'Your Hotel',
            maxCommentLength: 200,
            features: [
                'excellent customer service',
                'clean and comfortable rooms', 
                'great location and accessibility',
                'delicious breakfast and dining',
                'modern amenities and facilities',
                'friendly and helpful staff',
                'peaceful and relaxing atmosphere',
                'excellent value for money'
            ],
            staffMembers: [
                'Sarah', 'Michael', 'Emma', 'David', 
                'Lisa', 'James', 'Maria', 'Alex'
            ],
            platforms: {
                booking: {
                    name: 'Booking.com',
                    url: 'https://www.booking.com/reviewcenter/write',
                    primary: true
                },
                expedia: {
                    name: 'Expedia',
                    url: 'https://www.expedia.com/ReviewCenter',
                    primary: true
                },
                tripadvisor: {
                    name: 'TripAdvisor',
                    url: 'https://www.tripadvisor.com/ReviewCenter',
                    primary: false
                },
                google: {
                    name: 'Google Maps',
                    url: 'https://maps.google.com/review',
                    primary: false
                }
            }
        };

        this.state = {
            hotelName: 'Your Hotel',
            source: 'direct',
            selectedFeatures: [],
            selectedStaff: null,
            personalComments: '',
            generatedReview: '',
            isInitialized: false,
            detectedSources: null
        };

        this.elements = {};
        this.services = {};
        this.components = {};
        
        this.initializeServices();
        console.log('[AppCore] Application core initialized');
    }

    initializeServices() {
        // Initialize services in dependency order
        this.services.errorMonitor = new ErrorMonitorService();
        this.services.abTesting = new ABTestingService(this.services.errorMonitor);
        this.services.hapticFeedback = new HapticFeedbackService(this.services.errorMonitor);
        this.services.accessibility = new AccessibilityService(this.services.errorMonitor);
        this.services.textQuality = new TextQualityService(this.services.errorMonitor);
        this.services.guestFeedback = new GuestFeedbackService(this.services.errorMonitor);
        this.services.crmIntegration = new CRMIntegrationService(this.services.errorMonitor);
        this.services.exportReporting = new ExportReportingService(this.services.errorMonitor);
        this.services.security = new SecurityComplianceService(this.services.errorMonitor);
        this.services.uiEnhancement = new UIEnhancementService(this.services.errorMonitor);
        
        // Track initialization
        this.services.errorMonitor.trackUserAction('app_core_initialized', {
            timestamp: new Date().toISOString(),
            services: Object.keys(this.services)
        });
    }

    async initialize() {
        try {
            const initStart = performance.now();
            
            // Initialize critical components first
            await this.initializeCriticalComponents();
            
            // Initialize enhancements asynchronously
            requestIdleCallback(() => {
                this.initializeEnhancements();
            }, { timeout: 100 });
            
            const initEnd = performance.now();
            this.services.errorMonitor.logInfo({
                type: 'app_initialization_complete',
                initTime: initEnd - initStart,
                elementsFound: Object.keys(this.elements).length,
                timestamp: new Date().toISOString()
            });

            this.state.isInitialized = true;
            console.log(`[AppCore] Application initialized in ${initEnd - initStart}ms`);
            
            return true;
        } catch (error) {
            this.services.errorMonitor.trackError('app_initialization_failed', error);
            console.error('[AppCore] Failed to initialize application:', error);
            return false;
        }
    }

    async initializeCriticalComponents() {
        // Setup DOM elements
        this.setupDOMElements();
        
        // Process URL parameters
        this.processURLParameters();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initial UI update
        this.updateUI();
    }

    initializeEnhancements() {
        // Apply A/B test variants
        this.services.abTesting.applyVariantModifications();
        
        // Initialize components
        this.initializeComponents();
        
        // Setup advanced features
        this.setupAdvancedFeatures();
    }

    initializeComponents() {
        // Initialize Multi-Property Dashboard
        this.components.multiPropertyDashboard = new MultiPropertyDashboard(this);
        
        // Initialize CRM Integration Panel
        this.components.crmIntegrationPanel = new CRMIntegrationPanel(
            this.services.crmIntegration, 
            this.services.errorMonitor
        );
        
        // Initialize Export & Reporting Panel
        this.components.exportReportingPanel = new ExportReportingPanel(
            this.services.exportReporting,
            this.services.errorMonitor
        );
        
        // Add dashboard trigger button if it doesn't exist
        this.addDashboardTrigger();
        this.addCRMTrigger();
        this.addExportTrigger();
    }

    addDashboardTrigger() {
        // Check if trigger already exists
        if (document.getElementById('property-dashboard-trigger')) return;

        // Create floating action button for property management
        const trigger = document.createElement('button');
        trigger.id = 'property-dashboard-trigger';
        trigger.innerHTML = '🏨';
        trigger.setAttribute('aria-label', 'Open Multi-Property Dashboard');
        trigger.style.cssText = `
            position: fixed;
            bottom: 80px;
            right: 20px;
            width: 56px;
            height: 56px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Hover effects
        trigger.addEventListener('mouseenter', () => {
            trigger.style.transform = 'scale(1.1)';
            trigger.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
        });

        trigger.addEventListener('mouseleave', () => {
            trigger.style.transform = 'scale(1)';
            trigger.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });

        // Click handler
        trigger.addEventListener('click', () => {
            this.components.multiPropertyDashboard.show();
            
            // Haptic feedback
            this.services.hapticFeedback?.contextualFeedback('button_press');
        });

        document.body.appendChild(trigger);
    }

    addCRMTrigger() {
        // Check if trigger already exists
        if (document.getElementById('crm-integration-trigger')) return;

        // Create floating action button for CRM integration
        const trigger = document.createElement('button');
        trigger.id = 'crm-integration-trigger';
        trigger.innerHTML = '🔗';
        trigger.setAttribute('aria-label', 'Open CRM Integration Panel');
        trigger.style.cssText = `
            position: fixed;
            bottom: 150px;
            right: 20px;
            width: 56px;
            height: 56px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Hover effects
        trigger.addEventListener('mouseenter', () => {
            trigger.style.transform = 'scale(1.1)';
            trigger.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
        });

        trigger.addEventListener('mouseleave', () => {
            trigger.style.transform = 'scale(1)';
            trigger.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });

        // Click handler
        trigger.addEventListener('click', () => {
            this.components.crmIntegrationPanel.show();
            
            // Haptic feedback
            this.services.hapticFeedback?.contextualFeedback('button_press');
        });

        document.body.appendChild(trigger);
    }

    addExportTrigger() {
        // Check if trigger already exists
        if (document.getElementById('export-reporting-trigger')) return;

        // Create floating action button for export/reporting
        const trigger = document.createElement('button');
        trigger.id = 'export-reporting-trigger';
        trigger.innerHTML = '📊';
        trigger.setAttribute('aria-label', 'Open Export & Reporting Panel');
        trigger.style.cssText = `
            position: fixed;
            bottom: 220px;
            right: 20px;
            width: 56px;
            height: 56px;
            background: #f59e0b;
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        // Hover effects
        trigger.addEventListener('mouseenter', () => {
            trigger.style.transform = 'scale(1.1)';
            trigger.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
        });

        trigger.addEventListener('mouseleave', () => {
            trigger.style.transform = 'scale(1)';
            trigger.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });

        // Click handler
        trigger.addEventListener('click', () => {
            this.components.exportReportingPanel.show();
            
            // Haptic feedback
            this.services.hapticFeedback?.contextualFeedback('button_press');
        });

        document.body.appendChild(trigger);
    }

    setupDOMElements() {
        const elementIds = [
            'hotelNameSpan', 'featuresGrid', 'staffGrid', 'personalComments',
            'charCounter', 'reviewPreview', 'copyButton', 'platformButtons',
            'stickyCopyButton'
        ];

        elementIds.forEach(id => {
            this.elements[id] = document.getElementById(id);
            if (!this.elements[id]) {
                console.warn(`[AppCore] Element not found: ${id}`);
            }
        });
    }

    processURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Hotel name
        const hotel = urlParams.get('hotel');
        if (hotel) {
            this.state.hotelName = hotel.replace(/[+-]/g, ' ');
            this.config.hotelName = this.state.hotelName;
        }

        // Source platform
        const source = urlParams.get('source');
        if (source && this.config.platforms[source]) {
            this.state.source = source;
        }

        // Update UI with parameters
        if (this.elements.hotelNameSpan) {
            this.elements.hotelNameSpan.textContent = this.state.hotelName;
        }
    }

    setupEventListeners() {
        // Feature selection
        if (this.elements.featuresGrid) {
            this.elements.featuresGrid.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    this.handleFeatureChange(e.target);
                }
            });
        }

        // Staff selection
        if (this.elements.staffGrid) {
            this.elements.staffGrid.addEventListener('change', (e) => {
                if (e.target.type === 'radio') {
                    this.handleStaffChange(e.target);
                }
            });
        }

        // Personal comments
        if (this.elements.personalComments) {
            this.elements.personalComments.addEventListener('input', (e) => {
                this.handleCommentsChange(e.target);
            });
        }

        // Copy button
        if (this.elements.copyButton) {
            this.elements.copyButton.addEventListener('click', () => {
                this.handleCopyClick();
            });
        }

        if (this.elements.stickyCopyButton) {
            this.elements.stickyCopyButton.addEventListener('click', () => {
                this.handleCopyClick();
            });
        }
    }

    handleFeatureChange(checkbox) {
        const value = checkbox.value;
        const isChecked = checkbox.checked;

        if (isChecked) {
            if (!this.state.selectedFeatures.includes(value)) {
                this.state.selectedFeatures.push(value);
            }
            
            // Haptic feedback
            this.services.hapticFeedback.contextualFeedback('feature_selected', {
                feature: value,
                totalSelected: this.state.selectedFeatures.length
            });

            // A/B testing conversion tracking
            this.services.abTesting.trackConversion('feature_selected', {
                feature: value,
                totalSelected: this.state.selectedFeatures.length
            });
        } else {
            this.state.selectedFeatures = this.state.selectedFeatures.filter(f => f !== value);
            
            this.services.hapticFeedback.contextualFeedback('feature_deselected', {
                feature: value,
                totalSelected: this.state.selectedFeatures.length
            });
        }

        this.updateUI();
        
        // Dispatch custom event for monitoring
        document.dispatchEvent(new CustomEvent('feature-selected', {
            detail: {
                feature: value,
                totalSelected: this.state.selectedFeatures.length
            }
        }));
    }

    handleStaffChange(radio) {
        this.state.selectedStaff = radio.checked ? radio.value : null;
        this.services.hapticFeedback.contextualFeedback('button_press');
        this.updateUI();
    }

    handleCommentsChange(textarea) {
        this.state.personalComments = textarea.value;
        this.updateCharacterCounter();
        this.updateReviewPreview();
    }

    async handleCopyClick() {
        if (!this.state.generatedReview) {
            this.services.errorMonitor.logWarning({
                type: 'clipboard_warning',
                message: 'Attempted to copy empty review'
            });
            return;
        }

        try {
            // Try modern clipboard API first
            await navigator.clipboard.writeText(this.state.generatedReview);
            
            this.services.errorMonitor.trackUserAction('clipboard_copy_success', {
                method: 'clipboard_api',
                reviewLength: this.state.generatedReview.length
            });

            this.services.abTesting.trackConversion('review_copied', {
                length: this.state.generatedReview.length,
                method: 'clipboard_api'
            });

            this.services.hapticFeedback.contextualFeedback('review_copied');
            this.showSuccessMessage('Review copied to clipboard! 📋');
            
            // Dispatch custom event for monitoring
            document.dispatchEvent(new CustomEvent('review-copied', {
                detail: {
                    length: this.state.generatedReview.length,
                    method: 'clipboard_api'
                }
            }));
            
        } catch (error) {
            // Fallback to execCommand
            try {
                const textArea = document.createElement('textarea');
                textArea.value = this.state.generatedReview;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                document.body.appendChild(textArea);
                textArea.select();
                
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (success) {
                    this.services.errorMonitor.trackUserAction('clipboard_copy_success', {
                        method: 'execCommand',
                        reviewLength: this.state.generatedReview.length
                    });

                    this.services.abTesting.trackConversion('review_copied', {
                        length: this.state.generatedReview.length,
                        method: 'execCommand'
                    });

                    this.showSuccessMessage('Review copied to clipboard! 📋');
                    
                    // Dispatch custom event for monitoring
                    document.dispatchEvent(new CustomEvent('review-copied', {
                        detail: {
                            length: this.state.generatedReview.length,
                            method: 'execCommand'
                        }
                    }));
                } else {
                    throw new Error('execCommand failed');
                }
            } catch (fallbackError) {
                this.services.errorMonitor.trackError('clipboard_complete_failure', fallbackError);
                this.showErrorMessage('Unable to copy. Please select and copy manually.');
            }
        }
    }

    generateReview() {
        if (this.state.selectedFeatures.length === 0 && !this.state.personalComments.trim()) {
            return '';
        }

        // Generate base review
        let review = `I had a wonderful stay at ${this.state.hotelName}.`;

        // Add selected features
        if (this.state.selectedFeatures.length > 0) {
            const features = [...this.state.selectedFeatures];
            
            if (features.length === 1) {
                review += ` The ${features[0]} was exceptional.`;
            } else if (features.length === 2) {
                review += ` The ${features[0]} and ${features[1]} were outstanding.`;
            } else {
                const lastFeature = features.pop();
                review += ` The ${features.join(', ')} were all excellent, and the ${lastFeature} was particularly impressive.`;
            }
        }

        // Add staff recognition
        if (this.state.selectedStaff) {
            const recognitionPhrases = [
                `Special thanks to ${this.state.selectedStaff} for exceptional service.`,
                `${this.state.selectedStaff} went above and beyond to make our stay memorable.`,
                `We were particularly impressed by ${this.state.selectedStaff}'s professionalism and helpfulness.`,
                `${this.state.selectedStaff} provided outstanding customer service throughout our stay.`
            ];
            const randomPhrase = recognitionPhrases[Math.floor(Math.random() * recognitionPhrases.length)];
            review += ` ${randomPhrase}`;
        }

        // Add personal comments
        if (this.state.personalComments.trim()) {
            review += ` ${this.state.personalComments.trim()}`;
        }

        review += ' I would definitely recommend this hotel and look forward to staying here again!';
        
        return review;
    }

    generateOptimizedReview(platformKey = null) {
        const baseReview = this.generateReview();
        if (!baseReview || !platformKey || !this.services.platformOptimization) {
            return baseReview;
        }

        try {
            // Create review object for optimization
            const reviewData = {
                content: baseReview,
                overallRating: 5, // Default high rating
                features: this.state.selectedFeatures,
                staff: this.state.selectedStaff,
                personalComments: this.state.personalComments
            };

            // Hotel data for context
            const hotelData = {
                name: this.state.hotelName,
                stayPurpose: 'leisure', // Could be determined from UI or defaults
                stayDate: 'Recently',
                roomType: 'Standard Room'
            };

            // Enhance review for specific platform
            const enhancedReview = this.services.platformOptimization.enhanceReviewForPlatform(
                reviewData, 
                platformKey, 
                hotelData
            );

            return enhancedReview.content;
        } catch (error) {
            console.warn('[AppCore] Platform optimization failed, using base review:', error);
            return baseReview;
        }
    }

    updateUI() {
        this.updateReviewPreview();
        this.updateCharacterCounter();
        this.updatePlatformButtons();
    }

    updateReviewPreview() {
        const review = this.generateReview();
        this.state.generatedReview = review;

        if (this.elements.reviewPreview) {
            if (review) {
                this.elements.reviewPreview.textContent = review;
                this.elements.reviewPreview.classList.remove('empty');
                
                // A/B testing conversion tracking
                this.services.abTesting.trackConversion('review_generated', {
                    length: review.length,
                    wordCount: review.split(' ').length,
                    featuresSelected: this.state.selectedFeatures.length,
                    hasStaff: !!this.state.selectedStaff,
                    hasComments: !!this.state.personalComments.trim()
                });

                // Dispatch custom event for monitoring
                document.dispatchEvent(new CustomEvent('review-generated', {
                    detail: {
                        length: review.length,
                        wordCount: review.split(' ').length,
                        featuresSelected: this.state.selectedFeatures.length
                    }
                }));
            } else {
                this.elements.reviewPreview.textContent = 'Your personalized review will appear here as you make selections above...';
                this.elements.reviewPreview.classList.add('empty');
            }
        }
    }

    updateCharacterCounter() {
        const length = this.state.personalComments.length;
        const remaining = this.config.maxCommentLength - length;
        const percentage = (length / this.config.maxCommentLength) * 100;

        if (this.elements.charCounter) {
            const counterElement = this.elements.charCounter.querySelector('span:last-child');
            const progressElement = this.elements.charCounter.querySelector('span:first-child');
            
            if (counterElement) {
                if (remaining > 0) {
                    counterElement.textContent = `${length}/${this.config.maxCommentLength} characters`;
                } else {
                    counterElement.textContent = `${Math.abs(remaining)} characters over limit`;
                }
            }

            if (progressElement) {
                const progressBar = `${'█'.repeat(Math.floor(percentage / 10))}${'░'.repeat(10 - Math.floor(percentage / 10))}`;
                progressElement.textContent = progressBar;
            }

            // Update progress bar for A/B testing variant
            const progressBarElement = document.getElementById('char-progress-bar');
            if (progressBarElement) {
                progressBarElement.style.width = `${Math.min(percentage, 100)}%`;
                
                if (percentage < 50) {
                    progressBarElement.style.backgroundColor = '#3b82f6';
                } else if (percentage < 80) {
                    progressBarElement.style.backgroundColor = '#f59e0b';
                } else if (percentage < 100) {
                    progressBarElement.style.backgroundColor = '#ef4444';
                } else {
                    progressBarElement.style.backgroundColor = '#dc2626';
                }
            }

            // Update counter classes
            this.elements.charCounter.classList.remove('warning', 'error', 'excellent', 'good');
            
            if (percentage >= 90) {
                this.elements.charCounter.classList.add(percentage >= 100 ? 'error' : 'warning');
            } else if (percentage >= 60) {
                this.elements.charCounter.classList.add('good');
            } else if (percentage >= 30) {
                this.elements.charCounter.classList.add('excellent');
            }
        }
    }

    updatePlatformButtons() {
        const platformButtons = document.getElementById('platformButtons');
        if (!platformButtons || !this.services.platformOptimization) return;

        // Get supported platforms from optimization service
        const supportedPlatforms = this.services.platformOptimization.getSupportedPlatforms();
        
        // Update existing platform buttons with optimization previews
        Object.keys(this.config.platforms).forEach(platformKey => {
            const platformConfig = this.config.platforms[platformKey];
            const button = platformButtons.querySelector(`[data-platform="${platformKey}"]`);
            
            if (button && this.state.generatedReview) {
                // Add platform-specific preview on hover
                this.addPlatformPreview(button, platformKey, platformConfig);
            }
        });
    }

    addPlatformPreview(button, platformKey, platformConfig) {
        // Remove existing preview
        const existingPreview = button.querySelector('.platform-preview');
        if (existingPreview) {
            existingPreview.remove();
        }

        // Create preview element
        const preview = document.createElement('div');
        preview.className = 'platform-preview';
        preview.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            margin-top: 4px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            display: none;
            z-index: 1000;
            font-size: 12px;
            max-height: 200px;
            overflow-y: auto;
        `;

        // Show preview on hover
        button.addEventListener('mouseenter', () => {
            if (this.state.generatedReview) {
                const optimizedReview = this.generateOptimizedReview(platformKey);
                preview.innerHTML = `
                    <div style="font-weight: 600; margin-bottom: 8px; color: #374151;">
                        ${platformConfig.name} Preview
                    </div>
                    <div style="color: #6b7280; margin-bottom: 6px;">
                        Optimized for ${platformConfig.name} standards
                    </div>
                    <div style="background: #f9fafb; padding: 8px; border-radius: 4px; font-size: 11px; line-height: 1.4;">
                        ${optimizedReview}
                    </div>
                    <div style="margin-top: 8px; font-size: 10px; color: #9ca3af;">
                        Length: ${optimizedReview.length} characters
                    </div>
                `;
                preview.style.display = 'block';
            }
        });

        button.addEventListener('mouseleave', () => {
            preview.style.display = 'none';
        });

        // Make button container relative for positioning
        button.style.position = 'relative';
        button.appendChild(preview);
    }

    setupAdvancedFeatures() {
        // Any advanced features that don't need to be in the critical path
        this.setupPWAFeatures();
        this.setupAccessibilityFeatures();
    }

    setupPWAFeatures() {
        // Service worker registration and PWA setup
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                this.services.errorMonitor.logInfo({
                    type: 'service_worker_registered',
                    scope: registration.scope
                });
            }).catch(error => {
                this.services.errorMonitor.trackError('service_worker_registration_failed', error);
            });
        }
    }

    setupAccessibilityFeatures() {
        // Enhanced keyboard navigation and screen reader support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    showSuccessMessage(message) {
        // Create and show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 4000);
    }

    // Public API methods
    getState() {
        return { ...this.state };
    }

    getConfig() {
        return { ...this.config };
    }

    getServices() {
        return this.services;
    }

    getComponents() {
        return this.components;
    }

    isInitialized() {
        return this.state.isInitialized;
    }
}