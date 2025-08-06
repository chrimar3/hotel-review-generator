/**
 * Jest test setup and global utilities
 */

// Import testing utilities
import '@testing-library/jest-dom'

// Mock DOM APIs not available in jsdom
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
    }))
})

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback, options) => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
    root: options?.root || null,
    rootMargin: options?.rootMargin || '0px',
    thresholds: options?.threshold || [0]
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(callback => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
}))

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
})

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: jest.fn().mockResolvedValue(undefined),
        readText: jest.fn().mockResolvedValue('')
    },
    writable: true
})

// Mock URLSearchParams if needed
if (!global.URLSearchParams) {
    global.URLSearchParams = class URLSearchParams {
        constructor(init) {
            this.params = new Map()
            if (typeof init === 'string') {
                init.replace(/^\?/, '').split('&').forEach(pair => {
                    const [key, value] = pair.split('=')
                    if (key) this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''))
                })
            }
        }
        
        get(name) {
            return this.params.get(name)
        }
        
        set(name, value) {
            this.params.set(name, value)
        }
        
        has(name) {
            return this.params.has(name)
        }
    }
}

// Mock performance API
if (!global.performance) {
    global.performance = {
        now: jest.fn(() => Date.now()),
        mark: jest.fn(),
        measure: jest.fn(),
        getEntriesByType: jest.fn(() => []),
        getEntriesByName: jest.fn(() => [])
    }
}

// Global test utilities
global.TestUtils = {
    // Create a mock DOM element
    createMockElement(tag = 'div', properties = {}) {
        const element = document.createElement(tag)
        Object.assign(element, properties)
        return element
    },
    
    // Create mock event
    createMockEvent(type, properties = {}) {
        const event = new Event(type, { bubbles: true, cancelable: true })
        Object.assign(event, properties)
        return event
    },
    
    // Wait for next tick
    nextTick() {
        return new Promise(resolve => setTimeout(resolve, 0))
    },
    
    // Wait for specified time
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    },
    
    // Mock console methods
    mockConsole() {
        const originalConsole = { ...console }
        const consoleMock = {
            log: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        }
        
        Object.assign(console, consoleMock)
        
        return {
            restore: () => Object.assign(console, originalConsole),
            mock: consoleMock
        }
    },
    
    // Create mock SimpleLogger
    createMockLogger() {
        return {
            info: jest.fn(),
            debug: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        }
    }
}

// Reset mocks before each test
beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    
    // Reset DOM
    document.body.innerHTML = ''
    document.head.innerHTML = ''
})

// Clean up after each test
afterEach(() => {
    // Clean up any remaining timers
    jest.clearAllTimers()
})

// Global error handler for tests
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})