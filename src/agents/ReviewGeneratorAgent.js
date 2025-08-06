/**
 * ReviewGeneratorAgent - Intelligent review generation with natural language processing
 * Implements agentic workflow patterns for autonomous review creation
 */
class ReviewGeneratorAgent {
    constructor(config = {}) {
        this.config = {
            hotelName: config.hotelName || 'our hotel',
            maxCommentLength: config.maxCommentLength || 200,
            templates: config.templates || this.getDefaultTemplates(),
            ...config
        };
        
        this.state = {
            selectedFeatures: [],
            staffMember: null,
            personalComments: '',
            generatedReview: '',
            confidence: 0,
            qualityScore: 0
        };
        
        this.logger = new SimpleLogger('ReviewGeneratorAgent');
    }
    
    /**
     * Main agent workflow - processes input and generates review
     */
    async processReviewRequest(input) {
        this.logger.info('Processing review request', { input });
        
        try {
            // Agent Decision Tree
            const workflow = [
                () => this.validateInput(input),
                () => this.analyzeFeatures(input.features),
                () => this.processStaffRecognition(input.staff),
                () => this.incorporatePersonalComments(input.comments),
                () => this.generateNaturalLanguageReview(),
                () => this.evaluateReviewQuality(),
                () => this.optimizeForPlatform(input.platform)
            ];
            
            // Execute workflow sequentially
            for (const step of workflow) {
                await step();
            }
            
            return {
                success: true,
                review: this.state.generatedReview,
                confidence: this.state.confidence,
                qualityScore: this.state.qualityScore,
                metadata: this.getReviewMetadata()
            };
            
        } catch (error) {
            this.logger.error('Review generation failed', error);
            return {
                success: false,
                error: error.message,
                fallback: this.generateFallbackReview(input)
            };
        }
    }
    
    /**
     * Input validation with intelligent error recovery
     */
    validateInput(input) {
        const validation = {
            hasFeatures: input.features && input.features.length > 0,
            hasComments: input.comments && input.comments.trim().length > 0,
            hasStaff: input.staff && input.staff.trim().length > 0
        };
        
        if (!validation.hasFeatures && !validation.hasComments) {
            throw new Error('Insufficient input for review generation');
        }
        
        this.logger.debug('Input validation passed', validation);
        return validation;
    }
    
    /**
     * Feature analysis with semantic understanding
     */
    analyzeFeatures(features) {
        if (!features || !features.length) {
            this.state.selectedFeatures = [];
            return;
        }
        
        // Intelligent feature categorization
        const categorizedFeatures = this.categorizeFeatures(features);
        const optimizedOrder = this.optimizeFeatureOrder(categorizedFeatures);
        
        this.state.selectedFeatures = optimizedOrder;
        this.state.confidence += 0.2 * features.length;
        
        this.logger.debug('Features analyzed', {
            original: features,
            categorized: categorizedFeatures,
            optimized: optimizedOrder
        });
    }
    
    /**
     * Staff recognition with natural language integration
     */
    processStaffRecognition(staffMember) {
        if (!staffMember || staffMember === 'Prefer not to mention') {
            this.state.staffMember = null;
            return;
        }
        
        this.state.staffMember = staffMember.trim();
        this.state.confidence += 0.15;
        
        this.logger.debug('Staff recognition processed', { staffMember });
    }
    
    /**
     * Personal comments processing with sentiment analysis
     */
    incorporatePersonalComments(comments) {
        if (!comments || !comments.trim()) {
            this.state.personalComments = '';
            return;
        }
        
        const processedComments = this.sanitizeAndOptimize(comments.trim());
        this.state.personalComments = processedComments;
        this.state.confidence += 0.25;
        
        this.logger.debug('Personal comments processed', {
            original: comments,
            processed: processedComments
        });
    }
    
    /**
     * Core natural language generation with advanced templates
     */
    generateNaturalLanguageReview() {
        const templates = this.selectOptimalTemplate();
        let review = templates.opening.replace('{hotelName}', this.config.hotelName);
        
        // Add features with natural flow
        if (this.state.selectedFeatures.length > 0) {
            review += ' ' + this.generateFeatureNarrative();
        }
        
        // Integrate staff recognition
        if (this.state.staffMember) {
            review += ' ' + this.generateStaffRecognition();
        }
        
        // Add personal comments
        if (this.state.personalComments) {
            review += ' ' + this.state.personalComments;
        }
        
        // Add compelling closing
        review += ' ' + this.selectClosing();
        
        // Final polish and optimization
        this.state.generatedReview = this.polishReview(review);
        
        this.logger.info('Natural language review generated', {
            length: this.state.generatedReview.length,
            confidence: this.state.confidence
        });
    }
    
    /**
     * Quality evaluation using multiple criteria
     */
    evaluateReviewQuality() {
        const metrics = {
            length: this.evaluateLength(),
            variety: this.evaluateVariety(),
            sentiment: this.evaluateSentiment(),
            authenticity: this.evaluateAuthenticity(),
            readability: this.evaluateReadability()
        };
        
        this.state.qualityScore = Object.values(metrics)
            .reduce((sum, score) => sum + score, 0) / Object.keys(metrics).length;
        
        this.logger.debug('Quality evaluation completed', {
            metrics,
            qualityScore: this.state.qualityScore
        });
    }
    
    /**
     * Platform-specific optimization
     */
    optimizeForPlatform(platform) {
        const optimizations = {
            booking: { maxLength: 4000, emphasizeValue: true },
            tripadvisor: { maxLength: 20000, emphasizeExperience: true },
            google: { maxLength: 4096, emphasizeLocation: true },
            expedia: { maxLength: 4000, emphasizeService: true }
        };
        
        const config = optimizations[platform] || optimizations.tripadvisor;
        
        if (this.state.generatedReview.length > config.maxLength) {
            this.state.generatedReview = this.truncateIntelligently(
                this.state.generatedReview, 
                config.maxLength
            );
        }
        
        this.logger.debug('Platform optimization applied', { platform, config });
    }
    
    /**
     * Helper Methods
     */
    categorizeFeatures(features) {
        const categories = {
            service: ['customer service', 'staff', 'hospitality'],
            accommodation: ['rooms', 'clean', 'comfortable', 'bed'],
            location: ['location', 'accessibility', 'nearby', 'transport'],
            amenities: ['facilities', 'amenities', 'pool', 'gym', 'spa'],
            dining: ['dining', 'restaurant', 'food', 'breakfast', 'meal'],
            value: ['value', 'price', 'worth', 'affordable', 'deal']
        };
        
        return features.map(feature => ({
            feature,
            category: this.identifyCategory(feature, categories),
            priority: this.calculateFeaturePriority(feature)
        }));
    }
    
    optimizeFeatureOrder(categorizedFeatures) {
        return categorizedFeatures
            .sort((a, b) => b.priority - a.priority)
            .map(item => item.feature);
    }
    
    generateFeatureNarrative() {
        const features = this.state.selectedFeatures;
        
        if (features.length === 1) {
            return `The ${features[0]} was exceptional.`;
        } else if (features.length === 2) {
            return `The ${features[0]} and ${features[1]} were outstanding.`;
        } else {
            const lastFeature = features[features.length - 1];
            const otherFeatures = features.slice(0, -1);
            return `The ${otherFeatures.join(', ')} were all excellent, and the ${lastFeature} was particularly impressive.`;
        }
    }
    
    generateStaffRecognition() {
        const templates = [
            `Special thanks to ${this.state.staffMember} for exceptional service.`,
            `${this.state.staffMember} went above and beyond to make our stay memorable.`,
            `We were particularly impressed by ${this.state.staffMember}'s professionalism and helpfulness.`,
            `${this.state.staffMember} provided outstanding customer service throughout our stay.`,
            `${this.state.staffMember}'s attention to detail and warm hospitality stood out.`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    selectClosing() {
        const closings = [
            'Highly recommend!',
            'Will definitely return!',
            'Exceeded expectations!',
            'Five stars!',
            'Outstanding experience overall!',
            'Perfect for our stay!',
            'Couldn\'t ask for more!',
            'Absolutely wonderful!'
        ];
        
        return closings[Math.floor(Math.random() * closings.length)];
    }
    
    polishReview(review) {
        return review
            .replace(/\s+/g, ' ')
            .replace(/\s+([.!?])/g, '$1')
            .trim();
    }
    
    // Quality evaluation methods
    evaluateLength() {
        const length = this.state.generatedReview.length;
        if (length < 50) return 0.3;
        if (length < 100) return 0.6;
        if (length < 200) return 0.9;
        if (length < 500) return 1.0;
        return 0.8; // Too long might be less engaging
    }
    
    evaluateVariety() {
        const words = this.state.generatedReview.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        return Math.min(uniqueWords.size / words.length * 2, 1.0);
    }
    
    evaluateSentiment() {
        const positiveWords = [
            'excellent', 'outstanding', 'wonderful', 'amazing', 'perfect',
            'exceptional', 'great', 'fantastic', 'impressive', 'beautiful'
        ];
        
        const words = this.state.generatedReview.toLowerCase().split(/\s+/);
        const positiveCount = words.filter(word => 
            positiveWords.some(pos => word.includes(pos))
        ).length;
        
        return Math.min(positiveCount / 5, 1.0);
    }
    
    evaluateAuthenticity() {
        // Check for personal touches, specific details, varied language
        let score = 0.5; // Base score
        
        if (this.state.personalComments) score += 0.3;
        if (this.state.staffMember) score += 0.2;
        if (this.state.selectedFeatures.length >= 3) score += 0.1;
        
        return Math.min(score, 1.0);
    }
    
    evaluateReadability() {
        const sentences = this.state.generatedReview.split(/[.!?]+/).length;
        const words = this.state.generatedReview.split(/\s+/).length;
        const avgWordsPerSentence = words / sentences;
        
        // Optimal range: 10-20 words per sentence
        if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
            return 1.0;
        } else if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 25) {
            return 0.8;
        } else {
            return 0.6;
        }
    }
    
    getReviewMetadata() {
        return {
            wordCount: this.state.generatedReview.split(/\s+/).length,
            sentenceCount: this.state.generatedReview.split(/[.!?]+/).length,
            hasStaffRecognition: !!this.state.staffMember,
            hasPersonalComments: !!this.state.personalComments,
            featureCount: this.state.selectedFeatures.length,
            generatedAt: new Date().toISOString()
        };
    }
    
    sanitizeAndOptimize(text) {
        return text
            .replace(/[<>]/g, '') // Basic XSS prevention
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    identifyCategory(feature, categories) {
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => feature.toLowerCase().includes(keyword))) {
                return category;
            }
        }
        return 'general';
    }
    
    calculateFeaturePriority(feature) {
        const priorities = {
            'excellent customer service': 0.9,
            'clean and comfortable rooms': 0.8,
            'great location and accessibility': 0.7,
            'outstanding dining experience': 0.6,
            'beautiful facilities and amenities': 0.5,
            'exceptional value for money': 0.4
        };
        
        return priorities[feature] || 0.3;
    }
    
    selectOptimalTemplate() {
        return {
            opening: `I had a wonderful stay at ${this.config.hotelName}.`
        };
    }
    
    generateFallbackReview(input) {
        return `Thank you for a pleasant stay at ${this.config.hotelName}. The experience was enjoyable and I would recommend it to others.`;
    }
    
    truncateIntelligently(text, maxLength) {
        if (text.length <= maxLength) return text;
        
        const truncated = text.substring(0, maxLength - 3);
        const lastSentence = truncated.lastIndexOf('.');
        
        if (lastSentence > maxLength * 0.7) {
            return truncated.substring(0, lastSentence + 1);
        }
        
        return truncated + '...';
    }
    
    getDefaultTemplates() {
        return {
            openings: [
                'I had a wonderful stay at {hotelName}.',
                'My experience at {hotelName} was exceptional.',
                'I recently stayed at {hotelName} and was impressed.'
            ],
            closings: [
                'Highly recommend!',
                'Will definitely return!',
                'Exceeded expectations!',
                'Five stars!'
            ]
        };
    }
}

// Simple logger for debugging
class SimpleLogger {
    constructor(component) {
        this.component = component;
        this.isDebugEnabled = window.location.search.includes('debug=true');
    }
    
    info(message, data = {}) {
        console.log(`[${this.component}] ${message}`, data);
    }
    
    debug(message, data = {}) {
        if (this.isDebugEnabled) {
            console.debug(`[${this.component}] ${message}`, data);
        }
    }
    
    error(message, error) {
        console.error(`[${this.component}] ${message}`, error);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ReviewGeneratorAgent, SimpleLogger };
}