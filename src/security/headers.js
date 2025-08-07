/**
 * Security Headers Configuration
 * Implements proper security headers for production deployment
 */

export const securityHeaders = {
    // Content Security Policy - Prevents XSS and code injection
    'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.hotel-system.com https://*.crm-system.com",
        "media-src 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
        "upgrade-insecure-requests"
    ].join('; '),

    // Prevent clickjacking attacks
    'X-Frame-Options': 'DENY',

    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',

    // Enforce HTTPS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Permissions policy
    'Permissions-Policy': [
        'camera=()',
        'microphone=()',
        'geolocation=(self)',
        'payment=(self)'
    ].join(', ')
};

/**
 * Apply security headers to HTML response
 * @param {Response} response - HTTP response object
 * @returns {Response} Response with security headers
 */
export function applySecurityHeaders(response) {
    Object.entries(securityHeaders).forEach(([header, value]) => {
        response.headers.set(header, value);
    });
    return response;
}

/**
 * Generate meta tags for CSP and security
 * @returns {string} HTML meta tags
 */
export function generateSecurityMetaTags() {
    return `
    <meta http-equiv="Content-Security-Policy" content="${securityHeaders['Content-Security-Policy']}">
    <meta http-equiv="X-Content-Type-Options" content="nosniff">
    <meta http-equiv="X-Frame-Options" content="DENY">
    <meta http-equiv="X-XSS-Protection" content="1; mode=block">
    <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
    `.trim();
}