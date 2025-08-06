/**
 * Accessibility Service
 * Comprehensive WCAG 2.1 AA compliance checking and enhancement
 */

export class AccessibilityService {
    constructor(errorMonitor) {
        this.errorMonitor = errorMonitor;
        this.violations = [];
        this.enhancements = [];
        this.config = {
            level: 'AA', // WCAG compliance level
            announcements: true,
            focusTrapping: true,
            colorContrast: true,
            keyboardNavigation: true,
            screenReaderOptimization: true
        };
        
        this.initialize();
        console.log('[A11y] Accessibility service initialized');
    }

    initialize() {
        this.setupKeyboardNavigation();
        this.setupFocusManagement();
        this.setupScreenReaderSupport();
        this.setupColorContrastChecking();
        this.setupMotionPreferences();
        this.runAccessibilityAudit();
    }

    setupKeyboardNavigation() {
        // Enhanced keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Focus visible indicator for keyboard users
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
                
                // Track keyboard usage for accessibility metrics
                this.errorMonitor?.trackUserAction('keyboard_navigation_used', {
                    key: e.key,
                    shiftKey: e.shiftKey
                });
            }
        });

        // Remove keyboard focus indicators when using mouse
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    handleKeyboardNavigation(e) {
        // Escape key functionality
        if (e.key === 'Escape') {
            this.handleEscapeKey();
        }
        
        // Space/Enter for custom controls
        if (e.key === ' ' || e.key === 'Enter') {
            this.handleActivation(e);
        }
        
        // Arrow key navigation for radio groups and similar controls
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            this.handleArrowNavigation(e);
        }
    }

    handleEscapeKey() {
        // Close any open modals, dropdowns, etc.
        const activeElement = document.activeElement;
        if (activeElement && activeElement.blur) {
            activeElement.blur();
        }
        
        // Announce escape action to screen readers
        this.announceToScreenReader('Escaped from current control');
    }

    handleActivation(e) {
        const target = e.target;
        
        // Handle custom button-like elements
        if (target.getAttribute('role') === 'button' && !target.disabled) {
            e.preventDefault();
            target.click();
            
            this.announceToScreenReader(`Activated ${this.getAccessibleName(target)}`);
        }
        
        // Handle custom checkbox/radio elements
        if (target.closest('.feature-item') || target.closest('.staff-item')) {
            const input = target.closest('div').querySelector('input');
            if (input && e.key === ' ') {
                e.preventDefault();
                input.click();
            }
        }
    }

    handleArrowNavigation(e) {
        const target = e.target;
        const group = target.closest('[role="radiogroup"], .staff-grid, .features-grid');
        
        if (group) {
            const items = Array.from(group.querySelectorAll('[tabindex], input'));
            const currentIndex = items.indexOf(target);
            let nextIndex;
            
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                nextIndex = (currentIndex + 1) % items.length;
            } else {
                nextIndex = (currentIndex - 1 + items.length) % items.length;
            }
            
            if (items[nextIndex]) {
                e.preventDefault();
                items[nextIndex].focus();
                
                // Announce navigation to screen readers
                this.announceToScreenReader(`${nextIndex + 1} of ${items.length}`);
            }
        }
    }

    setupFocusManagement() {
        // Focus trap for modals and complex widgets
        this.setupFocusTraps();
        
        // Skip links for keyboard users
        this.createSkipLinks();
        
        // Focus restoration after interactions
        this.setupFocusRestoration();
    }

    setupFocusTraps() {
        // Would implement focus trapping for modal dialogs if present
        // This is a placeholder for when modals are added
    }

    createSkipLinks() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link visually-hidden-focusable';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            z-index: 10000;
            padding: 8px 12px;
            background: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 600;
            transition: top 0.3s;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Ensure main content has proper ID
        const main = document.querySelector('main');
        if (main && !main.id) {
            main.id = 'main';
        }
    }

    setupFocusRestoration() {
        // Store focus before major UI changes
        this.lastFocusedElement = null;
        
        document.addEventListener('focusin', (e) => {
            this.lastFocusedElement = e.target;
        });
    }

    setupScreenReaderSupport() {
        // Live regions for dynamic content
        this.createLiveRegions();
        
        // Enhanced semantic markup
        this.enhanceSemanticMarkup();
        
        // Form associations and descriptions
        this.enhanceFormAccessibility();
    }

    createLiveRegions() {
        // Polite announcements
        const politeRegion = document.createElement('div');
        politeRegion.setAttribute('aria-live', 'polite');
        politeRegion.setAttribute('aria-atomic', 'true');
        politeRegion.className = 'visually-hidden';
        politeRegion.id = 'polite-announcements';
        document.body.appendChild(politeRegion);
        
        // Assertive announcements for critical updates
        const assertiveRegion = document.createElement('div');
        assertiveRegion.setAttribute('aria-live', 'assertive');
        assertiveRegion.setAttribute('aria-atomic', 'true');
        assertiveRegion.className = 'visually-hidden';
        assertiveRegion.id = 'assertive-announcements';
        document.body.appendChild(assertiveRegion);
    }

    enhanceSemanticMarkup() {
        // Add missing ARIA labels and descriptions
        const elements = document.querySelectorAll('button, input, textarea, select');
        elements.forEach(element => {
            if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
                const label = this.getAccessibleName(element);
                if (label) {
                    element.setAttribute('aria-label', label);
                }
            }
        });
        
        // Enhance form fieldsets with proper roles
        const fieldsets = document.querySelectorAll('fieldset');
        fieldsets.forEach(fieldset => {
            if (!fieldset.getAttribute('role')) {
                const inputs = fieldset.querySelectorAll('input[type="radio"]');
                if (inputs.length > 0) {
                    fieldset.setAttribute('role', 'radiogroup');
                }
            }
        });
    }

    enhanceFormAccessibility() {
        // Associate error messages with inputs
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            const errorContainer = input.parentNode.querySelector('.error-message');
            if (errorContainer) {
                const errorId = `error-${input.id || this.generateId()}`;
                errorContainer.id = errorId;
                
                const describedBy = input.getAttribute('aria-describedby');
                const newDescribedBy = describedBy ? `${describedBy} ${errorId}` : errorId;
                input.setAttribute('aria-describedby', newDescribedBy);
            }
        });
        
        // Add required field indicators
        const requiredFields = document.querySelectorAll('input[required], textarea[required], select[required]');
        requiredFields.forEach(field => {
            field.setAttribute('aria-required', 'true');
        });
    }

    setupColorContrastChecking() {
        if (!this.config.colorContrast) return;
        
        // Check color contrast ratios for WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
        this.checkColorContrast();
    }

    checkColorContrast() {
        const textElements = document.querySelectorAll('p, span, div, button, a, label, h1, h2, h3, h4, h5, h6');
        const violations = [];
        
        textElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = this.getBackgroundColor(element);
            
            if (color && backgroundColor) {
                const ratio = this.calculateContrastRatio(color, backgroundColor);
                const fontSize = parseFloat(styles.fontSize);
                const fontWeight = styles.fontWeight;
                
                const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
                const requiredRatio = isLargeText ? 3.0 : 4.5;
                
                if (ratio < requiredRatio) {
                    violations.push({
                        element,
                        ratio,
                        requiredRatio,
                        color,
                        backgroundColor,
                        isLargeText
                    });
                }
            }
        });
        
        if (violations.length > 0) {
            this.errorMonitor?.logWarning({
                type: 'accessibility_color_contrast_violations',
                count: violations.length,
                violations: violations.map(v => ({
                    ratio: v.ratio,
                    required: v.requiredRatio,
                    element: v.element.tagName
                }))
            });
        }
        
        this.violations.push(...violations);
    }

    getBackgroundColor(element) {
        // Walk up the DOM tree to find the effective background color
        let current = element;
        while (current && current !== document.body) {
            const bg = window.getComputedStyle(current).backgroundColor;
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                return bg;
            }
            current = current.parentElement;
        }
        return 'rgb(255, 255, 255)'; // Default to white
    }

    calculateContrastRatio(color1, color2) {
        // Convert colors to RGB and calculate luminance
        const rgb1 = this.parseColor(color1);
        const rgb2 = this.parseColor(color2);
        
        const l1 = this.getLuminance(rgb1);
        const l2 = this.getLuminance(rgb2);
        
        const light = Math.max(l1, l2);
        const dark = Math.min(l1, l2);
        
        return (light + 0.05) / (dark + 0.05);
    }

    parseColor(color) {
        const div = document.createElement('div');
        div.style.color = color;
        document.body.appendChild(div);
        const computed = window.getComputedStyle(div).color;
        document.body.removeChild(div);
        
        const match = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3])
            };
        }
        return { r: 0, g: 0, b: 0 };
    }

    getLuminance(rgb) {
        const rsRGB = rgb.r / 255;
        const gsRGB = rgb.g / 255;
        const bsRGB = rgb.b / 255;
        
        const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    setupMotionPreferences() {
        // Respect user's motion preferences
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        const handleMotionPreference = (e) => {
            if (e.matches) {
                // User prefers reduced motion
                document.body.classList.add('reduced-motion');
                this.errorMonitor?.trackUserAction('reduced_motion_detected');
            } else {
                document.body.classList.remove('reduced-motion');
            }
        };
        
        handleMotionPreference(prefersReducedMotion);
        prefersReducedMotion.addEventListener('change', handleMotionPreference);
    }

    runAccessibilityAudit() {
        setTimeout(() => {
            this.auditHeadingStructure();
            this.auditFormLabels();
            this.auditImageAlts();
            this.auditLinkTexts();
            this.auditLandmarks();
            this.generateAccessibilityReport();
        }, 1000); // Run after initial page load
    }

    auditHeadingStructure() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const structure = Array.from(headings).map(h => ({
            level: parseInt(h.tagName.charAt(1)),
            text: h.textContent.trim(),
            element: h
        }));
        
        // Check for proper heading hierarchy
        let hasH1 = false;
        let previousLevel = 0;
        const violations = [];
        
        structure.forEach((heading, index) => {
            if (heading.level === 1) {
                hasH1 = true;
                if (index !== 0) {
                    violations.push({
                        type: 'h1_not_first',
                        element: heading.element,
                        message: 'H1 should be the first heading on the page'
                    });
                }
            }
            
            if (heading.level > previousLevel + 1) {
                violations.push({
                    type: 'heading_skip',
                    element: heading.element,
                    message: `Heading level skipped from H${previousLevel} to H${heading.level}`
                });
            }
            
            previousLevel = heading.level;
        });
        
        if (!hasH1) {
            violations.push({
                type: 'missing_h1',
                message: 'Page should have exactly one H1 heading'
            });
        }
        
        this.violations.push(...violations);
    }

    auditFormLabels() {
        const inputs = document.querySelectorAll('input, textarea, select');
        const violations = [];
        
        inputs.forEach(input => {
            const hasLabel = this.hasAccessibleLabel(input);
            if (!hasLabel) {
                violations.push({
                    type: 'missing_label',
                    element: input,
                    message: 'Form control missing accessible label'
                });
            }
        });
        
        this.violations.push(...violations);
    }

    auditImageAlts() {
        const images = document.querySelectorAll('img');
        const violations = [];
        
        images.forEach(img => {
            if (!img.hasAttribute('alt')) {
                violations.push({
                    type: 'missing_alt',
                    element: img,
                    message: 'Image missing alt attribute'
                });
            } else if (img.getAttribute('alt').trim() === '' && !img.getAttribute('role')) {
                // Empty alt should have role="presentation" for decorative images
                img.setAttribute('role', 'presentation');
            }
        });
        
        this.violations.push(...violations);
    }

    auditLinkTexts() {
        const links = document.querySelectorAll('a');
        const violations = [];
        
        links.forEach(link => {
            const text = this.getAccessibleName(link);
            if (!text || text.trim().length === 0) {
                violations.push({
                    type: 'empty_link_text',
                    element: link,
                    message: 'Link has no accessible text'
                });
            } else if (['click here', 'read more', 'more', 'link'].includes(text.toLowerCase().trim())) {
                violations.push({
                    type: 'generic_link_text',
                    element: link,
                    message: 'Link text is not descriptive'
                });
            }
        });
        
        this.violations.push(...violations);
    }

    auditLandmarks() {
        const landmarks = document.querySelectorAll('main, nav, header, footer, aside, section[aria-labelledby], section[aria-label]');
        const violations = [];
        
        // Check for main landmark
        const mainLandmarks = document.querySelectorAll('main');
        if (mainLandmarks.length === 0) {
            violations.push({
                type: 'missing_main_landmark',
                message: 'Page should have a main landmark'
            });
        } else if (mainLandmarks.length > 1) {
            violations.push({
                type: 'multiple_main_landmarks',
                message: 'Page should have only one main landmark'
            });
        }
        
        this.violations.push(...violations);
    }

    hasAccessibleLabel(element) {
        // Check various ways an element can have an accessible label
        if (element.getAttribute('aria-label')) return true;
        if (element.getAttribute('aria-labelledby')) return true;
        if (element.getAttribute('title')) return true;
        
        // Check for associated label element
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) return true;
        }
        
        // Check if wrapped in label
        const parentLabel = element.closest('label');
        if (parentLabel) return true;
        
        return false;
    }

    getAccessibleName(element) {
        // Get the accessible name using the accessibility tree computation
        const ariaLabel = element.getAttribute('aria-label');
        if (ariaLabel) return ariaLabel;
        
        const ariaLabelledBy = element.getAttribute('aria-labelledby');
        if (ariaLabelledBy) {
            const referencedElement = document.getElementById(ariaLabelledBy);
            if (referencedElement) return referencedElement.textContent.trim();
        }
        
        // For form controls, check associated label
        if (element.id) {
            const label = document.querySelector(`label[for="${element.id}"]`);
            if (label) return label.textContent.trim();
        }
        
        const parentLabel = element.closest('label');
        if (parentLabel) return parentLabel.textContent.trim();
        
        // Fallback to element's own text content
        return element.textContent.trim() || element.value || element.getAttribute('title') || '';
    }

    announceToScreenReader(message, priority = 'polite') {
        if (!this.config.announcements) return;
        
        const regionId = priority === 'assertive' ? 'assertive-announcements' : 'polite-announcements';
        const region = document.getElementById(regionId);
        
        if (region) {
            // Clear previous announcement
            region.textContent = '';
            
            // Small delay to ensure screen readers notice the change
            setTimeout(() => {
                region.textContent = message;
                
                // Clear after announcement
                setTimeout(() => {
                    region.textContent = '';
                }, 1000);
            }, 100);
            
            this.errorMonitor?.trackUserAction('screen_reader_announcement', {
                message: message.substring(0, 50),
                priority
            });
        }
    }

    generateAccessibilityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalViolations: this.violations.length,
            violationsByType: {},
            complianceLevel: this.violations.length === 0 ? 'AA' : 'Violations Found',
            recommendations: []
        };
        
        // Group violations by type
        this.violations.forEach(violation => {
            if (!report.violationsByType[violation.type]) {
                report.violationsByType[violation.type] = 0;
            }
            report.violationsByType[violation.type]++;
        });
        
        // Generate recommendations
        if (this.violations.length > 0) {
            report.recommendations = this.generateRecommendations();
        }
        
        // Log report
        console.group('[A11y] Accessibility Audit Report');
        console.log('Compliance Level:', report.complianceLevel);
        console.log('Total Violations:', report.totalViolations);
        if (report.totalViolations > 0) {
            console.log('Violations by Type:', report.violationsByType);
            console.log('Recommendations:', report.recommendations);
        }
        console.groupEnd();
        
        this.errorMonitor?.logInfo({
            type: 'accessibility_audit_complete',
            report: report
        });
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        const violationTypes = [...new Set(this.violations.map(v => v.type))];
        
        const recommendationMap = {
            'missing_label': 'Add proper labels to all form controls using <label> elements or aria-label attributes',
            'missing_alt': 'Add descriptive alt text to all images',
            'heading_skip': 'Use proper heading hierarchy (H1, H2, H3...) without skipping levels',
            'missing_h1': 'Add exactly one H1 heading to the page',
            'empty_link_text': 'Provide descriptive text for all links',
            'generic_link_text': 'Use specific, descriptive link text instead of generic phrases',
            'missing_main_landmark': 'Add a <main> landmark to identify the primary content',
            'multiple_main_landmarks': 'Use only one <main> landmark per page',
            'color_contrast': 'Ensure sufficient color contrast (4.5:1 for normal text, 3:1 for large text)'
        };
        
        violationTypes.forEach(type => {
            if (recommendationMap[type]) {
                recommendations.push(recommendationMap[type]);
            }
        });
        
        return recommendations;
    }

    generateId() {
        return 'a11y_' + Math.random().toString(36).substr(2, 9);
    }

    // Public API methods
    getViolations() {
        return [...this.violations];
    }

    getComplianceLevel() {
        return this.violations.length === 0 ? 'AA' : 'Violations Found';
    }

    fixViolation(violationId) {
        // Implementation for auto-fixing certain violations
        // This would be expanded based on specific violation types
    }

    enable() {
        this.config.announcements = true;
        console.log('[A11y] Accessibility enhancements enabled');
    }

    disable() {
        this.config.announcements = false;
        console.log('[A11y] Accessibility enhancements disabled');
    }
}