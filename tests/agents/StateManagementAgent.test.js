/**
 * StateManagementAgent Tests
 */

const { StateManagementAgent } = require('../../src/agents/StateManagementAgent.js')

describe('StateManagementAgent', () => {
    let agent
    let mockLogger

    beforeEach(() => {
        mockLogger = TestUtils.createMockLogger()
        global.SimpleLogger = jest.fn().mockReturnValue(mockLogger)
        
        agent = new StateManagementAgent({
            persistenceEnabled: false, // Disable for testing
            validationEnabled: true
        })
    })

    describe('initialization', () => {
        test('should initialize with default state', () => {
            expect(agent.state.selectedFeatures).toEqual([])
            expect(agent.state.selectedStaff).toBe('')
            expect(agent.state.personalComments).toBe('')
            expect(agent.state.generatedReview).toBe('')
            expect(agent.state.currentStep).toBe(1)
            expect(agent.state.isLoading).toBe(false)
        })

        test('should initialize reactive proxy', () => {
            expect(agent.reactiveState).toBeDefined()
            expect(agent.subscribers).toBeInstanceOf(Map)
            expect(agent.validators).toBeInstanceOf(Map)
        })

        test('should initialize with custom config', () => {
            const customAgent = new StateManagementAgent({
                persistenceEnabled: true,
                storageKey: 'custom-key',
                historyLimit: 50
            })

            expect(customAgent.config.persistenceEnabled).toBe(true)
            expect(customAgent.config.storageKey).toBe('custom-key')
            expect(customAgent.config.historyLimit).toBe(50)
        })
    })

    describe('state access', () => {
        test('getState should return full state when no property specified', () => {
            const state = agent.getState()
            
            expect(state).toHaveProperty('selectedFeatures')
            expect(state).toHaveProperty('selectedStaff')
            expect(state).toHaveProperty('personalComments')
        })

        test('getState should return specific property', () => {
            agent.state.selectedFeatures = ['test']
            
            const features = agent.getState('selectedFeatures')
            
            expect(features).toEqual(['test'])
        })

        test('should return copy of state to prevent external mutations', () => {
            const state1 = agent.getState()
            const state2 = agent.getState()
            
            expect(state1).not.toBe(state2)
            expect(state1).toEqual(state2)
        })
    })

    describe('setState', () => {
        test('should update single property', async () => {
            const result = await agent.setState({ selectedStaff: 'John' })

            expect(result.success).toBe(true)
            expect(agent.state.selectedStaff).toBe('John')
        })

        test('should update multiple properties', async () => {
            const updates = {
                selectedStaff: 'Jane',
                personalComments: 'Great stay!',
                currentStep: 2
            }

            const result = await agent.setState(updates)

            expect(result.success).toBe(true)
            expect(agent.state.selectedStaff).toBe('Jane')
            expect(agent.state.personalComments).toBe('Great stay!')
            expect(agent.state.currentStep).toBe(2)
        })

        test('should return changes information', async () => {
            const result = await agent.setState({ currentStep: 3 })

            expect(result.changes).toHaveLength(1)
            expect(result.changes[0]).toMatchObject({
                key: 'currentStep',
                oldValue: 1,
                newValue: 3
            })
        })

        test('should skip validation when requested', async () => {
            agent.addValidator('selectedFeatures', () => ({ isValid: false, errors: ['Always fail'] }))

            const result = await agent.setState(
                { selectedFeatures: ['invalid'] }, 
                { skipValidation: true }
            )

            expect(result.success).toBe(true)
            expect(agent.state.selectedFeatures).toEqual(['invalid'])
        })

        test('should fail on validation errors', async () => {
            agent.addValidator('selectedFeatures', () => ({ 
                isValid: false, 
                errors: ['Validation failed'] 
            }))

            const result = await agent.setState({ selectedFeatures: ['test'] })

            expect(result.success).toBe(false)
            expect(result.error).toContain('Validation failed')
        })
    })

    describe('subscriptions', () => {
        test('should subscribe to property changes', () => {
            const callback = jest.fn()
            
            const unsubscribe = agent.subscribe('selectedStaff', callback)

            expect(typeof unsubscribe).toBe('function')
            expect(agent.subscribers.has('selectedStaff')).toBe(true)
        })

        test('should call subscribers when property changes', async () => {
            const callback = jest.fn()
            agent.subscribe('selectedStaff', callback)

            await agent.setState({ selectedStaff: 'Alice' })

            expect(callback).toHaveBeenCalledWith('Alice', '')
        })

        test('should handle multiple subscribers', async () => {
            const callback1 = jest.fn()
            const callback2 = jest.fn()
            
            agent.subscribe('selectedStaff', callback1)
            agent.subscribe('selectedStaff', callback2)

            await agent.setState({ selectedStaff: 'Bob' })

            expect(callback1).toHaveBeenCalledWith('Bob', '')
            expect(callback2).toHaveBeenCalledWith('Bob', '')
        })

        test('should call subscriber immediately if requested', () => {
            const callback = jest.fn()
            agent.state.selectedStaff = 'Initial'

            agent.subscribe('selectedStaff', callback, { immediate: true })

            expect(callback).toHaveBeenCalledWith('Initial', undefined)
        })

        test('should remove one-time subscribers after first call', async () => {
            const callback = jest.fn()
            agent.subscribe('selectedStaff', callback, { once: true })

            await agent.setState({ selectedStaff: 'First' })
            await agent.setState({ selectedStaff: 'Second' })

            expect(callback).toHaveBeenCalledTimes(1)
            expect(callback).toHaveBeenCalledWith('First', '')
        })

        test('should unsubscribe correctly', async () => {
            const callback = jest.fn()
            const unsubscribe = agent.subscribe('selectedStaff', callback)

            unsubscribe()
            await agent.setState({ selectedStaff: 'Test' })

            expect(callback).not.toHaveBeenCalled()
        })

        test('should sort subscribers by priority', () => {
            const callback1 = jest.fn()
            const callback2 = jest.fn()
            const callback3 = jest.fn()

            agent.subscribe('selectedStaff', callback1, { priority: 1 })
            agent.subscribe('selectedStaff', callback2, { priority: 10 })
            agent.subscribe('selectedStaff', callback3, { priority: 5 })

            const subscribers = agent.subscribers.get('selectedStaff')
            expect(subscribers[0].options.priority).toBe(10)
            expect(subscribers[1].options.priority).toBe(5)
            expect(subscribers[2].options.priority).toBe(1)
        })
    })

    describe('validators', () => {
        test('should add validators', () => {
            const validator = jest.fn(() => ({ isValid: true, errors: [] }))
            
            agent.addValidator('testProp', validator)

            expect(agent.validators.has('testProp')).toBe(true)
        })

        test('should remove validators', () => {
            const validator = jest.fn()
            agent.addValidator('testProp', validator)

            const removed = agent.removeValidator('testProp')

            expect(removed).toBe(true)
            expect(agent.validators.has('testProp')).toBe(false)
        })

        test('should validate on state changes', async () => {
            const validator = jest.fn(() => ({ isValid: true, errors: [] }))
            agent.addValidator('selectedFeatures', validator)

            await agent.setState({ selectedFeatures: ['test'] })

            expect(validator).toHaveBeenCalledWith(['test'], [])
        })

        test('should prevent invalid state changes', async () => {
            agent.addValidator('selectedFeatures', () => ({ 
                isValid: false, 
                errors: ['Invalid'] 
            }))

            const result = await agent.setState({ selectedFeatures: ['invalid'] })

            expect(result.success).toBe(false)
            expect(agent.state.selectedFeatures).toEqual([]) // Should remain unchanged
        })
    })

    describe('history', () => {
        test('should record state changes in history', async () => {
            await agent.setState({ selectedStaff: 'John' })
            await agent.setState({ selectedStaff: 'Jane' })

            const history = agent.getHistory()
            
            expect(history).toHaveLength(2)
            expect(history[0]).toMatchObject({
                property: 'selectedStaff',
                oldValue: '',
                newValue: 'John'
            })
            expect(history[1]).toMatchObject({
                property: 'selectedStaff', 
                oldValue: 'John',
                newValue: 'Jane'
            })
        })

        test('should limit history size', async () => {
            agent.config.historyLimit = 3

            await agent.setState({ currentStep: 1 })
            await agent.setState({ currentStep: 2 })
            await agent.setState({ currentStep: 3 })
            await agent.setState({ currentStep: 4 })

            const history = agent.getHistory()
            expect(history).toHaveLength(3)
        })

        test('should undo last change', async () => {
            await agent.setState({ selectedStaff: 'Original' })
            await agent.setState({ selectedStaff: 'Changed' })

            const undid = agent.undo()

            expect(undid).toBe(true)
            expect(agent.state.selectedStaff).toBe('Original')
        })

        test('should not undo when no history', () => {
            const undid = agent.undo()

            expect(undid).toBe(false)
        })
    })

    describe('computed properties', () => {
        test('should create computed property', () => {
            const cleanup = agent.createComputed(
                'fullName',
                ['selectedStaff'],
                (state) => state.selectedStaff ? `Mr. ${state.selectedStaff}` : ''
            )

            expect(typeof cleanup).toBe('function')
            expect(agent.state.fullName).toBe('')
        })

        test('should update computed property when dependencies change', async () => {
            agent.createComputed(
                'staffTitle',
                ['selectedStaff'],
                (state) => state.selectedStaff ? `Staff: ${state.selectedStaff}` : 'No staff'
            )

            await agent.setState({ selectedStaff: 'John' })

            expect(agent.state.staffTitle).toBe('Staff: John')
        })

        test('should cleanup computed property', async () => {
            const cleanup = agent.createComputed(
                'computed',
                ['selectedStaff'],
                (state) => `Value: ${state.selectedStaff}`
            )

            cleanup()
            await agent.setState({ selectedStaff: 'Test' })

            // Should not update after cleanup
            expect(agent.state.computed).toBe('Value: ')
        })
    })

    describe('state reset', () => {
        test('should reset all state', async () => {
            await agent.setState({
                selectedStaff: 'John',
                personalComments: 'Great!',
                currentStep: 3
            })

            agent.resetState()

            expect(agent.state.selectedStaff).toBe('')
            expect(agent.state.personalComments).toBe('')
            expect(agent.state.currentStep).toBe(1)
        })

        test('should reset specific properties', async () => {
            await agent.setState({
                selectedStaff: 'John',
                personalComments: 'Great!',
                currentStep: 3
            })

            await agent.resetState(['selectedStaff', 'currentStep'])

            expect(agent.state.selectedStaff).toBe('')
            expect(agent.state.personalComments).toBe('Great!') // Should remain
            expect(agent.state.currentStep).toBe(1)
        })

        test('should notify subscribers on reset', () => {
            const callback = jest.fn()
            agent.subscribe('reset', callback)

            agent.resetState()

            expect(callback).toHaveBeenCalled()
        })
    })

    describe('persistence', () => {
        test('should not persist when disabled', async () => {
            await agent.setState({ selectedStaff: 'Test' })

            expect(localStorage.setItem).not.toHaveBeenCalled()
        })

        test('should persist when enabled', async () => {
            agent.config.persistenceEnabled = true
            await agent.setState({ selectedStaff: 'Test' })

            expect(localStorage.setItem).toHaveBeenCalled()
        })

        test('should load persisted state', async () => {
            const persistedState = {
                selectedFeatures: ['service'],
                selectedStaff: 'John',
                personalComments: 'Great!'
            }
            
            localStorage.getItem.mockReturnValue(JSON.stringify(persistedState))
            agent.config.persistenceEnabled = true

            const loaded = await agent.loadPersistedState()

            expect(loaded).toBe(true)
            expect(agent.state.selectedFeatures).toEqual(['service'])
            expect(agent.state.selectedStaff).toBe('John')
        })

        test('should handle invalid persisted state', async () => {
            localStorage.getItem.mockReturnValue('invalid json')
            agent.config.persistenceEnabled = true

            const loaded = await agent.loadPersistedState()

            expect(loaded).toBe(false)
        })

        test('should clear persisted state', () => {
            agent.config.persistenceEnabled = true
            
            agent.clearPersistedState()

            expect(localStorage.removeItem).toHaveBeenCalledWith(agent.config.storageKey)
        })
    })

    describe('built-in validators', () => {
        test('should validate selectedFeatures as array', () => {
            const validators = StateManagementAgent.getBuiltInValidators()
            const validator = validators.selectedFeatures

            expect(validator(['test']).isValid).toBe(true)
            expect(validator('not array').isValid).toBe(false)
        })

        test('should validate personalComments length', () => {
            const validators = StateManagementAgent.getBuiltInValidators()
            const validator = validators.personalComments

            expect(validator('short').isValid).toBe(true)
            expect(validator('a'.repeat(201)).isValid).toBe(false)
            expect(validator(123).isValid).toBe(false)
        })

        test('should validate selectedStaff as string', () => {
            const validators = StateManagementAgent.getBuiltInValidators()
            const validator = validators.selectedStaff

            expect(validator('John').isValid).toBe(true)
            expect(validator('').isValid).toBe(true)
            expect(validator(123).isValid).toBe(false)
        })
    })

    describe('error handling', () => {
        test('should handle subscriber callback errors', async () => {
            const errorCallback = jest.fn().mockImplementation(() => {
                throw new Error('Callback error')
            })
            
            agent.subscribe('selectedStaff', errorCallback)
            
            // Should not throw error
            await expect(agent.setState({ selectedStaff: 'Test' })).resolves.toBeDefined()
        })

        test('should handle validation errors gracefully', async () => {
            agent.addValidator('testProp', () => {
                throw new Error('Validator error')
            })

            const result = await agent.setState({ testProp: 'test' })

            expect(result.success).toBe(false)
            expect(result.error).toBeTruthy()
        })
    })

    describe('cleanup', () => {
        test('should cleanup all resources', () => {
            agent.subscribe('test', jest.fn())
            agent.addValidator('test', jest.fn())
            agent.history.push({ test: 'data' })

            agent.cleanup()

            expect(agent.subscribers.size).toBe(0)
            expect(agent.validators.size).toBe(0)
            expect(agent.history).toHaveLength(0)
        })
    })
})