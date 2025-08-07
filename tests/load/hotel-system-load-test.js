/**
 * Load Testing Scenarios for Hotel Guest Communication System
 * Tests system performance under various load conditions
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

// Test configuration
export const options = {
    stages: [
        // Ramp-up: gradually increase load
        { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
        { duration: '5m', target: 10 },   // Stay at 10 users for 5 minutes
        { duration: '2m', target: 50 },   // Ramp up to 50 users over 2 minutes
        { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
        { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
        { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
        { duration: '3m', target: 0 },    // Ramp down to 0 users over 3 minutes
    ],
    thresholds: {
        // Hotel system performance requirements
        http_req_duration: ['p(95)<2000', 'p(99)<3000'], // 95% under 2s, 99% under 3s
        http_req_failed: ['rate<0.05'],                   // Less than 5% failures
        errors: ['rate<0.1'],                            // Less than 10% errors
        response_time: ['p(95)<1500'],                   // 95% of responses under 1.5s
    },
    ext: {
        loadimpact: {
            name: 'Hotel Guest Communication System Load Test',
            projectID: 3595341,
        },
    },
};

// Test data
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const guestData = [
    { name: 'John Smith', email: 'john@example.com', rating: 5 },
    { name: 'Mary Johnson', email: 'mary@example.com', rating: 4 },
    { name: 'David Wilson', email: 'david@example.com', rating: 5 },
    { name: 'Sarah Brown', email: 'sarah@example.com', rating: 3 },
    { name: 'Mike Davis', email: 'mike@example.com', rating: 4 },
];

const properties = ['hotel-001', 'hotel-002', 'hotel-003', 'hotel-004'];

function randomGuest() {
    return guestData[Math.floor(Math.random() * guestData.length)];
}

function randomProperty() {
    return properties[Math.floor(Math.random() * properties.length)];
}

export default function () {
    // Simulate realistic user behavior for hotel staff and guests
    const scenarios = [
        { weight: 40, fn: guestFeedbackFlow },      // 40% guest feedback
        { weight: 25, fn: dashboardUsage },         // 25% dashboard usage
        { weight: 20, fn: feedbackRequestFlow },    // 20% feedback requests
        { weight: 10, fn: analyticsUsage },         // 10% analytics
        { weight: 5, fn: settingsManagement },      // 5% settings
    ];
    
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    randomScenario.fn();
    
    sleep(Math.random() * 3 + 1); // Random think time between 1-4 seconds
}

// Scenario 1: Guest Feedback Flow
function guestFeedbackFlow() {
    group('Guest Feedback Flow', function () {
        const guest = randomGuest();
        const propertyId = randomProperty();
        
        // Step 1: Load feedback form
        let response = http.get(`${BASE_URL}/feedback?property=${propertyId}`, {
            tags: { name: 'load_feedback_form' },
        });
        
        check(response, {
            'feedback form loaded': (r) => r.status === 200,
            'contains feedback form': (r) => r.body.includes('feedback'),
        });
        
        errorRate.add(response.status !== 200);
        responseTime.add(response.timings.duration);
        requestCount.add(1);
        
        sleep(Math.random() * 5 + 2); // User reads form and fills it
        
        // Step 2: Submit feedback
        const feedbackData = {
            guestName: guest.name,
            guestEmail: guest.email,
            propertyId: propertyId,
            rating: guest.rating,
            feedbackText: `Great experience at the hotel! Rating: ${guest.rating}/5`,
            categories: ['service', 'cleanliness'],
        };
        
        response = http.post(`${BASE_URL}/api/feedback`, JSON.stringify(feedbackData), {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'submit_feedback' },
        });
        
        check(response, {
            'feedback submitted successfully': (r) => r.status === 200 || r.status === 201,
            'response contains success': (r) => {
                try {
                    const data = JSON.parse(r.body);
                    return data.success === true;
                } catch {
                    return false;
                }
            },
        });
        
        errorRate.add(response.status < 200 || response.status >= 400);
        responseTime.add(response.timings.duration);
        requestCount.add(1);
    });
}

// Scenario 2: Dashboard Usage
function dashboardUsage() {
    group('Dashboard Usage', function () {
        // Step 1: Load dashboard
        let response = http.get(`${BASE_URL}/dashboard`, {
            tags: { name: 'load_dashboard' },
        });
        
        check(response, {
            'dashboard loaded': (r) => r.status === 200,
            'contains dashboard elements': (r) => r.body.includes('dashboard'),
        });
        
        errorRate.add(response.status !== 200);
        responseTime.add(response.timings.duration);
        requestCount.add(1);
        
        sleep(Math.random() * 3 + 1);
        
        // Step 2: Load dashboard data/stats
        response = http.get(`${BASE_URL}/api/stats`, {
            tags: { name: 'load_stats' },
        });
        
        check(response, {
            'stats loaded': (r) => r.status === 200,
        });
        
        errorRate.add(response.status !== 200);
        responseTime.add(response.timings.duration);
        requestCount.add(1);
        
        sleep(Math.random() * 2 + 1);
        
        // Step 3: Load recent feedback
        response = http.get(`${BASE_URL}/api/feedback/recent`, {
            tags: { name: 'load_recent_feedback' },
        });
        
        check(response, {
            'recent feedback loaded': (r) => r.status === 200,
        });
        
        errorRate.add(response.status !== 200);
        responseTime.add(response.timings.duration);
        requestCount.add(1);
    });
}

// Scenario 3: Feedback Request Flow
function feedbackRequestFlow() {
    group('Feedback Request Flow', function () {
        const guest = randomGuest();
        const propertyId = randomProperty();
        
        // Step 1: Create feedback request
        const requestData = {
            guestName: guest.name,
            guestEmail: guest.email,
            propertyId: propertyId,
            checkoutDate: new Date().toISOString().split('T')[0],
            templateId: 'standard-checkout',
        };
        
        let response = http.post(`${BASE_URL}/api/feedback-requests`, JSON.stringify(requestData), {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'create_feedback_request' },
        });
        
        check(response, {
            'feedback request created': (r) => r.status === 200 || r.status === 201,
        });
        
        errorRate.add(response.status < 200 || response.status >= 400);
        responseTime.add(response.timings.duration);
        requestCount.add(1);
        
        sleep(1);
        
        // Step 2: Check request status (simulate follow-up)
        if (response.status < 400) {
            try {
                const responseData = JSON.parse(response.body);
                if (responseData.requestId) {
                    response = http.get(`${BASE_URL}/api/feedback-requests/${responseData.requestId}`, {
                        tags: { name: 'check_request_status' },
                    });
                    
                    check(response, {
                        'request status checked': (r) => r.status === 200,
                    });
                    
                    errorRate.add(response.status !== 200);
                    responseTime.add(response.timings.duration);
                    requestCount.add(1);
                }
            } catch (e) {
                // Handle JSON parse errors
                errorRate.add(1);
            }
        }
    });
}

// Scenario 4: Analytics Usage
function analyticsUsage() {
    group('Analytics Usage', function () {
        const propertyId = randomProperty();
        
        // Step 1: Load analytics page
        let response = http.get(`${BASE_URL}/analytics`, {
            tags: { name: 'load_analytics' },
        });
        
        check(response, {
            'analytics page loaded': (r) => r.status === 200,
        });
        
        errorRate.add(response.status !== 200);
        responseTime.add(response.timings.duration);
        requestCount.add(1);
        
        sleep(1);
        
        // Step 2: Load property analytics
        response = http.get(`${BASE_URL}/api/analytics/properties/${propertyId}?period=30d`, {
            tags: { name: 'load_property_analytics' },
        });
        
        check(response, {
            'property analytics loaded': (r) => r.status === 200,
        });
        
        errorRate.add(response.status !== 200);
        responseTime.add(response.timings.duration);
        requestCount.add(1);
        
        sleep(2);
        
        // Step 3: Export data (occasionally)
        if (Math.random() < 0.2) { // 20% of analytics users export data
            const exportData = {
                format: 'csv',
                filters: { propertyId: propertyId },
                dateRange: { from: '2024-01-01', to: '2024-01-31' }
            };
            
            response = http.post(`${BASE_URL}/api/exports/feedback`, JSON.stringify(exportData), {
                headers: { 'Content-Type': 'application/json' },
                tags: { name: 'export_data' },
            });
            
            check(response, {
                'data export initiated': (r) => r.status === 200 || r.status === 202,
            });
            
            errorRate.add(response.status < 200 || response.status >= 400);
            responseTime.add(response.timings.duration);
            requestCount.add(1);
        }
    });
}

// Scenario 5: Settings Management
function settingsManagement() {
    group('Settings Management', function () {
        // Step 1: Load settings page
        let response = http.get(`${BASE_URL}/settings`, {
            tags: { name: 'load_settings' },
        });
        
        check(response, {
            'settings page loaded': (r) => r.status === 200,
        });
        
        errorRate.add(response.status !== 200);
        responseTime.add(response.timings.duration);
        requestCount.add(1);
        
        sleep(Math.random() * 2 + 1);
        
        // Step 2: Load integrations (occasionally)
        if (Math.random() < 0.5) {
            response = http.get(`${BASE_URL}/api/integrations`, {
                tags: { name: 'load_integrations' },
            });
            
            check(response, {
                'integrations loaded': (r) => r.status === 200,
            });
            
            errorRate.add(response.status !== 200);
            responseTime.add(response.timings.duration);
            requestCount.add(1);
        }
    });
}

// Setup function - runs before the test
export function setup() {
    console.log('🏨 Starting Hotel Guest Communication System Load Test');
    console.log(`Target URL: ${BASE_URL}`);
    
    // Warm up the application
    const warmupResponse = http.get(BASE_URL);
    if (warmupResponse.status !== 200) {
        console.warn('⚠️ Warning: Application may not be ready');
    } else {
        console.log('✅ Application is responding');
    }
    
    return { baseUrl: BASE_URL };
}

// Teardown function - runs after the test
export function teardown(data) {
    console.log('🏁 Load test completed');
    console.log(`Total requests made: ${requestCount.count}`);
    console.log(`Error rate: ${(errorRate.rate * 100).toFixed(2)}%`);
    console.log(`Average response time: ${responseTime.avg.toFixed(2)}ms`);
}

// Health check scenario for continuous monitoring
export function healthCheck() {
    group('Health Check', function () {
        const response = http.get(`${BASE_URL}/health`);
        
        check(response, {
            'health check passed': (r) => r.status === 200,
            'response time acceptable': (r) => r.timings.duration < 1000,
        });
        
        if (response.status !== 200) {
            console.error('❌ Health check failed:', response.status);
        }
    });
}