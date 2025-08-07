#!/usr/bin/env node

/**
 * Performance Monitoring Script
 * Monitors the hotel guest communication system performance
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

class PerformanceMonitor {
    constructor() {
        this.thresholds = {
            performance: 85,
            accessibility: 95,
            bestPractices: 90,
            seo: 85,
            pwa: 80
        };
        
        this.vitalsThresholds = {
            firstContentfulPaint: 2000,
            largestContentfulPaint: 2500,
            cumulativeLayoutShift: 0.1,
            firstInputDelay: 100,
            timeToInteractive: 3000
        };
    }

    async runAudit(url = 'http://localhost:3000') {
        console.log(`🔍 Running performance audit for: ${url}`);
        
        const chrome = await chromeLauncher.launch({
            chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu']
        });

        try {
            const options = {
                logLevel: 'info',
                output: 'json',
                onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
                port: chrome.port,
                settings: {
                    emulatedFormFactor: 'desktop',
                    throttling: {
                        rttMs: 40,
                        throughputKbps: 10240,
                        cpuSlowdownMultiplier: 1
                    }
                }
            };

            const runnerResult = await lighthouse(url, options);
            await this.processResults(runnerResult);
            
            return runnerResult;
        } finally {
            await chrome.kill();
        }
    }

    async processResults(runnerResult) {
        const results = runnerResult.lhr;
        const scores = this.extractScores(results);
        const vitals = this.extractWebVitals(results);
        
        console.log('\n📊 Performance Results:');
        console.log('═══════════════════════');
        
        // Category scores
        Object.entries(scores).forEach(([category, score]) => {
            const threshold = this.thresholds[category];
            const status = score >= threshold ? '✅' : '❌';
            const percentage = Math.round(score * 100);
            
            console.log(`${status} ${category.padEnd(15)}: ${percentage}% (threshold: ${threshold}%)`);
        });
        
        console.log('\n🎯 Core Web Vitals:');
        console.log('═══════════════════');
        
        // Web vitals
        Object.entries(vitals).forEach(([metric, value]) => {
            const threshold = this.vitalsThresholds[metric];
            const status = value <= threshold ? '✅' : '❌';
            const displayValue = metric === 'cumulativeLayoutShift' 
                ? value.toFixed(3) 
                : `${Math.round(value)}ms`;
            
            console.log(`${status} ${metric.padEnd(25)}: ${displayValue} (threshold: ${threshold}${metric === 'cumulativeLayoutShift' ? '' : 'ms'})`);
        });
        
        // Save detailed results
        await this.saveResults(results, scores, vitals);
        
        // Check if audit passes
        const auditPassed = this.checkThresholds(scores, vitals);
        
        if (!auditPassed) {
            console.log('\n❌ Performance audit failed - some thresholds not met');
            process.exit(1);
        } else {
            console.log('\n✅ Performance audit passed - all thresholds met');
        }
    }

    extractScores(results) {
        return {
            performance: results.categories.performance?.score || 0,
            accessibility: results.categories.accessibility?.score || 0,
            bestPractices: results.categories['best-practices']?.score || 0,
            seo: results.categories.seo?.score || 0,
            pwa: results.categories.pwa?.score || 0
        };
    }

    extractWebVitals(results) {
        const audits = results.audits;
        
        return {
            firstContentfulPaint: audits['first-contentful-paint']?.numericValue || 0,
            largestContentfulPaint: audits['largest-contentful-paint']?.numericValue || 0,
            cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue || 0,
            firstInputDelay: audits['max-potential-fid']?.numericValue || 0,
            timeToInteractive: audits['interactive']?.numericValue || 0
        };
    }

    checkThresholds(scores, vitals) {
        // Check category scores
        const categoryChecks = Object.entries(scores).every(([category, score]) => {
            const threshold = this.thresholds[category];
            return (score * 100) >= threshold;
        });
        
        // Check web vitals
        const vitalsChecks = Object.entries(vitals).every(([metric, value]) => {
            const threshold = this.vitalsThresholds[metric];
            return value <= threshold;
        });
        
        return categoryChecks && vitalsChecks;
    }

    async saveResults(results, scores, vitals) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputDir = path.join(process.cwd(), 'performance-reports');
        
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Save full lighthouse report
        const reportPath = path.join(outputDir, `lighthouse-report-${timestamp}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        
        // Save summary report
        const summary = {
            timestamp: new Date().toISOString(),
            url: results.requestedUrl,
            scores,
            vitals,
            recommendations: this.generateRecommendations(results),
            passed: this.checkThresholds(scores, vitals)
        };
        
        const summaryPath = path.join(outputDir, `performance-summary-${timestamp}.json`);
        fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
        
        // Update latest report
        const latestPath = path.join(outputDir, 'latest-performance-report.json');
        fs.writeFileSync(latestPath, JSON.stringify(summary, null, 2));
        
        console.log(`\n📁 Reports saved:`);
        console.log(`   Full report: ${reportPath}`);
        console.log(`   Summary: ${summaryPath}`);
    }

    generateRecommendations(results) {
        const recommendations = [];
        const audits = results.audits;
        
        // Performance recommendations
        if (audits['render-blocking-resources']?.score < 0.9) {
            recommendations.push({
                category: 'performance',
                issue: 'Render-blocking resources',
                suggestion: 'Eliminate render-blocking CSS and JavaScript',
                impact: 'high'
            });
        }
        
        if (audits['unused-css-rules']?.score < 0.9) {
            recommendations.push({
                category: 'performance',
                issue: 'Unused CSS',
                suggestion: 'Remove unused CSS rules to reduce bundle size',
                impact: 'medium'
            });
        }
        
        if (audits['efficient-animated-content']?.score < 0.9) {
            recommendations.push({
                category: 'performance',
                issue: 'Inefficient animations',
                suggestion: 'Use CSS animations instead of JavaScript for better performance',
                impact: 'medium'
            });
        }
        
        // Accessibility recommendations
        if (audits['color-contrast']?.score < 1) {
            recommendations.push({
                category: 'accessibility',
                issue: 'Color contrast',
                suggestion: 'Ensure sufficient color contrast for text elements',
                impact: 'high'
            });
        }
        
        if (audits['image-alt']?.score < 1) {
            recommendations.push({
                category: 'accessibility',
                issue: 'Missing alt text',
                suggestion: 'Add descriptive alt text to all images',
                impact: 'high'
            });
        }
        
        // SEO recommendations
        if (audits['meta-description']?.score < 1) {
            recommendations.push({
                category: 'seo',
                issue: 'Missing meta description',
                suggestion: 'Add meta description for better search engine visibility',
                impact: 'medium'
            });
        }
        
        return recommendations;
    }

    async monitorContinuously(url, intervalMinutes = 60) {
        console.log(`🔄 Starting continuous monitoring every ${intervalMinutes} minutes`);
        
        const monitor = async () => {
            try {
                await this.runAudit(url);
            } catch (error) {
                console.error('❌ Monitoring run failed:', error.message);
            }
        };
        
        // Run initial audit
        await monitor();
        
        // Schedule recurring audits
        setInterval(monitor, intervalMinutes * 60 * 1000);
    }

    async compareWithBaseline(baselineFile) {
        if (!fs.existsSync(baselineFile)) {
            console.log('📋 No baseline found, current results will be used as baseline');
            return;
        }
        
        const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
        const current = JSON.parse(fs.readFileSync(
            path.join(process.cwd(), 'performance-reports', 'latest-performance-report.json'), 
            'utf8'
        ));
        
        console.log('\n📈 Performance Comparison:');
        console.log('══════════════════════');
        
        Object.entries(current.scores).forEach(([category, score]) => {
            const baselineScore = baseline.scores[category];
            const diff = (score - baselineScore) * 100;
            const arrow = diff > 0 ? '↗️' : diff < 0 ? '↘️' : '➡️';
            const color = diff > 0 ? '✅' : diff < 0 ? '❌' : '⚪';
            
            console.log(`${color} ${category.padEnd(15)}: ${Math.round(score * 100)}% ${arrow} ${diff.toFixed(1)}%`);
        });
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const monitor = new PerformanceMonitor();
    
    switch (args[0]) {
        case 'audit':
            const url = args[1] || 'http://localhost:3000';
            await monitor.runAudit(url);
            break;
            
        case 'monitor':
            const monitorUrl = args[1] || 'http://localhost:3000';
            const interval = parseInt(args[2]) || 60;
            await monitor.monitorContinuously(monitorUrl, interval);
            break;
            
        case 'compare':
            const baselineFile = args[1] || 'performance-baseline.json';
            await monitor.compareWithBaseline(baselineFile);
            break;
            
        default:
            console.log(`
🎯 Hotel Guest Communication Performance Monitor

Usage:
  node performance-monitor.js audit [url]           # Run single audit
  node performance-monitor.js monitor [url] [min]   # Continuous monitoring
  node performance-monitor.js compare [baseline]    # Compare with baseline

Examples:
  node performance-monitor.js audit http://localhost:3000
  node performance-monitor.js monitor https://your-hotel-system.com 30
  node performance-monitor.js compare performance-baseline.json
            `);
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = PerformanceMonitor;