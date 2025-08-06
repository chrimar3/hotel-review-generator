/**
 * HotelReviewApp Integration Tests
 */

const { HotelReviewApp } = require('../src/HotelReviewApp.js')

// Mock all agent dependencies
jest.mock('../src/agents/ReviewGeneratorAgent.js', () => ({
    ReviewGeneratorAgent: jest.fn().mockImplementation(() => ({
        processReviewRequest: jest.fn().mockResolvedValue({
            success: true,
            review: 'Generated review text',
            confidence: 0.8,
            qualityScore: 0.9,
            metadata: { wordCount: 25 }
        }))
    }))
}))

jest.mock('../src/agents/StateManagementAgent.js', () => ({
    StateManagementAgent: jest.fn().mockImplementation(() => ({
        setupDefaultValidators: jest.fn(),
        subscribe: jest.fn(),
        getState: jest.fn().mockReturnValue({
            selectedFeatures: ['service'],
            selectedStaff: 'John',
            personalComments: 'Great stay',
            hotelName: 'Test Hotel',
            generatedReview: 'Mock review',
            detectedSource: 'direct'
        }),
        setState: jest.fn().mockResolvedValue({ success: true }),
        loadPersistedState: jest.fn().mockResolvedValue(true)
    }))
}))

jest.mock('../src/agents/UIControllerAgent.js', () => ({
    UIControllerAgent: jest.fn().mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue({ success: true }),
        handleInteraction: jest.fn().mockResolvedValue({ success: true }),
        showLoading: jest.fn(),
        hideLoading: jest.fn(),
        showSuccessFeedback: jest.fn(),
        showErrorFeedback: jest.fn()
    }))
}))

jest.mock('../src/agents/PlatformRoutingAgent.js', () => ({
    PlatformRoutingAgent: jest.fn().mockImplementation(() => ({
        processRoutingRequest: jest.fn().mockResolvedValue({
            success: true,
            routing: {
                primary: [{ key: 'tripadvisor', name: 'TripAdvisor' }],
                secondary: [{ key: 'google', name: 'Google Maps' }]
            }
        })
    }))
}))

describe('HotelReviewApp', () => {
    let app
    let mockLogger

    beforeEach(() => {
        mockLogger = TestUtils.createMockLogger()
        global.SimpleLogger = jest.fn().mockReturnValue(mockLogger)

        // Mock URL parameters
        delete window.location
        window.location = { 
            search: '?hotel=Test-Hotel&source=booking',
            href: 'http://localhost:3000?hotel=Test-Hotel&source=booking'
        }

        // Mock DOM elements
        document.body.innerHTML = `
            <div id="hotelName">Test Hotel</div>
            <div id="featuresGrid"></div>
            <select id="staffSelect"></select>
            <textarea id="personalComments"></textarea>
            <div id="reviewPreview"></div>
            <button id="copyButton"></button>
            <div id="platformButtons"></div>
            <div id="stickyActions"></div>
        `

        app = new HotelReviewApp({
            hotelName: 'Test Hotel',
            debug: true
        })
    })

    describe('initialization', () => {
        test('should create app with default config', () => {
            const defaultApp = new HotelReviewApp()
            
            expect(defaultApp.config.hotelName).toBe('our hotel')
            expect(defaultApp.config.debug).toBe(false)
            expect(defaultApp.initialized).toBe(false)
        })

        test('should create app with custom config', () => {
            expect(app.config.hotelName).toBe('Test Hotel')
            expect(app.config.debug).toBe(true)
            expect(app.agents).toEqual({})
        })

        test('should initialize all agents successfully', async () => {
            const result = await app.initialize()

            expect(result.success).toBe(true)
            expect(app.initialized).toBe(true)
            expect(app.state.isReady).toBe(true)
            expect(app.agents.stateManager).toBeDefined()
            expect(app.agents.uiController).toBeDefined()
            expect(app.agents.platformRouter).toBeDefined()
            expect(app.agents.reviewGenerator).toBeDefined()
        })

        test('should handle initialization failures', async () => {
            // Mock agent initialization failure
            const { UIControllerAgent } = require('../src/agents/UIControllerAgent.js')
            UIControllerAgent.mockImplementationOnce(() => ({
                initialize: jest.fn().mockResolvedValue({ success: false, error: 'Init failed' })
            }))

            const failApp = new HotelReviewApp()
            const result = await failApp.initialize()

            expect(result.success).toBe(false)
            expect(result.error).toBeTruthy()
            expect(failApp.initialized).toBe(false)
        })

        test('should measure initialization performance', async () => {
            await app.initialize()

            expect(app.state.performance.initTime).toBeGreaterThan(0)
            expect(typeof app.state.performance.initTime).toBe('number')
        })
    })

    describe('agent communication setup', () => {
        beforeEach(async () => {
            await app.initialize()
        })

        test('should setup state manager subscriptions', () => {
            expect(app.agents.stateManager.subscribe).toHaveBeenCalledWith(
                'selectedFeatures', 
                expect.any(Function)
            )
            expect(app.agents.stateManager.subscribe).toHaveBeenCalledWith(
                'generatedReview', 
                expect.any(Function)
            )
            expect(app.agents.stateManager.subscribe).toHaveBeenCalledWith(
                'isLoading', 
                expect.any(Function)
            )
        })

        test('should setup platform router communication', () => {
            expect(app.agents.stateManager.subscribe).toHaveBeenCalledWith(
                'detectedSource',
                expect.any(Function)
            )
        })
    })

    describe('review generation', () => {
        beforeEach(async () => {
            await app.initialize()
        })

        test('should generate review successfully', async () => {
            const result = await app.generateReview()

            expect(result.success).toBe(true)
            expect(result.review).toBe('Generated review text')
            expect(app.agents.reviewGenerator.processReviewRequest).toHaveBeenCalledWith({
                features: ['service'],
                staff: 'John',
                comments: 'Great stay',
                hotelName: 'Test Hotel',
                platform: 'direct'
            })
        })

        test('should update state after successful generation', async () => {
            await app.generateReview()

            expect(app.agents.stateManager.setState).toHaveBeenCalledWith({
                generatedReview: 'Generated review text',
                reviewMetadata: { wordCount: 25 }
            })
        })

        test('should handle generation failures', async () => {
            app.agents.reviewGenerator.processReviewRequest.mockResolvedValueOnce({
                success: false,
                error: 'Generation failed'
            })

            const result = await app.generateReview()

            expect(result.success).toBe(false)
            expect(result.error).toBe('Generation failed')
            expect(app.agents.uiController.showErrorFeedback).toHaveBeenCalled()
        })

        test('should show error feedback on exception', async () => {
            app.agents.reviewGenerator.processReviewRequest.mockRejectedValueOnce(
                new Error('Network error')
            )

            const result = await app.generateReview()

            expect(result.success).toBe(false)
            expect(app.agents.uiController.showErrorFeedback).toHaveBeenCalledWith(
                expect.stringContaining('Failed to generate review'),
                expect.any(Array)
            )
        })
    })

    describe('clipboard operations', () => {
        beforeEach(async () => {
            await app.initialize()
        })

        test('should copy review to clipboard successfully', async () => {
            // Mock successful clipboard operation
            navigator.clipboard.writeText.mockResolvedValueOnce()

            const result = await app.copyReviewToClipboard()

            expect(result.success).toBe(true)
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Mock review')
            expect(app.agents.uiController.showSuccessFeedback).toHaveBeenCalled()
        })

        test('should handle clipboard failures', async () => {
            navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Clipboard denied'))

            const result = await app.copyReviewToClipboard()

            expect(result.success).toBe(false)
            expect(app.agents.uiController.showErrorFeedback).toHaveBeenCalledWith(
                expect.stringContaining('Failed to copy review'),
                expect.any(Array)
            )
        })

        test('should handle no review available', async () => {
            app.agents.stateManager.getState.mockReturnValueOnce({
                ...app.agents.stateManager.getState(),
                generatedReview: ''
            })

            const result = await app.copyReviewToClipboard()

            expect(result.success).toBe(false)
            expect(result.error).toBe('No review available to copy')
        })

        test('should show loading states during copy', async () => {
            navigator.clipboard.writeText.mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 100))
            )

            const copyPromise = app.copyReviewToClipboard()
            
            expect(app.agents.uiController.showLoading).toHaveBeenCalledWith('copy-clipboard', 1000)
            
            await copyPromise
            
            expect(app.agents.uiController.hideLoading).toHaveBeenCalledWith(true)
        })
    })

    describe('interaction processing', () => {
        beforeEach(async () => {
            await app.initialize()
        })

        test('should process interactions when initialized', async () => {
            const interaction = { type: 'feature-selection', data: { feature: 'service' } }

            const result = await app.processInteraction(interaction)

            expect(result.success).toBe(true)
            expect(result.results).toBeDefined()
        })

        test('should reject interactions when not initialized', async () => {
            app.initialized = false
            const interaction = { type: 'test' }

            const result = await app.processInteraction(interaction)

            expect(result.success).toBe(false)
            expect(result.error).toBe('Application not ready')
        })

        test('should record interaction metrics', async () => {
            const interaction = { type: 'test-interaction' }

            await app.processInteraction(interaction)

            expect(app.state.performance.interactions.length).toBeGreaterThan(0)
            const recorded = app.state.performance.interactions[0]
            expect(recorded.type).toBe('test-interaction')
            expect(recorded.duration).toBeGreaterThan(0)
        })

        test('should limit interaction history', async () => {
            // Add 105 interactions
            for (let i = 0; i < 105; i++) {
                await app.processInteraction({ type: 'test', id: i })
            }

            expect(app.state.performance.interactions.length).toBe(50)
        })
    })

    describe('event handlers', () => {
        beforeEach(async () => {
            await app.initialize()
        })

        test('should handle feature selection', async () => {
            const checkbox = { value: 'excellent service', checked: true }

            await app.handleFeatureSelection(checkbox)

            expect(app.agents.stateManager.setState).toHaveBeenCalledWith({
                selectedFeatures: ['service', 'excellent service']
            })
        })

        test('should handle feature deselection', async () => {
            const checkbox = { value: 'service', checked: false }

            await app.handleFeatureSelection(checkbox)

            expect(app.agents.stateManager.setState).toHaveBeenCalledWith({
                selectedFeatures: []
            })
        })

        test('should handle staff selection', async () => {
            await app.handleStaffSelection('Jane')

            expect(app.agents.stateManager.setState).toHaveBeenCalledWith({
                selectedStaff: 'Jane'
            })
        })

        test('should handle comments input', async () => {
            await app.handleCommentsInput('Amazing experience!')

            expect(app.agents.stateManager.setState).toHaveBeenCalledWith({
                personalComments: 'Amazing experience!'
            })
        })
    })

    describe('URL parameter handling', () => {
        test('should extract hotel name from URL', () => {
            const hotelName = app.getUrlParameter('hotel')
            expect(hotelName).toBe('Test-Hotel')
        })

        test('should extract source from URL', () => {
            const source = app.getUrlParameter('source')
            expect(source).toBe('booking')
        })

        test('should handle missing parameters', () => {
            const missing = app.getUrlParameter('missing')
            expect(missing).toBeNull()
        })
    })

    describe('clipboard fallback', () => {
        test('should use fallback when clipboard API fails', async () => {
            // Mock clipboard API failure
            navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Not supported'))
            
            // Mock document.execCommand
            document.execCommand = jest.fn().mockReturnValue(true)

            await app.initialize()
            const result = await app.copyToClipboard('test text')

            expect(result).toBe(true)
            expect(document.execCommand).toHaveBeenCalledWith('copy')
        })

        test('should handle fallback failure', async () => {
            navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Not supported'))
            document.execCommand = jest.fn().mockReturnValue(false)

            await app.initialize()
            const result = await app.copyToClipboard('test text')

            expect(result).toBe(false)
        })
    })

    describe('agent workflow determination', () => {
        beforeEach(async () => {
            await app.initialize()
        })

        test('should determine workflow for feature selection', async () => {
            const workflow = await app.determineAgentWorkflow({ type: 'feature-selection' })
            
            expect(workflow).toEqual(['stateManager', 'reviewGenerator', 'uiController'])
        })

        test('should determine workflow for copy action', async () => {
            const workflow = await app.determineAgentWorkflow({ type: 'copy-review' })
            
            expect(workflow).toEqual(['stateManager', 'uiController'])
        })

        test('should default to UI controller for unknown types', async () => {
            const workflow = await app.determineAgentWorkflow({ type: 'unknown' })
            
            expect(workflow).toEqual(['uiController'])
        })
    })

    describe('performance monitoring', () => {
        test('should track initialization time', async () => {
            const startTime = performance.now()
            await app.initialize()
            const endTime = performance.now()

            expect(app.state.performance.initTime).toBeGreaterThan(0)
            expect(app.state.performance.initTime).toBeLessThan(endTime - startTime + 100) // Allow some tolerance
        })

        test('should initialize performance tracking', () => {
            expect(app.state.performance.initTime).toBeNull()
            expect(app.state.performance.interactions).toEqual([])
        })
    })

    describe('error handling', () => {
        test('should handle agent initialization errors gracefully', async () => {
            const errorApp = new HotelReviewApp()
            errorApp.initializeAgents = jest.fn().mockRejectedValue(new Error('Init failed'))

            const result = await errorApp.initialize()

            expect(result.success).toBe(false)
            expect(result.error).toBe('Init failed')
        })

        test('should handle interaction processing errors', async () => {
            await app.initialize()
            app.executeAgentWorkflow = jest.fn().mockRejectedValue(new Error('Workflow failed'))

            const result = await app.processInteraction({ type: 'test' })

            expect(result.success).toBe(false)
            expect(result.error).toBe('Workflow failed')
        })
    })

    describe('cleanup', () => {
        test('should cleanup all agents', async () => {
            await app.initialize()
            
            // Add cleanup method to mock agents
            app.agents.stateManager.cleanup = jest.fn()
            app.agents.uiController.cleanup = jest.fn()
            app.agents.platformRouter.cleanup = jest.fn()
            app.agents.reviewGenerator.cleanup = jest.fn()

            app.cleanup()

            expect(app.agents.stateManager.cleanup).toHaveBeenCalled()
            expect(app.agents.uiController.cleanup).toHaveBeenCalled()
            expect(app.initialized).toBe(false)
            expect(app.agents).toEqual({})
        })

        test('should handle missing cleanup methods', async () => {
            await app.initialize()
            // Agents without cleanup method should not cause errors
            
            expect(() => app.cleanup()).not.toThrow()
        })
    })
})