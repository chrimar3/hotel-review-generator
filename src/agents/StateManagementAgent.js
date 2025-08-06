/**
 * StateManagementAgent - Centralized application state management
 * Handles state persistence, validation, and change notifications using reactive patterns
 */
class StateManagementAgent {
    constructor(config = {}) {
        this.config = {
            persistenceEnabled: config.persistenceEnabled !== false,
            storageKey: config.storageKey || 'hotel-review-generator-state',
            validationEnabled: config.validationEnabled !== false,
            historyLimit: config.historyLimit || 20,
            ...config
        };
        
        this.state = {
            // Form data
            selectedFeatures: [],
            selectedStaff: '',
            personalComments: '',
            hotelName: 'our hotel',
            
            // Generated content
            generatedReview: '',
            reviewMetadata: {},
            
            // Application state
            currentStep: 1,
            isLoading: false,
            lastInteraction: null,
            
            // Platform configuration
            detectedSource: 'direct',
            platformRouting: null,
            
            // UI state
            errors: [],
            notifications: [],
            preferences: {}
        };
        
        this.subscribers = new Map();
        this.validators = new Map();
        this.history = [];
        this.logger = new SimpleLogger('StateManagementAgent');
        
        this.initializeReactiveState();
    }
    
    /**
     * Initialize reactive state management
     */
    initializeReactiveState() {
        // Create proxy for reactive state
        this.reactiveState = new Proxy(this.state, {
            set: (target, property, value) => {
                const oldValue = target[property];
                
                // Validate change if validator exists
                if (this.validators.has(property)) {
                    const validation = this.validators.get(property)(value, oldValue);
                    if (!validation.isValid) {
                        this.logger.warn('State validation failed', { property, value, errors: validation.errors });
                        return false;
                    }
                }
                
                // Update value
                target[property] = value;
                
                // Record in history
                this.recordStateChange(property, oldValue, value);
                
                // Notify subscribers
                this.notifySubscribers(property, value, oldValue);
                
                // Persist if enabled
                if (this.config.persistenceEnabled) {
                    this.persistState();
                }
                
                return true;
            }
        });
    }
    
    /**
     * Get current state or specific property
     */
    getState(property = null) {
        if (property) {
            return this.state[property];
        }
        return { ...this.state };
    }
    
    /**
     * Update state with validation and notifications
     */
    async setState(updates, options = {}) {
        this.logger.debug('Updating state', { updates, options });
        
        try {
            // Batch validation if enabled
            if (this.config.validationEnabled && !options.skipValidation) {
                const validation = await this.validateStateUpdates(updates);
                if (!validation.isValid) {
                    throw new Error(`State validation failed: ${validation.errors.join(', ')}`);
                }
            }
            
            // Apply updates
            const changes = [];
            for (const [key, value] of Object.entries(updates)) {
                const oldValue = this.state[key];
                this.reactiveState[key] = value;
                changes.push({ key, oldValue, newValue: value });
            }
            
            // Trigger batch change notification if requested
            if (options.notifyBatch) {
                this.notifySubscribers('batch-update', changes);
            }
            
            return { success: true, changes };
            
        } catch (error) {
            this.logger.error('State update failed', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Subscribe to state changes
     */
    subscribe(property, callback, options = {}) {
        if (!this.subscribers.has(property)) {
            this.subscribers.set(property, []);
        }
        
        const subscription = {
            callback,
            id: Date.now() + Math.random(),
            options: {
                immediate: options.immediate || false,
                once: options.once || false,
                priority: options.priority || 0
            }
        };
        
        this.subscribers.get(property).push(subscription);
        
        // Sort by priority (higher priority first)
        this.subscribers.get(property).sort((a, b) => b.options.priority - a.options.priority);
        
        // Call immediately if requested
        if (options.immediate) {
            callback(this.state[property], undefined);
        }
        
        // Return unsubscribe function
        return () => this.unsubscribe(property, subscription.id);
    }
    
    /**
     * Unsubscribe from state changes
     */
    unsubscribe(property, subscriptionId) {
        if (!this.subscribers.has(property)) return false;
        
        const subscriptions = this.subscribers.get(property);
        const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
        
        if (index !== -1) {
            subscriptions.splice(index, 1);
            return true;
        }
        
        return false;
    }
    
    /**
     * Add state validator for property
     */
    addValidator(property, validatorFunction) {
        this.validators.set(property, validatorFunction);
        this.logger.debug('Validator added', { property });
    }
    
    /**
     * Remove state validator
     */
    removeValidator(property) {
        return this.validators.delete(property);
    }
    
    /**
     * Reset state to initial values
     */
    resetState(properties = null) {
        const initialState = this.getInitialState();
        
        if (properties) {
            // Reset specific properties only
            const updates = {};
            properties.forEach(prop => {
                if (initialState.hasOwnProperty(prop)) {
                    updates[prop] = initialState[prop];
                }
            });
            return this.setState(updates);
        } else {
            // Reset all state
            this.state = { ...initialState };
            this.notifySubscribers('reset', this.state);
            
            if (this.config.persistenceEnabled) {
                this.clearPersistedState();
            }
        }
    }
    
    /**
     * Get state history
     */
    getHistory(limit = null) {
        if (limit) {
            return this.history.slice(-limit);
        }
        return [...this.history];
    }
    
    /**
     * Undo last state change
     */
    undo() {
        if (this.history.length === 0) return false;
        
        const lastChange = this.history.pop();
        this.reactiveState[lastChange.property] = lastChange.oldValue;
        
        this.logger.debug('State change undone', lastChange);
        return true;
    }
    
    /**
     * Load state from persistence
     */
    async loadPersistedState() {
        if (!this.config.persistenceEnabled) return false;
        
        try {
            const persistedData = localStorage.getItem(this.config.storageKey);
            if (!persistedData) return false;
            
            const parsedState = JSON.parse(persistedData);
            
            // Validate loaded state
            if (await this.validatePersistedState(parsedState)) {
                this.state = { ...this.state, ...parsedState };
                this.logger.info('State loaded from persistence');
                return true;
            }
            
        } catch (error) {
            this.logger.error('Failed to load persisted state', error);
        }
        
        return false;
    }
    
    /**
     * Clear persisted state
     */
    clearPersistedState() {
        if (!this.config.persistenceEnabled) return;
        
        try {
            localStorage.removeItem(this.config.storageKey);
            this.logger.debug('Persisted state cleared');
        } catch (error) {
            this.logger.error('Failed to clear persisted state', error);
        }
    }
    
    /**
     * Create computed properties that auto-update
     */
    createComputed(name, dependencies, computeFunction) {
        // Subscribe to all dependencies
        const unsubscribeFunctions = dependencies.map(dep => 
            this.subscribe(dep, () => {
                const newValue = computeFunction(this.state);
                this.setState({ [name]: newValue }, { skipValidation: true });
            })
        );
        
        // Calculate initial value
        const initialValue = computeFunction(this.state);
        this.setState({ [name]: initialValue }, { skipValidation: true });
        
        // Return cleanup function
        return () => {
            unsubscribeFunctions.forEach(unsub => unsub());
        };
    }
    
    /**
     * Private Methods
     */
    notifySubscribers(property, newValue, oldValue = undefined) {
        if (!this.subscribers.has(property)) return;
        
        const subscriptions = this.subscribers.get(property);
        const toRemove = [];
        
        subscriptions.forEach((subscription, index) => {
            try {
                subscription.callback(newValue, oldValue);
                
                // Remove one-time subscriptions
                if (subscription.options.once) {
                    toRemove.push(index);
                }
                
            } catch (error) {
                this.logger.error('Subscriber callback failed', error);
                toRemove.push(index);
            }
        });
        
        // Remove failed/once subscriptions
        toRemove.reverse().forEach(index => subscriptions.splice(index, 1));
    }
    
    recordStateChange(property, oldValue, newValue) {
        const change = {
            property,
            oldValue,
            newValue,
            timestamp: Date.now()
        };
        
        this.history.push(change);
        
        // Limit history size
        if (this.history.length > this.config.historyLimit) {
            this.history.shift();
        }
    }
    
    async validateStateUpdates(updates) {
        const validation = { isValid: true, errors: [] };
        
        for (const [property, value] of Object.entries(updates)) {
            if (this.validators.has(property)) {
                const propValidation = await this.validators.get(property)(value, this.state[property]);
                
                if (!propValidation.isValid) {
                    validation.isValid = false;
                    validation.errors.push(...propValidation.errors);
                }
            }
        }
        
        return validation;
    }
    
    persistState() {
        if (!this.config.persistenceEnabled) return;
        
        try {
            const stateToStore = this.getStateToPersist();
            localStorage.setItem(this.config.storageKey, JSON.stringify(stateToStore));
            
        } catch (error) {
            this.logger.error('Failed to persist state', error);
        }
    }
    
    getStateToPersist() {
        // Only persist certain state properties
        const persistableKeys = [
            'selectedFeatures',
            'selectedStaff', 
            'personalComments',
            'hotelName',
            'preferences',
            'detectedSource'
        ];
        
        const stateToPersist = {};
        persistableKeys.forEach(key => {
            if (this.state.hasOwnProperty(key)) {
                stateToPersist[key] = this.state[key];
            }
        });
        
        return stateToPersist;
    }
    
    async validatePersistedState(persistedState) {
        // Basic validation of persisted state structure
        const requiredKeys = ['selectedFeatures'];
        
        for (const key of requiredKeys) {
            if (!persistedState.hasOwnProperty(key)) {
                this.logger.warn('Invalid persisted state - missing key', { key });
                return false;
            }
        }
        
        // Validate data types
        if (!Array.isArray(persistedState.selectedFeatures)) {
            this.logger.warn('Invalid persisted state - selectedFeatures not array');
            return false;
        }
        
        return true;
    }
    
    getInitialState() {
        return {
            selectedFeatures: [],
            selectedStaff: '',
            personalComments: '',
            hotelName: 'our hotel',
            generatedReview: '',
            reviewMetadata: {},
            currentStep: 1,
            isLoading: false,
            lastInteraction: null,
            detectedSource: 'direct',
            platformRouting: null,
            errors: [],
            notifications: [],
            preferences: {}
        };
    }
    
    /**
     * Built-in validators
     */
    static getBuiltInValidators() {
        return {
            selectedFeatures: (value) => ({
                isValid: Array.isArray(value),
                errors: Array.isArray(value) ? [] : ['selectedFeatures must be an array']
            }),
            
            personalComments: (value) => ({
                isValid: typeof value === 'string' && value.length <= 200,
                errors: typeof value === 'string' && value.length <= 200 ? [] : ['personalComments must be string ≤ 200 chars']
            }),
            
            selectedStaff: (value) => ({
                isValid: typeof value === 'string',
                errors: typeof value === 'string' ? [] : ['selectedStaff must be a string']
            })
        };
    }
    
    /**
     * Setup default validators
     */
    setupDefaultValidators() {
        const validators = StateManagementAgent.getBuiltInValidators();
        
        for (const [property, validator] of Object.entries(validators)) {
            this.addValidator(property, validator);
        }
    }
    
    /**
     * Cleanup method
     */
    cleanup() {
        this.subscribers.clear();
        this.validators.clear();
        this.history.length = 0;
        this.logger.info('State management agent cleanup completed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StateManagementAgent };
}