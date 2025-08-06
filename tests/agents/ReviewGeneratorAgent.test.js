/**
 * ReviewGeneratorAgent Tests
 */

// Import the agent (in real project would use proper module system)
const { ReviewGeneratorAgent, SimpleLogger } = require('../../src/agents/ReviewGeneratorAgent.js')

describe('ReviewGeneratorAgent', () => {
    let agent
    let mockLogger

    beforeEach(() => {
        mockLogger = TestUtils.createMockLogger()
        global.SimpleLogger = jest.fn().mockReturnValue(mockLogger)
        
        agent = new ReviewGeneratorAgent({
            hotelName: 'Test Hotel',
            maxCommentLength: 200
        })
    })

    describe('initialization', () => {
        test('should initialize with default configuration', () => {
            const defaultAgent = new ReviewGeneratorAgent()
            
            expect(defaultAgent.config.hotelName).toBe('our hotel')
            expect(defaultAgent.config.maxCommentLength).toBe(200)
            expect(defaultAgent.state.selectedFeatures).toEqual([])
            expect(defaultAgent.state.generatedReview).toBe('')
        })

        test('should initialize with custom configuration', () => {
            const customAgent = new ReviewGeneratorAgent({
                hotelName: 'Grand Hotel',
                maxCommentLength: 300
            })

            expect(customAgent.config.hotelName).toBe('Grand Hotel')
            expect(customAgent.config.maxCommentLength).toBe(300)
        })

        test('should initialize logger', () => {
            expect(SimpleLogger).toHaveBeenCalledWith('ReviewGeneratorAgent')
            expect(agent.logger).toBe(mockLogger)
        })
    })

    describe('processReviewRequest', () => {
        test('should generate review with valid input', async () => {
            const input = {
                features: ['excellent customer service', 'clean rooms'],
                staff: 'Sarah',
                comments: 'Great experience overall',
                platform: 'booking'
            }

            const result = await agent.processReviewRequest(input)

            expect(result.success).toBe(true)
            expect(result.review).toBeTruthy()
            expect(result.confidence).toBeGreaterThan(0)
            expect(result.qualityScore).toBeGreaterThan(0)
            expect(result.metadata).toBeDefined()
        })

        test('should handle minimal input', async () => {
            const input = {
                features: ['excellent customer service'],
                staff: '',
                comments: '',
                platform: 'direct'
            }

            const result = await agent.processReviewRequest(input)

            expect(result.success).toBe(true)
            expect(result.review).toContain('Test Hotel')
            expect(result.review).toContain('excellent customer service')
        })

        test('should return fallback on insufficient input', async () => {
            const input = {
                features: [],
                staff: '',
                comments: '',
                platform: 'direct'
            }

            const result = await agent.processReviewRequest(input)

            expect(result.success).toBe(false)
            expect(result.error).toBeTruthy()
            expect(result.fallback).toBeTruthy()
        })

        test('should handle errors gracefully', async () => {
            // Mock validation to throw error
            agent.validateInput = jest.fn().mockImplementation(() => {
                throw new Error('Validation failed')
            })

            const input = {
                features: ['service'],
                staff: '',
                comments: '',
                platform: 'direct'
            }

            const result = await agent.processReviewRequest(input)

            expect(result.success).toBe(false)
            expect(result.error).toBe('Validation failed')
            expect(result.fallback).toBeTruthy()
            expect(mockLogger.error).toHaveBeenCalled()
        })
    })

    describe('validateInput', () => {
        test('should pass validation with features', () => {
            const input = {
                features: ['excellent service'],
                comments: '',
                staff: ''
            }

            expect(() => agent.validateInput(input)).not.toThrow()
        })

        test('should pass validation with comments', () => {
            const input = {
                features: [],
                comments: 'Great stay!',
                staff: ''
            }

            expect(() => agent.validateInput(input)).not.toThrow()
        })

        test('should fail validation without features or comments', () => {
            const input = {
                features: [],
                comments: '',
                staff: 'John'
            }

            expect(() => agent.validateInput(input)).toThrow('Insufficient input for review generation')
        })
    })

    describe('analyzeFeatures', () => {
        test('should analyze and categorize features', () => {
            const features = ['excellent customer service', 'clean rooms', 'great location']
            
            agent.analyzeFeatures(features)

            expect(agent.state.selectedFeatures).toHaveLength(3)
            expect(agent.state.confidence).toBeGreaterThan(0)
            expect(mockLogger.debug).toHaveBeenCalledWith('Features analyzed', expect.any(Object))
        })

        test('should handle empty features array', () => {
            agent.analyzeFeatures([])

            expect(agent.state.selectedFeatures).toEqual([])
        })

        test('should handle null/undefined features', () => {
            agent.analyzeFeatures(null)
            expect(agent.state.selectedFeatures).toEqual([])

            agent.analyzeFeatures(undefined)
            expect(agent.state.selectedFeatures).toEqual([])
        })
    })

    describe('processStaffRecognition', () => {
        test('should process valid staff member', () => {
            agent.processStaffRecognition('Sarah Johnson')

            expect(agent.state.staffMember).toBe('Sarah Johnson')
            expect(agent.state.confidence).toBeGreaterThan(0)
        })

        test('should handle "Prefer not to mention"', () => {
            agent.processStaffRecognition('Prefer not to mention')

            expect(agent.state.staffMember).toBeNull()
        })

        test('should handle empty staff input', () => {
            agent.processStaffRecognition('')

            expect(agent.state.staffMember).toBeNull()
        })

        test('should trim whitespace', () => {
            agent.processStaffRecognition('  John Doe  ')

            expect(agent.state.staffMember).toBe('John Doe')
        })
    })

    describe('incorporatePersonalComments', () => {
        test('should process valid comments', () => {
            const comments = 'The hotel exceeded my expectations in every way!'
            
            agent.incorporatePersonalComments(comments)

            expect(agent.state.personalComments).toBe(comments)
            expect(agent.state.confidence).toBeGreaterThan(0)
        })

        test('should handle empty comments', () => {
            agent.incorporatePersonalComments('')

            expect(agent.state.personalComments).toBe('')
        })

        test('should sanitize comments', () => {
            const comments = 'Great stay! <script>alert("xss")</script>'
            
            agent.incorporatePersonalComments(comments)

            expect(agent.state.personalComments).not.toContain('<script>')
            expect(agent.state.personalComments).not.toContain('</script>')
        })

        test('should trim and normalize whitespace', () => {
            const comments = '  Multiple   spaces   and  \n\n newlines  '
            
            agent.incorporatePersonalComments(comments)

            expect(agent.state.personalComments).toBe('Multiple spaces and newlines')
        })
    })

    describe('generateNaturalLanguageReview', () => {
        beforeEach(() => {
            agent.state.selectedFeatures = ['excellent customer service', 'clean rooms']
            agent.state.staffMember = 'Sarah'
            agent.state.personalComments = 'Perfect location!'
        })

        test('should generate complete review', () => {
            agent.generateNaturalLanguageReview()

            const review = agent.state.generatedReview
            expect(review).toContain('Test Hotel')
            expect(review).toContain('excellent customer service')
            expect(review).toContain('clean rooms')
            expect(review).toContain('Sarah')
            expect(review).toContain('Perfect location!')
        })

        test('should generate review with single feature', () => {
            agent.state.selectedFeatures = ['excellent service']
            agent.state.staffMember = null
            agent.state.personalComments = ''

            agent.generateNaturalLanguageReview()

            const review = agent.state.generatedReview
            expect(review).toContain('Test Hotel')
            expect(review).toContain('excellent service')
            expect(review).toContain('exceptional')
        })

        test('should generate review with multiple features', () => {
            agent.state.selectedFeatures = ['service', 'location', 'rooms', 'dining']

            agent.generateNaturalLanguageReview()

            const review = agent.state.generatedReview
            expect(review).toContain('service, location, rooms')
            expect(review).toContain('dining')
        })
    })

    describe('evaluateReviewQuality', () => {
        beforeEach(() => {
            agent.state.generatedReview = 'I had a wonderful stay at Test Hotel. The excellent customer service was exceptional. Sarah went above and beyond. Perfect location! Highly recommend!'
        })

        test('should evaluate quality metrics', () => {
            agent.evaluateReviewQuality()

            expect(agent.state.qualityScore).toBeGreaterThan(0)
            expect(agent.state.qualityScore).toBeLessThanOrEqual(1)
            expect(mockLogger.debug).toHaveBeenCalledWith('Quality evaluation completed', expect.any(Object))
        })

        test('should handle empty review', () => {
            agent.state.generatedReview = ''
            
            agent.evaluateReviewQuality()

            expect(agent.state.qualityScore).toBeDefined()
            expect(agent.state.qualityScore).toBeGreaterThanOrEqual(0)
        })
    })

    describe('optimizeForPlatform', () => {
        beforeEach(() => {
            agent.state.generatedReview = 'Long review that might need truncation for certain platforms with character limits that are enforced by the platform providers'
        })

        test('should optimize for booking platform', () => {
            const originalLength = agent.state.generatedReview.length
            
            agent.optimizeForPlatform('booking')

            // Should not truncate if under limit
            if (originalLength <= 4000) {
                expect(agent.state.generatedReview.length).toBe(originalLength)
            }
        })

        test('should truncate for platform limits', () => {
            agent.state.generatedReview = 'A'.repeat(5000) // Very long review
            
            agent.optimizeForPlatform('booking')

            expect(agent.state.generatedReview.length).toBeLessThan(5000)
        })

        test('should handle unknown platform', () => {
            const originalReview = agent.state.generatedReview
            
            agent.optimizeForPlatform('unknown-platform')

            // Should default to tripadvisor limits
            expect(agent.state.generatedReview).toBeDefined()
        })
    })

    describe('helper methods', () => {
        test('categorizeFeatures should group features correctly', () => {
            const features = ['customer service', 'clean rooms', 'great location', 'pool']
            
            const categorized = agent.categorizeFeatures(features)

            expect(categorized).toHaveLength(4)
            expect(categorized[0]).toHaveProperty('feature')
            expect(categorized[0]).toHaveProperty('category')
            expect(categorized[0]).toHaveProperty('priority')
        })

        test('generateFeatureNarrative should create proper narrative', () => {
            agent.state.selectedFeatures = ['service', 'location']
            
            const narrative = agent.generateFeatureNarrative()

            expect(narrative).toContain('service')
            expect(narrative).toContain('location')
            expect(narrative).toContain('and')
        })

        test('generateStaffRecognition should create recognition text', () => {
            agent.state.staffMember = 'John'
            
            const recognition = agent.generateStaffRecognition()

            expect(recognition).toContain('John')
            expect(recognition.length).toBeGreaterThan(10)
        })

        test('polishReview should clean up text', () => {
            const messy = 'Text   with    extra   spaces  .   And   punctuation !'
            
            const polished = agent.polishReview(messy)

            expect(polished).not.toMatch(/\s{2,}/)
            expect(polished).not.toMatch(/\s+[.!?]/g)
            expect(polished.trim()).toBe(polished)
        })
    })

    describe('error handling', () => {
        test('should handle validation errors', () => {
            expect(() => {
                agent.validateInput({ features: [], comments: '', staff: 'John' })
            }).toThrow()
        })

        test('should provide meaningful error messages', () => {
            try {
                agent.validateInput({ features: [], comments: '' })
            } catch (error) {
                expect(error.message).toContain('Insufficient input')
            }
        })
    })
})