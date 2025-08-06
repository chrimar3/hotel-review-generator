/**
 * Haptic Feedback Service
 * Context-aware mobile haptic feedback system
 * Extracted from main HTML file for better maintainability
 */

export class HapticFeedbackService {
    constructor(errorMonitor) {
        this.errorMonitor = errorMonitor;
        this.enabled = 'vibrate' in navigator;
        this.userPreference = this.loadUserPreference();
        this.patterns = {
            light: [10],
            medium: [20], 
            heavy: [50],
            success: [10, 10, 10],
            error: [50, 50, 50],
            selection: [5],
            notification: [10, 50, 10],
            heartbeat: [10, 10, 10, 10, 50],
            tap: [5],
            double_tap: [5, 5, 5],
            long_press: [30]
        };

        this.setupUserPreference();
        console.log('[HapticFeedback] Service initialized:', { enabled: this.enabled, userPreference: this.userPreference });
    }

    loadUserPreference() {
        try {
            const preference = localStorage.getItem('hotelReview_hapticPreference');
            if (preference !== null) {
                return JSON.parse(preference);
            }
            
            // Check for reduced motion preference
            return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (error) {
            this.errorMonitor?.trackError('haptic_preference_load', error);
            return true; // Default to enabled
        }
    }

    saveUserPreference(enabled) {
        try {
            this.userPreference = enabled;
            localStorage.setItem('hotelReview_hapticPreference', JSON.stringify(enabled));
            
            this.errorMonitor?.trackUserAction('haptic_preference_changed', {
                enabled: enabled,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            this.errorMonitor?.trackError('haptic_preference_save', error);
        }
    }

    setupUserPreference() {
        // Listen for reduced motion changes
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        mediaQuery.addEventListener('change', (e) => {
            if (e.matches) {
                this.userPreference = false;
                this.saveUserPreference(false);
            }
        });
    }

    vibrate(pattern = 'medium', fallback = true) {
        if (!this.enabled || !this.userPreference) {
            if (fallback) {
                this.visualFallback(pattern);
            }
            return false;
        }

        try {
            const vibrationPattern = typeof pattern === 'string' ? this.patterns[pattern] : pattern;
            
            if (vibrationPattern && navigator.vibrate) {
                const success = navigator.vibrate(vibrationPattern);
                
                this.errorMonitor?.trackUserAction('haptic_feedback', {
                    pattern: pattern,
                    success: success,
                    timestamp: new Date().toISOString()
                });
                
                return success;
            }
        } catch (error) {
            this.errorMonitor?.trackError('haptic_vibration_failed', error);
            if (fallback) {
                this.visualFallback(pattern);
            }
            return false;
        }
        
        return false;
    }

    visualFallback(pattern) {
        // Provide visual feedback when haptic is not available
        const element = document.activeElement || document.body;
        
        if (element && element.style) {
            const originalTransform = element.style.transform;
            const duration = this.getPatternDuration(pattern);
            
            element.style.transition = 'transform 0.1s ease-out';
            element.style.transform = 'scale(0.98)';
            
            setTimeout(() => {
                element.style.transform = originalTransform;
                setTimeout(() => {
                    element.style.transition = '';
                }, 100);
            }, Math.min(duration, 100));
        }
    }

    getPatternDuration(pattern) {
        const vibrationPattern = typeof pattern === 'string' ? this.patterns[pattern] : pattern;
        if (Array.isArray(vibrationPattern)) {
            return vibrationPattern.reduce((sum, duration) => sum + duration, 0);
        }
        return 20; // Default duration
    }

    contextualFeedback(context, data = {}) {
        const contextMap = {
            'feature_selected': () => {
                const featureCount = data.featureCount || 0;
                if (featureCount === 1) {
                    this.vibrate('tap');
                } else if (featureCount <= 3) {
                    this.vibrate('light');
                } else {
                    this.vibrate('medium');
                }
            },
            'feature_deselected': () => this.vibrate('tap'),
            'review_generated': () => this.vibrate('success'),
            'review_copied': () => this.vibrate('success'),
            'error': () => this.vibrate('error'),
            'warning': () => this.vibrate('notification'),
            'platform_selected': () => this.vibrate('selection'),
            'form_submitted': () => this.vibrate('medium'),
            'navigation': () => this.vibrate('tap'),
            'achievement': () => this.vibrate('heartbeat'),
            'button_press': () => this.vibrate('tap'),
            'long_interaction': () => this.vibrate('long_press')
        };

        const feedbackFunction = contextMap[context];
        if (feedbackFunction) {
            try {
                feedbackFunction();
                
                this.errorMonitor?.trackUserAction('contextual_haptic', {
                    context: context,
                    data: data,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                this.errorMonitor?.trackError('contextual_haptic_failed', error);
            }
        } else {
            // Default fallback
            this.vibrate('light');
        }
    }

    // Pattern creation helpers
    createCustomPattern(durations, pauses = []) {
        const pattern = [];
        for (let i = 0; i < durations.length; i++) {
            pattern.push(durations[i]);
            if (i < durations.length - 1) {
                pattern.push(pauses[i] || 10); // Default pause
            }
        }
        return pattern;
    }

    // Accessibility considerations
    respectsAccessibilityPreferences() {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const userPreference = this.userPreference;
        
        return !reducedMotion && userPreference;
    }

    // Enable/disable haptic feedback
    enable() {
        this.saveUserPreference(true);
        this.errorMonitor?.trackUserAction('haptic_enabled');
    }

    disable() {
        this.saveUserPreference(false);
        this.errorMonitor?.trackUserAction('haptic_disabled');
    }

    // Check if haptics are supported and enabled
    isEnabled() {
        return this.enabled && this.userPreference && this.respectsAccessibilityPreferences();
    }

    // Get available patterns
    getAvailablePatterns() {
        return Object.keys(this.patterns);
    }

    // Test haptic feedback
    test(pattern = 'medium') {
        console.log(`[HapticFeedback] Testing pattern: ${pattern}`);
        return this.vibrate(pattern);
    }

    // Get service status
    getStatus() {
        return {
            supported: this.enabled,
            userEnabled: this.userPreference,
            respectsA11y: this.respectsAccessibilityPreferences(),
            active: this.isEnabled()
        };
    }
}