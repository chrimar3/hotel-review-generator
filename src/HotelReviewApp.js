/**
 * HotelReviewApp - Main application coordinator
 * Orchestrates all agents and manages the overall application workflow
 */
class HotelReviewApp {
    constructor(config = {}) {
        this.config = {
            hotelName: config.hotelName || 'our hotel',
            debug: config.debug || false,
            enableAnalytics: config.enableAnalytics || false,
            ...config
        };
        
        this.agents = {};
        this.initialized = false;
        this.logger = new SimpleLogger('HotelReviewApp');
        
        // Application state
        this.state = {
            isReady: false,
            currentWorkflow: null,
            errors: [],
            performance: {
                initTime: null,
                interactions: []
            }
        };
    }
    
    /**
     * Initialize the complete application
     */
    async initialize() {
        const startTime = performance.now();
        this.logger.info('Initializing Hotel Review Generator Application');
        
        try {
            const workflow = [
                () => this.initializeAgents(),
                () => this.setupAgentCommunication(),
                () => this.initializeUserInterface(),
                () => this.loadInitialState(),
                () => this.setupEventHandlers(),
                () => this.performInitialDetection(),
                () => this.finalizeInitialization()
            ];
            
            for (const step of workflow) {
                await step();
            }
            
            this.state.performance.initTime = performance.now() - startTime;
            this.state.isReady = true;
            this.initialized = true;
            
            this.logger.info('Application initialized successfully', {
                initTime: this.state.performance.initTime + 'ms'
            });
            
            return { success: true };
            
        } catch (error) {
            this.logger.error('Application initialization failed', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Process user interactions through the agent system
     */
    async processInteraction(interaction) {
        if (!this.initialized) {
            this.logger.warn('Interaction received before initialization complete');
            return { success: false, error: 'Application not ready' };
        }
        
        const startTime = performance.now();
        this.logger.debug('Processing interaction', { interaction });
        
        try {
            // Determine which agents should handle this interaction
            const agentWorkflow = await this.determineAgentWorkflow(interaction);
            
            // Execute agent workflow
            const results = await this.executeAgentWorkflow(agentWorkflow, interaction);
            
            // Record performance metrics
            this.recordInteractionMetrics(interaction, performance.now() - startTime);
            
            return { success: true, results };
            
        } catch (error) {
            this.logger.error('Interaction processing failed', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Generate review using coordinated agent workflow
     */
    async generateReview() {
        this.logger.info('Starting review generation workflow');
        
        try {
            // Get current application state
            const appState = this.agents.stateManager.getState();
            
            // Prepare review generation input
            const reviewInput = {
                features: appState.selectedFeatures,
                staff: appState.selectedStaff,
                comments: appState.personalComments,
                hotelName: appState.hotelName,
                platform: appState.detectedSource
            };
            
            // Generate review using ReviewGeneratorAgent
            const reviewResult = await this.agents.reviewGenerator.processReviewRequest(reviewInput);
            
            if (reviewResult.success) {
                // Update application state with generated review
                await this.agents.stateManager.setState({
                    generatedReview: reviewResult.review,
                    reviewMetadata: reviewResult.metadata
                });
                
                // Update UI to show generated review
                await this.agents.uiController.handleInteraction({
                    type: 'review-generated',
                    data: reviewResult
                });
                
                this.logger.info('Review generated successfully', {
                    length: reviewResult.review.length,
                    confidence: reviewResult.confidence
                });
                
                return { success: true, review: reviewResult.review };
            } else {
                throw new Error(reviewResult.error || 'Review generation failed');
            }
            
        } catch (error) {
            this.logger.error('Review generation failed', error);
            
            // Show error feedback through UI agent
            await this.agents.uiController.showErrorFeedback(
                'Failed to generate review. Please try again.',
                [{ label: 'Retry', action: () => this.generateReview() }]
            );
            
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Copy review to clipboard with agent coordination
     */
    async copyReviewToClipboard() {
        this.logger.info('Copying review to clipboard');
        
        try {
            const appState = this.agents.stateManager.getState();
            
            if (!appState.generatedReview) {
                throw new Error('No review available to copy');
            }
            
            // Show loading state
            await this.agents.uiController.showLoading('copy-clipboard', 1000);
            
            // Attempt to copy to clipboard
            const success = await this.copyToClipboard(appState.generatedReview);
            
            // Hide loading state
            await this.agents.uiController.hideLoading(success);
            
            if (success) {
                // Show success feedback
                await this.agents.uiController.showSuccessFeedback(
                    'Review copied to clipboard! You can now paste it on the review platform.'
                );
                
                // Record successful copy interaction
                await this.agents.stateManager.setState({
                    lastInteraction: { type: 'copy-success', timestamp: Date.now() }
                });
                
                return { success: true };
            } else {
                throw new Error('Clipboard operation failed');
            }
            
        } catch (error) {
            this.logger.error('Clipboard copy failed', error);
            
            await this.agents.uiController.showErrorFeedback(
                'Failed to copy review. Please select and copy the text manually.',
                [{ label: 'Try Again', action: () => this.copyReviewToClipboard() }]
            );
            
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Private Methods - Agent Management
     */
    async initializeAgents() {
        this.logger.debug('Initializing agents');
        
        // Initialize State Management Agent
        this.agents.stateManager = new StateManagementAgent({
            persistenceEnabled: true,
            storageKey: 'hotel-review-app-state'
        });
        this.agents.stateManager.setupDefaultValidators();
        
        // Initialize UI Controller Agent
        this.agents.uiController = new UIControllerAgent({
            animationDuration: 300,
            accessibilityMode: false
        });
        
        // Initialize Platform Routing Agent
        this.agents.platformRouter = new PlatformRoutingAgent({
            platforms: this.getDefaultPlatforms()
        });
        
        // Initialize Review Generator Agent
        this.agents.reviewGenerator = new ReviewGeneratorAgent({
            hotelName: this.config.hotelName,
            maxCommentLength: 200
        });
        
        this.logger.debug('All agents initialized');
    }
    
    async setupAgentCommunication() {
        this.logger.debug('Setting up agent communication');
        
        // State Manager → UI Controller communication
        this.agents.stateManager.subscribe('selectedFeatures', (features) => {
            this.agents.uiController.handleInteraction({
                type: 'features-updated',
                data: { features }
            });
        });
        
        this.agents.stateManager.subscribe('generatedReview', (review) => {
            this.agents.uiController.handleInteraction({
                type: 'review-updated',
                data: { review }
            });
        });
        
        this.agents.stateManager.subscribe('isLoading', (loading) => {
            if (loading) {
                this.agents.uiController.showLoading('processing');
            } else {
                this.agents.uiController.hideLoading();
            }
        });
        
        // Platform Router → State Manager communication
        this.agents.stateManager.subscribe('detectedSource', async (source) => {
            const routingResult = await this.agents.platformRouter.processRoutingRequest({
                source,
                url: window.location.href,
                userAgent: navigator.userAgent
            });
            
            if (routingResult.success) {
                await this.agents.stateManager.setState({
                    platformRouting: routingResult.routing
                });
            }
        });
    }
    
    async initializeUserInterface() {
        this.logger.debug('Initializing user interface');
        
        const elementSelectors = {
            hotelName: '#hotelName',
            featuresGrid: '#featuresGrid',
            staffSelect: '#staffSelect',
            personalComments: '#personalComments',
            reviewPreview: '#reviewPreview',
            copyButton: '#copyButton',
            platformButtons: '#platformButtons',
            stickyActions: '#stickyActions'
        };
        
        await this.agents.uiController.initialize(elementSelectors);
    }
    
    async loadInitialState() {
        this.logger.debug('Loading initial state');
        
        // Load persisted state if available
        await this.agents.stateManager.loadPersistedState();
        
        // Set hotel name from URL parameter or config
        const urlHotelName = this.getUrlParameter('hotel');
        if (urlHotelName) {
            const hotelName = decodeURIComponent(urlHotelName.replace(/[-_]/g, ' '));
            await this.agents.stateManager.setState({ hotelName });
        }
        
        // Set source from URL parameter
        const urlSource = this.getUrlParameter('source');
        if (urlSource) {
            await this.agents.stateManager.setState({ detectedSource: urlSource });
        }
    }
    
    async setupEventHandlers() {
        this.logger.debug('Setting up event handlers');
        
        // Feature selection handlers
        document.addEventListener('change', async (e) => {
            if (e.target.matches('input[type="checkbox"]')) {
                await this.handleFeatureSelection(e.target);
            }
        });
        
        // Staff selection handler
        const staffSelect = document.getElementById('staffSelect');
        if (staffSelect) {
            staffSelect.addEventListener('change', async (e) => {
                await this.handleStaffSelection(e.target.value);
            });
        }
        
        // Personal comments handler
        const personalComments = document.getElementById('personalComments');
        if (personalComments) {
            personalComments.addEventListener('input', async (e) => {
                await this.handleCommentsInput(e.target.value);
            });
        }
        
        // Copy button handlers
        document.addEventListener('click', async (e) => {
            if (e.target.matches('#copyButton, #stickyCopyButton')) {
                e.preventDefault();
                await this.copyReviewToClipboard();
            }
        });
    }
    
    async performInitialDetection() {
        this.logger.debug('Performing initial detection');
        
        // Detect platform from URL
        const source = this.getUrlParameter('source') || 'direct';
        await this.agents.stateManager.setState({ detectedSource: source });
        
        // Generate initial review if features are selected
        const currentState = this.agents.stateManager.getState();
        if (currentState.selectedFeatures.length > 0 || currentState.personalComments) {
            await this.generateReview();
        }
    }
    
    async finalizeInitialization() {
        this.logger.debug('Finalizing initialization');
        
        // Setup automatic review generation
        this.agents.stateManager.subscribe('selectedFeatures', () => this.generateReview());
        this.agents.stateManager.subscribe('selectedStaff', () => this.generateReview());
        this.agents.stateManager.subscribe('personalComments', () => this.generateReview());
        
        // Setup analytics if enabled
        if (this.config.enableAnalytics) {
            this.setupAnalytics();
        }
    }
    
    /**
     * Event Handlers
     */
    async handleFeatureSelection(checkbox) {
        const currentFeatures = this.agents.stateManager.getState('selectedFeatures');
        const featureValue = checkbox.value;
        
        let updatedFeatures;
        if (checkbox.checked) {
            updatedFeatures = [...currentFeatures, featureValue];
        } else {
            updatedFeatures = currentFeatures.filter(f => f !== featureValue);
        }
        
        await this.agents.stateManager.setState({ selectedFeatures: updatedFeatures });
    }
    
    async handleStaffSelection(staffValue) {
        await this.agents.stateManager.setState({ selectedStaff: staffValue });
    }
    
    async handleCommentsInput(commentsValue) {
        await this.agents.stateManager.setState({ personalComments: commentsValue });
    }
    
    /**
     * Utility Methods
     */
    async determineAgentWorkflow(interaction) {
        const workflows = {
            'feature-selection': ['stateManager', 'reviewGenerator', 'uiController'],
            'staff-selection': ['stateManager', 'reviewGenerator', 'uiController'],
            'comment-input': ['stateManager', 'reviewGenerator', 'uiController'],
            'copy-review': ['stateManager', 'uiController'],
            'platform-navigation': ['platformRouter', 'stateManager', 'uiController']
        };
        
        return workflows[interaction.type] || ['uiController'];
    }
    
    async executeAgentWorkflow(workflow, interaction) {
        const results = {};
        
        for (const agentName of workflow) {
            if (this.agents[agentName]) {
                try {
                    const result = await this.agents[agentName].handleInteraction?.(interaction) || 
                                   await this.agents[agentName].processRequest?.(interaction);
                    results[agentName] = result;
                } catch (error) {
                    this.logger.error(`Agent ${agentName} failed to process interaction`, error);
                    results[agentName] = { success: false, error: error.message };
                }
            }
        }
        
        return results;
    }
    
    recordInteractionMetrics(interaction, duration) {
        this.state.performance.interactions.push({
            type: interaction.type,
            duration,
            timestamp: Date.now()
        });
        
        // Keep only recent interactions
        if (this.state.performance.interactions.length > 100) {
            this.state.performance.interactions = this.state.performance.interactions.slice(-50);
        }
    }
    
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                return success;
            } catch (err) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }
    
    getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    
    getDefaultPlatforms() {
        return {
            booking: {
                name: 'Booking.com',
                url: 'https://www.booking.com/reviewcenter.html',
                priority: 90
            },
            expedia: {
                name: 'Expedia',
                url: 'https://www.expedia.com/traveler/review/',
                priority: 85
            },
            tripadvisor: {
                name: 'TripAdvisor',
                url: 'https://www.tripadvisor.com/UserReview',
                priority: 95
            },
            google: {
                name: 'Google Maps',
                url: 'https://search.google.com/local/writereview',
                priority: 80
            }
        };
    }
    
    setupAnalytics() {
        // Analytics integration placeholder
        this.logger.debug('Analytics setup - placeholder for future implementation');
    }
    
    /**
     * Cleanup method
     */
    cleanup() {
        this.logger.info('Cleaning up application');
        
        // Cleanup all agents
        Object.values(this.agents).forEach(agent => {
            if (agent.cleanup) {
                agent.cleanup();
            }
        });
        
        this.agents = {};
        this.initialized = false;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HotelReviewApp };
}