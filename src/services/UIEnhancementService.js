/**
 * UI/UX Enhancement Service
 * Provides advanced user interface improvements and better user experience
 */

import logger from '../utils/logger.js';

export class UIEnhancementService {
    constructor(errorMonitor) {
        this.errorMonitor = errorMonitor;
        
        this.config = {
            animations: {
                enabled: true,
                respectReducedMotion: true,
                duration: 300
            },
            theme: {
                mode: 'light', // light, dark, auto
                primaryColor: '#3b82f6',
                accentColor: '#10b981'
            },
            responsive: {
                breakpoints: {
                    mobile: 640,
                    tablet: 768,
                    desktop: 1024,
                    wide: 1280
                }
            },
            performance: {
                lazyLoadImages: true,
                virtualScrolling: true,
                debounceDelay: 300
            }
        };

        this.currentDevice = this.detectDevice();
        this.initialize();
    }

    initialize() {
        this.setupResponsiveDesign();
        this.setupThemeSystem();
        this.enhanceFormInteractions();
        this.setupProgressIndicators();
        this.implementTooltips();
        this.setupKeyboardShortcuts();
        this.enhanceAccessibility();
        
        logger.info('[UIEnhancement] UI/UX enhancements initialized');
    }

    // Responsive Design
    setupResponsiveDesign() {
        // Add responsive classes based on viewport
        this.updateResponsiveClasses();
        
        // Listen for resize events
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.updateResponsiveClasses();
                this.handleResponsiveChanges();
            }, this.config.performance.debounceDelay);
        });

        // Orientation change handling
        window.addEventListener('orientationchange', () => {
            this.handleOrientationChange();
        });
    }

    updateResponsiveClasses() {
        const width = window.innerWidth;
        const body = document.body;
        
        // Remove existing classes
        body.classList.remove('mobile', 'tablet', 'desktop', 'wide');
        
        // Add appropriate class
        if (width < this.config.responsive.breakpoints.mobile) {
            body.classList.add('mobile');
        } else if (width < this.config.responsive.breakpoints.tablet) {
            body.classList.add('tablet');
        } else if (width < this.config.responsive.breakpoints.desktop) {
            body.classList.add('desktop');
        } else {
            body.classList.add('wide');
        }

        this.currentDevice = this.detectDevice();
    }

    detectDevice() {
        const width = window.innerWidth;
        
        if (width < this.config.responsive.breakpoints.mobile) return 'mobile';
        if (width < this.config.responsive.breakpoints.tablet) return 'tablet';
        if (width < this.config.responsive.breakpoints.desktop) return 'desktop';
        return 'wide';
    }

    handleResponsiveChanges() {
        // Adjust UI elements based on screen size
        this.adjustNavigationMenu();
        this.adjustCardLayouts();
        this.adjustFontSizes();
    }

    adjustNavigationMenu() {
        // Convert to hamburger menu on mobile
        if (this.currentDevice === 'mobile') {
            this.createMobileMenu();
        } else {
            this.createDesktopMenu();
        }
    }

    createMobileMenu() {
        // Check if mobile menu already exists
        if (document.getElementById('mobile-menu-toggle')) return;

        const menuToggle = document.createElement('button');
        menuToggle.id = 'mobile-menu-toggle';
        menuToggle.innerHTML = '☰';
        menuToggle.setAttribute('aria-label', 'Toggle menu');
        menuToggle.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1001;
            background: ${this.config.theme.primaryColor};
            color: white;
            border: none;
            padding: 10px;
            border-radius: 8px;
            font-size: 24px;
            cursor: pointer;
        `;

        document.body.appendChild(menuToggle);

        menuToggle.addEventListener('click', () => {
            this.toggleMobileMenu();
        });
    }

    toggleMobileMenu() {
        // Implementation for mobile menu toggle
        const isOpen = document.body.classList.contains('menu-open');
        document.body.classList.toggle('menu-open');
        
        this.errorMonitor?.trackUserAction('mobile_menu_toggled', { isOpen: !isOpen });
    }

    createDesktopMenu() {
        // Remove mobile menu if it exists
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        if (mobileToggle) {
            mobileToggle.remove();
        }
    }

    adjustCardLayouts() {
        // Adjust grid layouts based on screen size
        const grids = document.querySelectorAll('.features-grid, .staff-grid, .properties-grid');
        
        grids.forEach(grid => {
            if (this.currentDevice === 'mobile') {
                grid.style.gridTemplateColumns = '1fr';
            } else if (this.currentDevice === 'tablet') {
                grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            } else {
                grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
            }
        });
    }

    adjustFontSizes() {
        // Scale fonts for better readability
        const scaleFactor = this.currentDevice === 'mobile' ? 0.9 : 1;
        document.documentElement.style.fontSize = `${16 * scaleFactor}px`;
    }

    handleOrientationChange() {
        const orientation = window.orientation || 0;
        document.body.classList.toggle('landscape', Math.abs(orientation) === 90);
        
        this.errorMonitor?.trackUserAction('orientation_changed', { orientation });
    }

    // Theme System
    setupThemeSystem() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme_preference') || this.config.theme.mode;
        this.applyTheme(savedTheme);

        // Check for system preference
        if (savedTheme === 'auto') {
            this.detectSystemTheme();
        }

        // Add theme toggle button
        this.createThemeToggle();
    }

    applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'dark') {
            root.classList.add('dark-theme');
            this.applyDarkThemeColors();
        } else {
            root.classList.remove('dark-theme');
            this.applyLightThemeColors();
        }

        this.config.theme.mode = theme;
        localStorage.setItem('theme_preference', theme);
    }

    applyDarkThemeColors() {
        const root = document.documentElement;
        root.style.setProperty('--bg-primary', '#1a1a1a');
        root.style.setProperty('--bg-secondary', '#2d2d2d');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#b0b0b0');
        root.style.setProperty('--border-color', '#404040');
    }

    applyLightThemeColors() {
        const root = document.documentElement;
        root.style.setProperty('--bg-primary', '#ffffff');
        root.style.setProperty('--bg-secondary', '#f9fafb');
        root.style.setProperty('--text-primary', '#111827');
        root.style.setProperty('--text-secondary', '#6b7280');
        root.style.setProperty('--border-color', '#e5e7eb');
    }

    detectSystemTheme() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        this.applyTheme(prefersDark.matches ? 'dark' : 'light');
        
        // Listen for changes
        prefersDark.addEventListener('change', (e) => {
            if (this.config.theme.mode === 'auto') {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    createThemeToggle() {
        const toggle = document.createElement('button');
        toggle.id = 'theme-toggle';
        toggle.innerHTML = '🌙';
        toggle.setAttribute('aria-label', 'Toggle theme');
        toggle.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: transparent;
            border: 2px solid var(--border-color);
            padding: 8px 12px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 20px;
            transition: all 0.3s ease;
        `;

        toggle.addEventListener('click', () => {
            const newTheme = this.config.theme.mode === 'dark' ? 'light' : 'dark';
            this.applyTheme(newTheme);
            toggle.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
        });

        document.body.appendChild(toggle);
    }

    // Form Enhancements
    enhanceFormInteractions() {
        this.setupFloatingLabels();
        this.addInputValidation();
        this.implementAutoSave();
    }

    setupFloatingLabels() {
        const inputs = document.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            const wrapper = document.createElement('div');
            wrapper.className = 'input-wrapper floating-label';
            wrapper.style.position = 'relative';
            
            const label = input.previousElementSibling;
            if (label && label.tagName === 'LABEL') {
                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(label);
                wrapper.appendChild(input);
                
                // Add floating effect
                input.addEventListener('focus', () => {
                    wrapper.classList.add('focused');
                });
                
                input.addEventListener('blur', () => {
                    if (!input.value) {
                        wrapper.classList.remove('focused');
                    }
                });
                
                // Check initial state
                if (input.value) {
                    wrapper.classList.add('focused');
                }
            }
        });
    }

    addInputValidation() {
        const inputs = document.querySelectorAll('input[required], textarea[required]');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateInput(input);
            });
            
            input.addEventListener('input', () => {
                if (input.classList.contains('error')) {
                    this.validateInput(input);
                }
            });
        });
    }

    validateInput(input) {
        const isValid = input.checkValidity();
        
        if (!isValid) {
            input.classList.add('error');
            this.showInputError(input);
        } else {
            input.classList.remove('error');
            this.hideInputError(input);
        }
        
        return isValid;
    }

    showInputError(input) {
        let errorElement = input.parentNode.querySelector('.input-error');
        
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'input-error';
            errorElement.style.cssText = `
                color: #ef4444;
                font-size: 12px;
                margin-top: 4px;
                display: block;
            `;
            input.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = input.validationMessage;
    }

    hideInputError(input) {
        const errorElement = input.parentNode.querySelector('.input-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    implementAutoSave() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const formId = form.id || `form_${Math.random().toString(36).substr(2, 9)}`;
            form.id = formId;
            
            // Load saved data
            this.loadFormData(form);
            
            // Save on input
            form.addEventListener('input', this.debounce(() => {
                this.saveFormData(form);
            }, 1000));
            
            // Clear on submit
            form.addEventListener('submit', () => {
                this.clearFormData(formId);
            });
        });
    }

    saveFormData(form) {
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        localStorage.setItem(`form_${form.id}`, JSON.stringify(data));
        this.showAutoSaveIndicator();
    }

    loadFormData(form) {
        const saved = localStorage.getItem(`form_${form.id}`);
        if (!saved) return;
        
        try {
            const data = JSON.parse(saved);
            Object.entries(data).forEach(([key, value]) => {
                const input = form.elements[key];
                if (input) {
                    input.value = value;
                }
            });
        } catch {}
    }

    clearFormData(formId) {
        localStorage.removeItem(`form_${formId}`);
    }

    showAutoSaveIndicator() {
        let indicator = document.getElementById('autosave-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autosave-indicator';
            indicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                background: ${this.config.theme.accentColor};
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.textContent = 'Saved';
        indicator.style.opacity = '1';
        
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    }

    // Progress Indicators
    setupProgressIndicators() {
        this.createPageLoadProgress();
        this.createScrollProgress();
    }

    createPageLoadProgress() {
        const progressBar = document.createElement('div');
        progressBar.id = 'page-load-progress';
        progressBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 3px;
            background: ${this.config.theme.primaryColor};
            z-index: 10000;
            transition: width 0.3s ease;
        `;
        document.body.appendChild(progressBar);

        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    progressBar.style.opacity = '0';
                }, 500);
            }
            progressBar.style.width = `${progress}%`;
        }, 200);
    }

    createScrollProgress() {
        const scrollBar = document.createElement('div');
        scrollBar.id = 'scroll-progress';
        scrollBar.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 0%;
            height: 2px;
            background: ${this.config.theme.accentColor};
            z-index: 9999;
        `;
        document.body.appendChild(scrollBar);

        window.addEventListener('scroll', () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPosition = window.scrollY;
            const progress = (scrollPosition / scrollHeight) * 100;
            scrollBar.style.width = `${progress}%`;
        });
    }

    // Tooltips
    implementTooltips() {
        const elements = document.querySelectorAll('[data-tooltip]');
        
        elements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
            
            // Touch support
            element.addEventListener('touchstart', (e) => {
                this.showTooltip(e.target);
                setTimeout(() => this.hideTooltip(), 3000);
            });
        });
    }

    showTooltip(element) {
        const text = element.dataset.tooltip;
        if (!text) return;

        const tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: #333;
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;

        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 10);
    }

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.style.opacity = '0';
            setTimeout(() => tooltip.remove(), 300);
        }
    }

    // Keyboard Shortcuts
    setupKeyboardShortcuts() {
        const shortcuts = {
            'ctrl+s': () => this.saveCurrentState(),
            'ctrl+z': () => this.undo(),
            'ctrl+shift+z': () => this.redo(),
            'ctrl+/': () => this.showShortcutsHelp(),
            'escape': () => this.closeModals()
        };

        document.addEventListener('keydown', (e) => {
            const key = this.getShortcutKey(e);
            if (shortcuts[key]) {
                e.preventDefault();
                shortcuts[key]();
            }
        });
    }

    getShortcutKey(event) {
        const keys = [];
        if (event.ctrlKey || event.metaKey) keys.push('ctrl');
        if (event.shiftKey) keys.push('shift');
        if (event.altKey) keys.push('alt');
        keys.push(event.key.toLowerCase());
        return keys.join('+');
    }

    saveCurrentState() {
        // Save current application state
        this.errorMonitor?.trackUserAction('state_saved', {
            timestamp: Date.now()
        });
    }

    undo() {
        // Implement undo functionality
        this.errorMonitor?.trackUserAction('undo_triggered');
    }

    redo() {
        // Implement redo functionality
        this.errorMonitor?.trackUserAction('redo_triggered');
    }

    showShortcutsHelp() {
        // Show keyboard shortcuts help
        const helpModal = document.createElement('div');
        helpModal.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                z-index: 10001;
            ">
                <h3>Keyboard Shortcuts</h3>
                <ul style="list-style: none; padding: 0;">
                    <li>Ctrl+S - Save</li>
                    <li>Ctrl+Z - Undo</li>
                    <li>Ctrl+Shift+Z - Redo</li>
                    <li>Ctrl+/ - Show this help</li>
                    <li>Escape - Close modals</li>
                </ul>
                <button onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;
        document.body.appendChild(helpModal);
    }

    closeModals() {
        // Close all open modals
        document.querySelectorAll('.modal, [role="dialog"]').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // Accessibility Enhancements
    enhanceAccessibility() {
        this.addSkipLinks();
        this.enhanceFocusVisibility();
        this.addAriaLabels();
        this.setupScreenReaderAnnouncements();
    }

    addSkipLinks() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            left: -9999px;
            z-index: 10000;
            padding: 8px;
            background: ${this.config.theme.primaryColor};
            color: white;
            text-decoration: none;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.left = '10px';
            skipLink.style.top = '10px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.left = '-9999px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    enhanceFocusVisibility() {
        // Add focus-visible polyfill styles
        const style = document.createElement('style');
        style.textContent = `
            :focus-visible {
                outline: 2px solid ${this.config.theme.primaryColor};
                outline-offset: 2px;
            }
            
            .keyboard-navigation :focus {
                outline: 2px solid ${this.config.theme.primaryColor};
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    addAriaLabels() {
        // Add missing ARIA labels
        document.querySelectorAll('button:not([aria-label])').forEach(button => {
            if (!button.textContent.trim() && !button.getAttribute('aria-label')) {
                button.setAttribute('aria-label', 'Button');
            }
        });

        document.querySelectorAll('input:not([aria-label])').forEach(input => {
            const label = input.labels?.[0];
            if (!label && !input.getAttribute('aria-label')) {
                input.setAttribute('aria-label', input.placeholder || 'Input field');
            }
        });
    }

    setupScreenReaderAnnouncements() {
        // Create live region for announcements
        const liveRegion = document.createElement('div');
        liveRegion.id = 'sr-announcements';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.style.cssText = `
            position: absolute;
            left: -9999px;
            width: 1px;
            height: 1px;
            overflow: hidden;
        `;
        document.body.appendChild(liveRegion);
    }

    announceToScreenReader(message) {
        const liveRegion = document.getElementById('sr-announcements');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => {
                liveRegion.textContent = '';
            }, 1000);
        }
    }

    // Utility Methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Public API
    getConfig() {
        return { ...this.config };
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.applyConfigChanges();
    }

    applyConfigChanges() {
        // Apply theme changes
        if (this.config.theme.mode) {
            this.applyTheme(this.config.theme.mode);
        }
        
        // Apply animation settings
        if (!this.config.animations.enabled) {
            document.body.classList.add('no-animations');
        } else {
            document.body.classList.remove('no-animations');
        }
    }

    getCurrentDevice() {
        return this.currentDevice;
    }

    triggerHapticFeedback(type = 'light') {
        if ('vibrate' in navigator) {
            const patterns = {
                light: 10,
                medium: 20,
                heavy: 30,
                success: [10, 20, 10],
                error: [30, 10, 30, 10, 30]
            };
            
            navigator.vibrate(patterns[type] || patterns.light);
        }
    }
}