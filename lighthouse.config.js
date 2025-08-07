/**
 * Lighthouse CI Configuration
 * Performance monitoring for hotel guest communication system
 */

module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:.*:3000',
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless --disable-gpu',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        }
      }
    },
    assert: {
      assertions: {
        // Performance thresholds for hotel system
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 0.85 }],
        
        // Core Web Vitals - Critical for guest experience
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'first-meaningful-paint': ['error', { maxNumericValue: 2000 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        
        // Hotel-specific performance requirements
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'server-response-time': ['error', { maxNumericValue: 200 }],
        
        // Security requirements for guest data
        'is-on-https': 'error',
        'uses-http2': 'warn',
        'no-vulnerable-libraries': 'error',
        
        // Accessibility for international guests
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'aria-valid-attr': 'error',
        'button-name': 'error',
        'heading-order': 'error',
        'link-name': 'error',
        
        // PWA requirements for mobile guests
        'service-worker': 'warn',
        'viewport': 'error',
        'apple-touch-icon': 'warn',
        'manifest-short-name-length': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage',
      reportFilenamePattern: 'hotel-guest-comm-%%DATETIME%%-report.%%EXTENSION%%'
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'filesystem',
        sqlDatabasePath: './lighthouse-results.db'
      }
    }
  }
};