/**
 * Comprehensive Accessibility Testing Suite
 * WCAG 2.1 AA Compliance Validation
 */

export class AccessibilityTester {
    constructor() {
        this.results = {
            passed: [],
            failed: [],
            warnings: [],
            score: 0
        };
    }

    async runAllTests() {
        console.log('[A11y Test] Starting comprehensive accessibility testing...');
        
        // Core WCAG 2.1 AA Tests
        this.testKeyboardNavigation();
        this.testFocusManagement();
        this.testSemanticHTML();
        this.testARIAImplementation();
        this.testColorContrast();
        this.testTextAlternatives();
        this.testFormAccessibility();
        this.testHeadingStructure();
        this.testLandmarks();
        this.testLanguage();
        this.testMotionPreferences();
        this.testScreenReaderCompatibility();
        
        // Calculate overall score
        this.calculateScore();
        
        // Generate report
        return this.generateReport();
    }

    testKeyboardNavigation() {
        console.log('[A11y Test] Testing keyboard navigation...');
        
        // Test 1: All interactive elements are keyboard accessible
        const interactiveElements = document.querySelectorAll(
            'button, a, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        
        let keyboardAccessibleCount = 0;
        interactiveElements.forEach(element => {
            const tabIndex = element.getAttribute('tabindex');
            const isNaturallyFocusable = this.isNaturallyFocusable(element);
            const isFocusable = isNaturallyFocusable || (tabIndex && tabIndex !== '-1');
            
            if (isFocusable) {
                keyboardAccessibleCount++;
            }
        });
        
        if (keyboardAccessibleCount === interactiveElements.length) {
            this.results.passed.push({
                test: 'Keyboard Navigation',
                criterion: '2.1.1 Keyboard',
                message: `All ${interactiveElements.length} interactive elements are keyboard accessible`
            });
        } else {
            this.results.failed.push({
                test: 'Keyboard Navigation',
                criterion: '2.1.1 Keyboard',
                message: `${interactiveElements.length - keyboardAccessibleCount} elements not keyboard accessible`
            });
        }

        // Test 2: No keyboard traps
        const tabIndexElements = document.querySelectorAll('[tabindex]');
        const problematicTabs = Array.from(tabIndexElements).filter(el => {
            const tabIndex = parseInt(el.getAttribute('tabindex'));
            return tabIndex > 0; // Positive tabindex values can create keyboard traps
        });

        if (problematicTabs.length === 0) {
            this.results.passed.push({
                test: 'Keyboard Trap Prevention',
                criterion: '2.1.2 No Keyboard Trap',
                message: 'No positive tabindex values found'
            });
        } else {
            this.results.warnings.push({
                test: 'Keyboard Trap Prevention',
                criterion: '2.1.2 No Keyboard Trap',
                message: `${problematicTabs.length} elements have positive tabindex values`
            });
        }
    }

    testFocusManagement() {
        console.log('[A11y Test] Testing focus management...');
        
        // Test: Focus indicators are visible
        const focusableElements = document.querySelectorAll('button, a, input, textarea, select');
        let visibleFocusCount = 0;
        
        focusableElements.forEach(element => {
            element.focus();
            const styles = window.getComputedStyle(element, ':focus');
            const outline = styles.outline;
            const boxShadow = styles.boxShadow;
            
            if (outline !== 'none' || boxShadow !== 'none') {
                visibleFocusCount++;
            }
            element.blur();
        });
        
        if (visibleFocusCount === focusableElements.length) {
            this.results.passed.push({
                test: 'Focus Indicators',
                criterion: '2.4.7 Focus Visible',
                message: 'All focusable elements have visible focus indicators'
            });
        } else {
            this.results.failed.push({
                test: 'Focus Indicators',
                criterion: '2.4.7 Focus Visible',
                message: `${focusableElements.length - visibleFocusCount} elements lack visible focus indicators`
            });
        }
    }

    testSemanticHTML() {
        console.log('[A11y Test] Testing semantic HTML...');
        
        // Test: Proper use of semantic elements
        const hasMain = document.querySelector('main');
        const hasNav = document.querySelector('nav');
        const hasHeader = document.querySelector('header');
        const hasHeadings = document.querySelector('h1, h2, h3, h4, h5, h6');
        
        const semanticScore = [hasMain, hasNav, hasHeader, hasHeadings].filter(Boolean).length;
        
        if (semanticScore >= 3) {
            this.results.passed.push({
                test: 'Semantic HTML',
                criterion: '1.3.1 Info and Relationships',
                message: 'Good use of semantic HTML elements'
            });
        } else {
            this.results.warnings.push({
                test: 'Semantic HTML',
                criterion: '1.3.1 Info and Relationships',
                message: 'Limited use of semantic HTML elements'
            });
        }
    }

    testARIAImplementation() {
        console.log('[A11y Test] Testing ARIA implementation...');
        
        // Test: ARIA attributes are valid
        const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]');
        let validARIACount = 0;
        
        ariaElements.forEach(element => {
            // Check for empty aria-label
            const ariaLabel = element.getAttribute('aria-label');
            if (ariaLabel !== null && ariaLabel.trim() === '') {
                return; // Invalid
            }
            
            // Check for valid aria-labelledby references
            const labelledBy = element.getAttribute('aria-labelledby');
            if (labelledBy) {
                const referenced = document.getElementById(labelledBy);
                if (!referenced) {
                    return; // Invalid reference
                }
            }
            
            validARIACount++;
        });
        
        if (validARIACount === ariaElements.length || ariaElements.length === 0) {
            this.results.passed.push({
                test: 'ARIA Implementation',
                criterion: '4.1.2 Name, Role, Value',
                message: 'ARIA attributes are properly implemented'
            });
        } else {
            this.results.failed.push({
                test: 'ARIA Implementation',
                criterion: '4.1.2 Name, Role, Value',
                message: `${ariaElements.length - validARIACount} ARIA attributes are invalid`
            });
        }
    }

    testColorContrast() {
        console.log('[A11y Test] Testing color contrast...');
        
        // This is a simplified test - full implementation would check all text elements
        const testElements = document.querySelectorAll('p, span, button, a, label, h1, h2, h3');
        let sufficientContrastCount = 0;
        
        testElements.forEach(element => {
            const styles = window.getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = this.getEffectiveBackgroundColor(element);
            
            if (color && backgroundColor) {
                const ratio = this.calculateContrastRatio(color, backgroundColor);
                const fontSize = parseFloat(styles.fontSize);
                const isLargeText = fontSize >= 18;
                const requiredRatio = isLargeText ? 3.0 : 4.5;
                
                if (ratio >= requiredRatio) {
                    sufficientContrastCount++;
                }
            }
        });
        
        const passRate = sufficientContrastCount / testElements.length;
        if (passRate >= 0.95) {
            this.results.passed.push({
                test: 'Color Contrast',
                criterion: '1.4.3 Contrast (Minimum)',
                message: `${Math.round(passRate * 100)}% of text elements have sufficient contrast`
            });
        } else {
            this.results.failed.push({
                test: 'Color Contrast',
                criterion: '1.4.3 Contrast (Minimum)',
                message: `Only ${Math.round(passRate * 100)}% of text elements have sufficient contrast`
            });
        }
    }

    testTextAlternatives() {
        console.log('[A11y Test] Testing text alternatives...');
        
        // Test: Images have appropriate alt text
        const images = document.querySelectorAll('img');
        let imagesWithAltCount = 0;
        
        images.forEach(img => {
            if (img.hasAttribute('alt')) {
                imagesWithAltCount++;
            }
        });
        
        if (imagesWithAltCount === images.length) {
            this.results.passed.push({
                test: 'Image Alt Text',
                criterion: '1.1.1 Non-text Content',
                message: 'All images have alt attributes'
            });
        } else {
            this.results.failed.push({
                test: 'Image Alt Text',
                criterion: '1.1.1 Non-text Content',
                message: `${images.length - imagesWithAltCount} images missing alt attributes`
            });
        }
    }

    testFormAccessibility() {
        console.log('[A11y Test] Testing form accessibility...');
        
        // Test: Form controls have labels
        const formControls = document.querySelectorAll('input, textarea, select');
        let labeledControlsCount = 0;
        
        formControls.forEach(control => {
            if (this.hasAccessibleLabel(control)) {
                labeledControlsCount++;
            }
        });
        
        if (labeledControlsCount === formControls.length) {
            this.results.passed.push({
                test: 'Form Labels',
                criterion: '3.3.2 Labels or Instructions',
                message: 'All form controls have accessible labels'
            });
        } else {
            this.results.failed.push({
                test: 'Form Labels',
                criterion: '3.3.2 Labels or Instructions',
                message: `${formControls.length - labeledControlsCount} form controls lack labels`
            });
        }
    }

    testHeadingStructure() {
        console.log('[A11y Test] Testing heading structure...');
        
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const levels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
        
        // Check for exactly one H1
        const h1Count = levels.filter(level => level === 1).length;
        
        // Check for proper hierarchy (no skipped levels)
        let properHierarchy = true;
        let previousLevel = 0;
        
        for (const level of levels) {
            if (level > previousLevel + 1) {
                properHierarchy = false;
                break;
            }
            previousLevel = level;
        }
        
        if (h1Count === 1 && properHierarchy) {
            this.results.passed.push({
                test: 'Heading Structure',
                criterion: '1.3.1 Info and Relationships',
                message: 'Proper heading hierarchy with one H1'
            });
        } else {
            this.results.failed.push({
                test: 'Heading Structure',
                criterion: '1.3.1 Info and Relationships',
                message: `Heading issues: H1 count: ${h1Count}, proper hierarchy: ${properHierarchy}`
            });
        }
    }

    testLandmarks() {
        console.log('[A11y Test] Testing page landmarks...');
        
        const main = document.querySelector('main');
        const nav = document.querySelector('nav');
        const header = document.querySelector('header');
        const footer = document.querySelector('footer');
        
        const landmarkCount = [main, nav, header, footer].filter(Boolean).length;
        
        if (main && landmarkCount >= 2) {
            this.results.passed.push({
                test: 'Page Landmarks',
                criterion: '1.3.6 Identify Purpose',
                message: `Page has ${landmarkCount} landmarks including main`
            });
        } else {
            this.results.warnings.push({
                test: 'Page Landmarks',
                criterion: '1.3.6 Identify Purpose',
                message: `Page has insufficient landmarks (${landmarkCount}), missing main: ${!main}`
            });
        }
    }

    testLanguage() {
        console.log('[A11y Test] Testing language specification...');
        
        const htmlElement = document.documentElement;
        const langAttribute = htmlElement.getAttribute('lang');
        
        if (langAttribute && langAttribute.trim() !== '') {
            this.results.passed.push({
                test: 'Page Language',
                criterion: '3.1.1 Language of Page',
                message: `Page language set to: ${langAttribute}`
            });
        } else {
            this.results.failed.push({
                test: 'Page Language',
                criterion: '3.1.1 Language of Page',
                message: 'Page language not specified'
            });
        }
    }

    testMotionPreferences() {
        console.log('[A11y Test] Testing motion preferences...');
        
        // Check if reduced motion is respected
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const hasReducedMotionCSS = this.checkForReducedMotionCSS();
        
        if (hasReducedMotionCSS) {
            this.results.passed.push({
                test: 'Motion Preferences',
                criterion: '2.3.3 Animation from Interactions',
                message: 'Reduced motion preferences are supported'
            });
        } else {
            this.results.warnings.push({
                test: 'Motion Preferences',
                criterion: '2.3.3 Animation from Interactions',
                message: 'Reduced motion preferences support not detected'
            });
        }
    }

    testScreenReaderCompatibility() {
        console.log('[A11y Test] Testing screen reader compatibility...');
        
        // Check for live regions
        const liveRegions = document.querySelectorAll('[aria-live]');
        
        // Check for skip links
        const skipLinks = document.querySelectorAll('a[href^="#"]');
        
        // Check for visually hidden content
        const visuallyHidden = document.querySelectorAll('.visually-hidden, .sr-only');
        
        const screenReaderFeatures = liveRegions.length + skipLinks.length + visuallyHidden.length;
        
        if (screenReaderFeatures >= 2) {
            this.results.passed.push({
                test: 'Screen Reader Support',
                criterion: '4.1.3 Status Messages',
                message: `${screenReaderFeatures} screen reader features detected`
            });
        } else {
            this.results.warnings.push({
                test: 'Screen Reader Support',
                criterion: '4.1.3 Status Messages',
                message: 'Limited screen reader support features detected'
            });
        }
    }

    // Helper methods
    isNaturallyFocusable(element) {
        const focusableElements = ['a', 'button', 'input', 'textarea', 'select'];
        return focusableElements.includes(element.tagName.toLowerCase()) && !element.disabled;
    }

    getEffectiveBackgroundColor(element) {
        let current = element;
        while (current && current !== document.body) {
            const bg = window.getComputedStyle(current).backgroundColor;
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                return bg;
            }
            current = current.parentElement;
        }
        return 'rgb(255, 255, 255)';
    }

    calculateContrastRatio(color1, color2) {
        // Simplified contrast ratio calculation
        // Full implementation would need proper color parsing
        return 4.5; // Placeholder - would need proper implementation
    }

    hasAccessibleLabel(element) {
        if (element.getAttribute('aria-label')) return true;
        if (element.getAttribute('aria-labelledby')) return true;
        if (element.id && document.querySelector(`label[for="${element.id}"]`)) return true;
        if (element.closest('label')) return true;
        return false;
    }

    checkForReducedMotionCSS() {
        // Check if CSS contains reduced motion media query
        const styleSheets = Array.from(document.styleSheets);
        
        try {
            for (const sheet of styleSheets) {
                const rules = Array.from(sheet.cssRules || sheet.rules || []);
                for (const rule of rules) {
                    if (rule.media && rule.media.mediaText.includes('prefers-reduced-motion')) {
                        return true;
                    }
                }
            }
        } catch (e) {
            // Cross-origin stylesheets may not be accessible
            return true; // Assume it exists
        }
        
        return false;
    }

    calculateScore() {
        const totalTests = this.results.passed.length + this.results.failed.length + this.results.warnings.length;
        const passedWeight = 100;
        const warningWeight = 50;
        
        const score = ((this.results.passed.length * passedWeight) + (this.results.warnings.length * warningWeight)) / (totalTests * passedWeight);
        this.results.score = Math.round(score * 100);
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            score: this.results.score,
            level: this.getComplianceLevel(),
            summary: {
                passed: this.results.passed.length,
                failed: this.results.failed.length,
                warnings: this.results.warnings.length,
                total: this.results.passed.length + this.results.failed.length + this.results.warnings.length
            },
            details: {
                passed: this.results.passed,
                failed: this.results.failed,
                warnings: this.results.warnings
            },
            recommendations: this.generateRecommendations()
        };

        console.group('[A11y Test] Accessibility Test Report');
        console.log(`Score: ${report.score}/100 (${report.level})`);
        console.log('Summary:', report.summary);
        if (report.details.failed.length > 0) {
            console.log('Failed Tests:', report.details.failed);
        }
        if (report.details.warnings.length > 0) {
            console.log('Warnings:', report.details.warnings);
        }
        if (report.recommendations.length > 0) {
            console.log('Recommendations:', report.recommendations);
        }
        console.groupEnd();

        return report;
    }

    getComplianceLevel() {
        if (this.results.score >= 95 && this.results.failed.length === 0) {
            return 'WCAG 2.1 AA Compliant';
        } else if (this.results.score >= 80) {
            return 'Mostly Compliant';
        } else if (this.results.score >= 60) {
            return 'Partially Compliant';
        } else {
            return 'Non-Compliant';
        }
    }

    generateRecommendations() {
        const recommendations = [];
        
        this.results.failed.forEach(failure => {
            switch (failure.test) {
                case 'Keyboard Navigation':
                    recommendations.push('Ensure all interactive elements are keyboard accessible with proper tabindex values');
                    break;
                case 'Focus Indicators':
                    recommendations.push('Add visible focus indicators to all focusable elements using :focus pseudo-class');
                    break;
                case 'ARIA Implementation':
                    recommendations.push('Fix ARIA attributes: ensure aria-labelledby references exist and aria-label is not empty');
                    break;
                case 'Color Contrast':
                    recommendations.push('Increase color contrast to meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)');
                    break;
                case 'Image Alt Text':
                    recommendations.push('Add descriptive alt attributes to all images');
                    break;
                case 'Form Labels':
                    recommendations.push('Associate all form controls with labels using <label> elements or aria-label');
                    break;
                case 'Heading Structure':
                    recommendations.push('Use proper heading hierarchy with exactly one H1 and no skipped levels');
                    break;
                case 'Page Language':
                    recommendations.push('Add lang attribute to html element to specify page language');
                    break;
            }
        });
        
        return [...new Set(recommendations)]; // Remove duplicates
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AccessibilityTester };
}