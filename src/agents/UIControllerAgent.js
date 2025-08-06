/**
 * UIControllerAgent - Intelligent user interface management
 * Handles UI state, interactions, animations, and responsive behavior
 */
class UIControllerAgent {
    constructor(config = {}) {
        this.config = {
            animationDuration: config.animationDuration || 300,
            mobileBreakpoint: config.mobileBreakpoint || 768,
            accessibilityMode: config.accessibilityMode || false,
            ...config
        };
        
        this.state = {
            currentView: 'form',
            formStep: 1,
            totalSteps: 4,
            isLoading: false,
            isMobile: false,
            interactions: [],
            errors: [],
            animations: new Map()
        };
        
        this.elements = new Map();
        this.eventListeners = new Map();
        this.logger = new SimpleLogger('UIControllerAgent');
    }
    
    /**
     * Initialize UI controller with DOM elements
     */
    async initialize(elementSelectors) {
        this.logger.info('Initializing UI controller');
        
        try {
            const workflow = [
                () => this.cacheElements(elementSelectors),
                () => this.detectDeviceCapabilities(),
                () => this.setupEventListeners(),
                () => this.initializeAccessibility(),
                () => this.setupResponsiveHandlers(),
                () => this.loadUserPreferences()
            ];
            
            for (const step of workflow) {
                await step();
            }
            
            this.logger.info('UI controller initialized successfully');
            return { success: true };
            
        } catch (error) {
            this.logger.error('UI initialization failed', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Handle user interactions with intelligent response
     */
    async handleInteraction(interaction) {
        this.logger.debug('Processing interaction', { interaction });
        
        try {
            // Record interaction for analytics
            this.recordInteraction(interaction);
            
            // Determine appropriate response
            const response = await this.determineUIResponse(interaction);
            
            // Execute UI updates
            await this.executeUIUpdates(response);
            
            return { success: true, response };
            
        } catch (error) {
            this.logger.error('Interaction handling failed', error);
            await this.showErrorFeedback(error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Update UI state with intelligent transitions
     */
    async updateState(newState, options = {}) {
        this.logger.debug('Updating UI state', { newState, options });
        
        const previousState = { ...this.state };
        this.state = { ...this.state, ...newState };
        
        // Determine what changed
        const changes = this.detectStateChanges(previousState, this.state);
        
        // Apply appropriate UI updates
        for (const change of changes) {
            await this.applyStateChange(change, options);
        }
        
        // Trigger state change callbacks
        this.triggerStateChangeCallbacks(changes);
    }
    
    /**
     * Show loading state with intelligent feedback
     */
    async showLoading(operation, estimatedDuration = null) {
        this.state.isLoading = true;
        
        const loadingConfig = {
            message: this.getLoadingMessage(operation),
            spinner: true,
            progress: estimatedDuration ? true : false,
            duration: estimatedDuration
        };
        
        await this.renderLoadingState(loadingConfig);
        
        if (estimatedDuration) {
            this.startProgressAnimation(estimatedDuration);
        }
    }
    
    /**
     * Hide loading state with completion feedback
     */
    async hideLoading(success = true, message = null) {
        this.state.isLoading = false;
        
        if (success && message) {
            await this.showSuccessFeedback(message);
        }
        
        await this.clearLoadingState();
    }
    
    /**
     * Show success feedback with animations
     */
    async showSuccessFeedback(message) {
        const feedback = {
            type: 'success',
            message,
            duration: 3000,
            animation: 'slideInUp'
        };
        
        await this.renderFeedback(feedback);
    }
    
    /**
     * Show error feedback with recovery options
     */
    async showErrorFeedback(error, recoveryOptions = []) {
        const feedback = {
            type: 'error',
            message: this.humanizeError(error),
            duration: 5000,
            recoveryOptions,
            animation: 'shake'
        };
        
        this.state.errors.push({ error, timestamp: Date.now() });
        await this.renderFeedback(feedback);
    }
    
    /**
     * Manage form validation with real-time feedback
     */
    async validateForm(formData) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };
        
        // Validate each field
        for (const [field, value] of Object.entries(formData)) {
            const fieldValidation = await this.validateField(field, value);
            
            if (!fieldValidation.isValid) {
                validation.isValid = false;
                validation.errors.push(...fieldValidation.errors);
            }
            
            validation.warnings.push(...fieldValidation.warnings);
        }
        
        // Update field-level UI feedback
        await this.updateFieldValidation(validation);
        
        return validation;
    }
    
    /**
     * Handle responsive design changes
     */
    async handleViewportChange() {
        const isMobile = window.innerWidth <= this.config.mobileBreakpoint;
        
        if (isMobile !== this.state.isMobile) {
            this.state.isMobile = isMobile;
            await this.adaptToViewport(isMobile);
        }
    }
    
    /**
     * Private Methods
     */
    cacheElements(selectors) {
        for (const [key, selector] of Object.entries(selectors)) {
            const element = document.querySelector(selector);
            if (element) {
                this.elements.set(key, element);
            } else {
                this.logger.warn('Element not found', { key, selector });
            }
        }
    }
    
    detectDeviceCapabilities() {
        const capabilities = {
            touch: 'ontouchstart' in window,
            hover: window.matchMedia('(hover: hover)').matches,
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            highContrast: window.matchMedia('(prefers-contrast: high)').matches,
            clipboard: navigator.clipboard && navigator.clipboard.writeText
        };
        
        this.state.deviceCapabilities = capabilities;
        this.logger.debug('Device capabilities detected', capabilities);
        
        // Apply capability-based adjustments
        if (capabilities.reducedMotion) {
            this.config.animationDuration = 0;
        }
        
        if (capabilities.highContrast) {
            this.config.accessibilityMode = true;
        }
    }
    
    setupEventListeners() {
        // Global event listeners
        window.addEventListener('resize', () => this.handleViewportChange());
        
        // Intersection observer for scroll-based animations
        this.setupIntersectionObserver();
        
        // Focus management
        this.setupFocusManagement();
        
        // Keyboard navigation
        this.setupKeyboardNavigation();
    }
    
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;
        
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.handleElementVisible(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        // Observe elements with animation triggers
        document.querySelectorAll('[data-animate]').forEach(el => {
            this.intersectionObserver.observe(el);
        });
    }
    
    setupFocusManagement() {
        let focusVisible = false;
        
        document.addEventListener('keydown', () => {
            focusVisible = true;
        });
        
        document.addEventListener('mousedown', () => {
            focusVisible = false;
        });
        
        document.addEventListener('focusin', (e) => {
            if (focusVisible) {
                e.target.setAttribute('data-focus-visible', '');
            }
        });
        
        document.addEventListener('focusout', (e) => {
            e.target.removeAttribute('data-focus-visible');
        });
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Handle common keyboard patterns
            switch (e.key) {
                case 'Escape':
                    this.handleEscapeKey();
                    break;
                case 'Enter':
                    if (e.target.hasAttribute('data-button')) {
                        e.target.click();
                    }
                    break;
                case ' ':
                    if (e.target.hasAttribute('data-button')) {
                        e.preventDefault();
                        e.target.click();
                    }
                    break;
            }
        });
    }
    
    recordInteraction(interaction) {
        const record = {
            ...interaction,
            timestamp: Date.now(),
            viewport: { width: window.innerWidth, height: window.innerHeight }
        };
        
        this.state.interactions.push(record);
        
        // Keep only recent interactions (last 50)
        if (this.state.interactions.length > 50) {
            this.state.interactions = this.state.interactions.slice(-50);
        }
    }
    
    async determineUIResponse(interaction) {
        const { type, element, data } = interaction;
        
        switch (type) {
            case 'feature-select':
                return this.handleFeatureSelection(element, data);
                
            case 'staff-change':
                return this.handleStaffSelection(element, data);
                
            case 'comment-input':
                return this.handleCommentInput(element, data);
                
            case 'copy-click':
                return this.handleCopyAction(element, data);
                
            case 'platform-click':
                return this.handlePlatformNavigation(element, data);
                
            default:
                return { type: 'no-action' };
        }
    }
    
    async executeUIUpdates(response) {
        if (!response || response.type === 'no-action') return;
        
        switch (response.type) {
            case 'update-preview':
                await this.animatePreviewUpdate(response.data);
                break;
                
            case 'show-feedback':
                await this.showFeedback(response.data);
                break;
                
            case 'update-counter':
                await this.animateCounterUpdate(response.data);
                break;
                
            case 'toggle-button':
                await this.animateButtonToggle(response.data);
                break;
        }
    }
    
    detectStateChanges(previous, current) {
        const changes = [];
        
        for (const key in current) {
            if (previous[key] !== current[key]) {
                changes.push({
                    key,
                    previous: previous[key],
                    current: current[key]
                });
            }
        }
        
        return changes;
    }
    
    async applyStateChange(change, options) {
        switch (change.key) {
            case 'currentView':
                await this.transitionView(change.current, options);
                break;
                
            case 'isLoading':
                change.current ? await this.showLoadingUI() : await this.hideLoadingUI();
                break;
                
            case 'isMobile':
                await this.adaptToViewport(change.current);
                break;
        }
    }
    
    getLoadingMessage(operation) {
        const messages = {
            'generate-review': 'Creating your personalized review...',
            'copy-clipboard': 'Copying to clipboard...',
            'validate-form': 'Checking your input...',
            'save-preferences': 'Saving your preferences...'
        };
        
        return messages[operation] || 'Processing...';
    }
    
    humanizeError(error) {
        const errorMap = {
            'clipboard-failed': 'Unable to copy to clipboard. Please try selecting the text manually.',
            'validation-failed': 'Please check your input and try again.',
            'network-error': 'Connection issue. Please check your internet and try again.',
            'unknown-error': 'Something went wrong. Please refresh the page and try again.'
        };
        
        return errorMap[error] || errorMap['unknown-error'];
    }
    
    async validateField(field, value) {
        const validation = { isValid: true, errors: [], warnings: [] };
        
        switch (field) {
            case 'personalComments':
                if (value && value.length > 200) {
                    validation.errors.push('Comment is too long (max 200 characters)');
                    validation.isValid = false;
                } else if (value && value.length > 180) {
                    validation.warnings.push('Comment is approaching character limit');
                }
                break;
                
            case 'selectedFeatures':
                if (!value || value.length === 0) {
                    validation.warnings.push('Select at least one feature for a better review');
                }
                break;
        }
        
        return validation;
    }
    
    // Animation helper methods
    async animate(element, animation, duration = null) {
        return new Promise((resolve) => {
            const animDuration = duration || this.config.animationDuration;
            
            if (animDuration === 0) {
                resolve();
                return;
            }
            
            element.style.transition = `all ${animDuration}ms ease`;
            
            // Apply animation class or styles
            switch (animation) {
                case 'fadeIn':
                    element.style.opacity = '0';
                    setTimeout(() => { element.style.opacity = '1'; }, 10);
                    break;
                    
                case 'slideInUp':
                    element.style.transform = 'translateY(20px)';
                    element.style.opacity = '0';
                    setTimeout(() => {
                        element.style.transform = 'translateY(0)';
                        element.style.opacity = '1';
                    }, 10);
                    break;
                    
                case 'shake':
                    element.style.transform = 'translateX(-5px)';
                    setTimeout(() => { element.style.transform = 'translateX(5px)'; }, 100);
                    setTimeout(() => { element.style.transform = 'translateX(-5px)'; }, 200);
                    setTimeout(() => { element.style.transform = 'translateX(0)'; }, 300);
                    break;
            }
            
            setTimeout(resolve, animDuration);
        });
    }
    
    cleanup() {
        // Remove event listeners
        this.eventListeners.forEach((listener, element) => {
            element.removeEventListener(...listener);
        });
        
        // Disconnect observers
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }
        
        // Clear animations
        this.animations.forEach((animation, element) => {
            if (animation.cancel) animation.cancel();
        });
        
        this.logger.info('UI controller cleanup completed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIControllerAgent };
}