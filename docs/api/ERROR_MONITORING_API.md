# Error Monitoring & Analytics API

## Overview

The `ErrorMonitor` class provides comprehensive error tracking, performance monitoring, and user analytics for the Hotel Review Generator. This document details the API surface and integration patterns.

## Class: ErrorMonitor

### Constructor
```javascript
const errorMonitor = new ErrorMonitor();
```

**Initialization:**
- Sets up global error handlers
- Generates unique session ID
- Initializes performance monitoring
- Configures storage systems

### Core Methods

#### Error Logging

##### `logError(errorData)`
Log application errors with full context.

**Parameters:**
- `errorData` (Object): Error information object

**Example:**
```javascript
errorMonitor.logError({
    type: 'application_error',
    context: 'review_generation',
    message: 'Failed to generate review',
    stack: error.stack,
    timestamp: new Date().toISOString(),
    sessionId: this.sessionId
});
```

##### `trackError(context, error)`
Convenience method for tracking caught errors.

**Parameters:**
- `context` (String): Error context identifier
- `error` (Error): JavaScript Error object

**Example:**
```javascript
try {
    generateReview();
} catch (error) {
    errorMonitor.trackError('review_generation', error);
}
```

#### Information Logging

##### `logInfo(infoData)`
Log informational events and metrics.

**Parameters:**
- `infoData` (Object): Information object

**Example:**
```javascript
errorMonitor.logInfo({
    type: 'performance_metrics',
    loadTime: 1250,
    domContentLoaded: 800,
    timestamp: new Date().toISOString()
});
```

##### `logWarning(warningData)`
Log warning-level events.

**Parameters:**
- `warningData` (Object): Warning information object

**Example:**
```javascript
errorMonitor.logWarning({
    type: 'clipboard_warning',
    message: 'Clipboard API not supported, using fallback',
    timestamp: new Date().toISOString()
});
```

#### User Action Tracking

##### `trackUserAction(action, data = {})`
Track user interactions and behaviors.

**Parameters:**
- `action` (String): Action identifier
- `data` (Object): Additional action data (optional)

**Example:**
```javascript
// Feature selection
errorMonitor.trackUserAction('feature_selected', {
    feature: 'excellent customer service',
    totalSelected: 3
});

// Review generation
errorMonitor.trackUserAction('review_generated', {
    length: 156,
    includesStaff: true,
    includesComments: false
});

// Clipboard operation
errorMonitor.trackUserAction('review_copied', {
    method: 'clipboard_api',
    success: true
});
```

### Configuration Methods

##### `setApiEndpoint(endpoint)`
Configure external monitoring service endpoint.

**Parameters:**
- `endpoint` (String): External API URL

**Example:**
```javascript
errorMonitor.setApiEndpoint('https://monitoring.example.com/api/errors');
```

##### `enable()` / `disable()`
Enable or disable error monitoring.

**Example:**
```javascript
// Disable monitoring for development
if (process.env.NODE_ENV === 'development') {
    errorMonitor.disable();
}
```

### Storage Methods

##### `getStoredErrors()`
Retrieve errors stored in localStorage.

**Returns:** Array of error objects

**Example:**
```javascript
const errors = errorMonitor.getStoredErrors();
console.log(`Found ${errors.length} stored errors`);
```

##### `clearStoredErrors()`
Clear all stored errors from localStorage.

**Example:**
```javascript
// Clear errors after successful upload to monitoring service
errorMonitor.clearStoredErrors();
```

## Event Types

### Error Types

#### `javascript_error`
Runtime JavaScript errors captured globally.

**Structure:**
```javascript
{
    type: 'javascript_error',
    message: 'Cannot read property of undefined',
    filename: '/index.html',
    lineno: 1250,
    colno: 15,
    stack: 'Error: Cannot read property...',
    timestamp: '2024-01-15T10:30:45.123Z',
    userAgent: 'Mozilla/5.0...',
    sessionId: 'session_1705312245123_abc123'
}
```

#### `unhandled_promise_rejection`
Unhandled Promise rejections.

**Structure:**
```javascript
{
    type: 'unhandled_promise_rejection',
    message: 'Network request failed',
    stack: 'Error: Network request failed...',
    timestamp: '2024-01-15T10:30:45.123Z',
    sessionId: 'session_1705312245123_abc123'
}
```

#### `resource_error`
Failed resource loading (images, scripts, etc.).

**Structure:**
```javascript
{
    type: 'resource_error',
    message: 'Failed to load resource: https://example.com/icon.png',
    element: 'IMG',
    timestamp: '2024-01-15T10:30:45.123Z',
    sessionId: 'session_1705312245123_abc123'
}
```

#### `application_error`
Application-specific errors from try-catch blocks.

**Structure:**
```javascript
{
    type: 'application_error',
    context: 'clipboard_operation',
    message: 'Clipboard access denied',
    stack: 'Error: Clipboard access denied...',
    timestamp: '2024-01-15T10:30:45.123Z',
    sessionId: 'session_1705312245123_abc123'
}
```

### Performance Types

#### `performance_metrics`
Page load and performance data.

**Structure:**
```javascript
{
    type: 'performance_metrics',
    loadTime: 1250,
    domContentLoaded: 800,
    firstContentfulPaint: 900,
    timestamp: '2024-01-15T10:30:45.123Z',
    sessionId: 'session_1705312245123_abc123'
}
```

#### `app_initialization_complete`
Application initialization timing.

**Structure:**
```javascript
{
    type: 'app_initialization_complete',
    initTime: 45.2,
    elementsFound: 8,
    timestamp: '2024-01-15T10:30:45.123Z',
    sessionId: 'session_1705312245123_abc123'
}
```

### User Action Types

#### `user_action`
Generic user interaction tracking.

**Structure:**
```javascript
{
    type: 'user_action',
    action: 'feature_selected',
    data: {
        feature: 'excellent customer service',
        totalSelected: 3
    },
    timestamp: '2024-01-15T10:30:45.123Z',
    sessionId: 'session_1705312245123_abc123'
}
```

### Connection Types

#### `connection_status`
Online/offline status changes.

**Structure:**
```javascript
{
    type: 'connection_status',
    status: 'offline',
    timestamp: '2024-01-15T10:30:45.123Z',
    sessionId: 'session_1705312245123_abc123'
}
```

### PWA Types

#### `service_worker_registered`
Service worker registration events.

**Structure:**
```javascript
{
    type: 'service_worker_registered',
    scope: '/',
    timestamp: '2024-01-15T10:30:45.123Z',
    sessionId: 'session_1705312245123_abc123'
}
```

#### `pwa_install_prompt_available`
PWA install prompt availability.

**Structure:**
```javascript
{
    type: 'pwa_install_prompt_available',
    timestamp: '2024-01-15T10:30:45.123Z',
    sessionId: 'session_1705312245123_abc123'
}
```

## Usage Patterns

### Application Initialization
```javascript
// Initialize error monitoring first
const errorMonitor = new ErrorMonitor();

// Configure external monitoring (optional)
if (production) {
    errorMonitor.setApiEndpoint('https://monitoring.example.com/api');
}

// Track application start
function initializeApp() {
    try {
        errorMonitor.trackUserAction('app_initialization_start');
        
        // ... initialization code ...
        
        errorMonitor.trackUserAction('app_initialization_complete', {
            initTime: performance.now() - startTime
        });
    } catch (error) {
        errorMonitor.trackError('app_initialization', error);
    }
}
```

### Feature Usage Tracking
```javascript
function handleFeatureSelection(checkbox) {
    try {
        // Business logic
        const feature = checkbox.value;
        const isSelected = checkbox.checked;
        
        // Track user action
        errorMonitor.trackUserAction('feature_selection', {
            feature: feature,
            selected: isSelected,
            totalSelected: getSelectedFeatureCount()
        });
        
        updateReviewPreview();
    } catch (error) {
        errorMonitor.trackError('feature_selection', error);
    }
}
```

### Clipboard Operations
```javascript
async function copyToClipboard() {
    try {
        errorMonitor.trackUserAction('clipboard_copy_attempt');
        
        await navigator.clipboard.writeText(reviewText);
        
        errorMonitor.trackUserAction('clipboard_copy_success', {
            method: 'clipboard_api',
            length: reviewText.length
        });
        
        return true;
    } catch (error) {
        errorMonitor.logWarning({
            type: 'clipboard_fallback_attempt',
            error: error.message
        });
        
        // Try fallback method
        return tryFallbackCopy();
    }
}
```

### Performance Monitoring
```javascript
// Track specific operations
function generateReview() {
    const startTime = performance.now();
    
    try {
        const review = createReviewText();
        
        errorMonitor.logInfo({
            type: 'review_generation_success',
            generationTime: performance.now() - startTime,
            reviewLength: review.length,
            featuresUsed: state.selectedFeatures.length
        });
        
        return review;
    } catch (error) {
        errorMonitor.trackError('review_generation', error);
        throw error;
    }
}
```

## External Integration

### Webhook Configuration
```javascript
// Configure monitoring service
errorMonitor.setApiEndpoint('https://your-monitoring-service.com/webhook');

// Optional: Configure custom headers
errorMonitor.setHeaders({
    'Authorization': 'Bearer your-api-key',
    'X-App-Version': '1.0.0'
});
```

### Custom Analytics Integration
```javascript
// Google Analytics 4 integration
errorMonitor.onUserAction((action, data) => {
    gtag('event', action, {
        custom_parameter_1: data.feature,
        custom_parameter_2: data.totalSelected
    });
});

// Custom analytics service
errorMonitor.onError((error) => {
    customAnalytics.trackError({
        message: error.message,
        context: error.context,
        sessionId: error.sessionId
    });
});
```

## Best Practices

### 1. Error Context
Always provide meaningful context when tracking errors:
```javascript
// Good
errorMonitor.trackError('review_generation_validation', error);

// Better
errorMonitor.trackError('review_generation_validation', error, {
    selectedFeatures: state.selectedFeatures,
    hasComments: !!state.personalComments,
    userAgent: navigator.userAgent
});
```

### 2. Performance Tracking
Track performance-critical operations:
```javascript
const startTime = performance.now();
performOperation();
errorMonitor.logInfo({
    type: 'operation_performance',
    operation: 'review_generation',
    duration: performance.now() - startTime
});
```

### 3. User Privacy
Avoid logging sensitive user data:
```javascript
// Good - log structure, not content
errorMonitor.trackUserAction('review_generated', {
    length: review.length,
    wordCount: review.split(' ').length
});

// Avoid - don't log actual review content
// errorMonitor.trackUserAction('review_generated', { content: review });
```

### 4. Error Recovery
Provide fallback behavior and track recovery attempts:
```javascript
try {
    primaryOperation();
} catch (error) {
    errorMonitor.trackError('primary_operation_failed', error);
    
    try {
        fallbackOperation();
        errorMonitor.trackUserAction('fallback_operation_success');
    } catch (fallbackError) {
        errorMonitor.trackError('fallback_operation_failed', fallbackError);
        showUserErrorMessage();
    }
}
```