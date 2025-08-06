/**
 * PlatformRoutingAgent - Intelligent platform selection and routing
 * Handles business logic for determining optimal review platforms based on booking source
 */
class PlatformRoutingAgent {
    constructor(config = {}) {
        this.config = {
            platforms: config.platforms || this.getDefaultPlatforms(),
            routingRules: config.routingRules || this.getDefaultRoutingRules(),
            ...config
        };
        
        this.state = {
            detectedSource: null,
            primaryPlatforms: [],
            secondaryPlatforms: [],
            routingStrategy: 'balanced'
        };
        
        this.logger = new SimpleLogger('PlatformRoutingAgent');
    }
    
    /**
     * Main agent workflow - determines optimal platform routing
     */
    async processRoutingRequest(input) {
        this.logger.info('Processing platform routing request', { input });
        
        try {
            const workflow = [
                () => this.detectBookingSource(input.source, input.url),
                () => this.analyzeUserContext(input.userAgent, input.device),
                () => this.evaluatePlatformPriorities(input.preferences),
                () => this.generateRoutingStrategy(),
                () => this.optimizeForConversion(input.analytics)
            ];
            
            for (const step of workflow) {
                await step();
            }
            
            return {
                success: true,
                routing: {
                    primary: this.state.primaryPlatforms,
                    secondary: this.state.secondaryPlatforms,
                    strategy: this.state.routingStrategy
                },
                metadata: this.getRoutingMetadata()
            };
            
        } catch (error) {
            this.logger.error('Platform routing failed', error);
            return {
                success: false,
                error: error.message,
                fallback: this.generateFallbackRouting()
            };
        }
    }
    
    /**
     * Intelligent booking source detection
     */
    detectBookingSource(source, referrerUrl) {
        // URL parameter detection
        if (source) {
            this.state.detectedSource = source.toLowerCase();
            this.logger.debug('Source detected from parameter', { source });
            return;
        }
        
        // Referrer URL analysis
        if (referrerUrl) {
            const sourcePatterns = {
                booking: ['booking.com', 'priceline.com'],
                expedia: ['expedia.com', 'hotels.com', 'vrbo.com'],
                airbnb: ['airbnb.com', 'airbnb.co.uk'],
                agoda: ['agoda.com'],
                kayak: ['kayak.com']
            };
            
            for (const [platform, patterns] of Object.entries(sourcePatterns)) {
                if (patterns.some(pattern => referrerUrl.includes(pattern))) {
                    this.state.detectedSource = platform;
                    this.logger.debug('Source detected from referrer', { platform, referrerUrl });
                    return;
                }
            }
        }
        
        // Default to direct booking
        this.state.detectedSource = 'direct';
        this.logger.debug('No source detected, defaulting to direct');
    }
    
    /**
     * User context analysis for platform optimization
     */
    analyzeUserContext(userAgent, deviceInfo) {
        const context = {
            isMobile: this.isMobileDevice(userAgent),
            browser: this.detectBrowser(userAgent),
            region: this.detectRegion(),
            timeOfDay: new Date().getHours()
        };
        
        // Mobile users prefer simpler platform selection
        if (context.isMobile) {
            this.state.routingStrategy = 'mobile-optimized';
        }
        
        // Regional preferences
        if (context.region === 'EU') {
            this.adjustForGDPRCompliance();
        }
        
        this.logger.debug('User context analyzed', context);
        return context;
    }
    
    /**
     * Platform priority evaluation based on business rules
     */
    evaluatePlatformPriorities(preferences = {}) {
        const rules = this.config.routingRules[this.state.detectedSource] || 
                     this.config.routingRules.direct;
        
        // Apply base routing rules
        this.state.primaryPlatforms = this.rankPlatforms(rules.primary);
        this.state.secondaryPlatforms = this.rankPlatforms(rules.secondary);
        
        // Apply user preferences
        if (preferences.preferred) {
            this.promotePlatform(preferences.preferred);
        }
        
        if (preferences.avoided) {
            this.demotePlatform(preferences.avoided);
        }
        
        this.logger.debug('Platform priorities evaluated', {
            source: this.state.detectedSource,
            primary: this.state.primaryPlatforms,
            secondary: this.state.secondaryPlatforms
        });
    }
    
    /**
     * Generate optimal routing strategy
     */
    generateRoutingStrategy() {
        const strategies = {
            'conversion-focused': {
                primaryCount: 1,
                secondaryCount: 2,
                emphasis: 'primary'
            },
            'choice-maximized': {
                primaryCount: 2,
                secondaryCount: 3,
                emphasis: 'balanced'
            },
            'mobile-optimized': {
                primaryCount: 1,
                secondaryCount: 1,
                emphasis: 'primary'
            }
        };
        
        const strategy = strategies[this.state.routingStrategy] || strategies['conversion-focused'];
        
        // Limit platform lists based on strategy
        this.state.primaryPlatforms = this.state.primaryPlatforms.slice(0, strategy.primaryCount);
        this.state.secondaryPlatforms = this.state.secondaryPlatforms.slice(0, strategy.secondaryCount);
        
        this.logger.debug('Routing strategy generated', { strategy, state: this.state });
    }
    
    /**
     * Conversion optimization based on analytics
     */
    optimizeForConversion(analytics) {
        if (!analytics) return;
        
        // Platform performance data
        if (analytics.platformConversion) {
            this.reorderByConversionRate(analytics.platformConversion);
        }
        
        // A/B testing adjustments
        if (analytics.experiment) {
            this.applyExperimentalRouting(analytics.experiment);
        }
        
        this.logger.debug('Conversion optimization applied', { analytics });
    }
    
    /**
     * Helper Methods
     */
    rankPlatforms(platformKeys) {
        if (!platformKeys) return [];
        
        return platformKeys.map(key => {
            const platform = this.config.platforms[key];
            if (!platform) {
                this.logger.warn('Platform not found', { key });
                return null;
            }
            
            return {
                key,
                name: platform.name,
                url: platform.url,
                priority: platform.priority || 50,
                features: platform.features || []
            };
        }).filter(Boolean).sort((a, b) => b.priority - a.priority);
    }
    
    promotePlatform(platformKey) {
        // Move platform to front of primary list if not already there
        const platform = this.state.secondaryPlatforms.find(p => p.key === platformKey);
        if (platform) {
            this.state.secondaryPlatforms = this.state.secondaryPlatforms.filter(p => p.key !== platformKey);
            this.state.primaryPlatforms.unshift(platform);
        }
    }
    
    demotePlatform(platformKey) {
        this.state.primaryPlatforms = this.state.primaryPlatforms.filter(p => p.key !== platformKey);
        this.state.secondaryPlatforms = this.state.secondaryPlatforms.filter(p => p.key !== platformKey);
    }
    
    isMobileDevice(userAgent) {
        if (!userAgent) return false;
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    }
    
    detectBrowser(userAgent) {
        if (!userAgent) return 'unknown';
        
        if (userAgent.includes('Chrome')) return 'chrome';
        if (userAgent.includes('Firefox')) return 'firefox';
        if (userAgent.includes('Safari')) return 'safari';
        if (userAgent.includes('Edge')) return 'edge';
        
        return 'unknown';
    }
    
    detectRegion() {
        // Simple timezone-based region detection
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        if (timezone.includes('Europe/')) return 'EU';
        if (timezone.includes('America/')) return 'NA';
        if (timezone.includes('Asia/')) return 'ASIA';
        
        return 'unknown';
    }
    
    adjustForGDPRCompliance() {
        // Prioritize privacy-friendly platforms for EU users
        this.state.routingStrategy = 'privacy-focused';
    }
    
    reorderByConversionRate(conversionData) {
        const reorder = (platforms) => {
            return platforms.sort((a, b) => {
                const aRate = conversionData[a.key] || 0;
                const bRate = conversionData[b.key] || 0;
                return bRate - aRate;
            });
        };
        
        this.state.primaryPlatforms = reorder(this.state.primaryPlatforms);
        this.state.secondaryPlatforms = reorder(this.state.secondaryPlatforms);
    }
    
    applyExperimentalRouting(experiment) {
        if (experiment.type === 'platform_order' && Math.random() < experiment.ratio) {
            // Shuffle platform order for A/B testing
            this.state.primaryPlatforms = this.shuffleArray(this.state.primaryPlatforms);
        }
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    getRoutingMetadata() {
        return {
            detectedSource: this.state.detectedSource,
            strategy: this.state.routingStrategy,
            platformCount: {
                primary: this.state.primaryPlatforms.length,
                secondary: this.state.secondaryPlatforms.length
            },
            generatedAt: new Date().toISOString()
        };
    }
    
    generateFallbackRouting() {
        return {
            primary: [{ 
                key: 'tripadvisor', 
                name: 'TripAdvisor', 
                url: 'https://www.tripadvisor.com/UserReview' 
            }],
            secondary: [{ 
                key: 'google', 
                name: 'Google Maps', 
                url: 'https://search.google.com/local/writereview' 
            }],
            strategy: 'fallback'
        };
    }
    
    getDefaultPlatforms() {
        return {
            booking: {
                name: 'Booking.com',
                url: 'https://www.booking.com/reviewcenter.html',
                priority: 90,
                features: ['hotel-reviews', 'verified-bookings']
            },
            expedia: {
                name: 'Expedia',
                url: 'https://www.expedia.com/traveler/review/',
                priority: 85,
                features: ['hotel-reviews', 'travel-rewards']
            },
            tripadvisor: {
                name: 'TripAdvisor',
                url: 'https://www.tripadvisor.com/UserReview',
                priority: 95,
                features: ['comprehensive-reviews', 'travel-community']
            },
            google: {
                name: 'Google Maps',
                url: 'https://search.google.com/local/writereview',
                priority: 80,
                features: ['local-search', 'quick-reviews']
            },
            yelp: {
                name: 'Yelp',
                url: 'https://www.yelp.com/writeareview',
                priority: 70,
                features: ['local-business', 'detailed-reviews']
            }
        };
    }
    
    getDefaultRoutingRules() {
        return {
            direct: {
                primary: ['tripadvisor'],
                secondary: ['google', 'yelp']
            },
            booking: {
                primary: ['booking'],
                secondary: ['tripadvisor', 'google']
            },
            expedia: {
                primary: ['expedia'],
                secondary: ['tripadvisor', 'google']
            },
            airbnb: {
                primary: ['tripadvisor'],
                secondary: ['google', 'yelp']
            }
        };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlatformRoutingAgent };
}