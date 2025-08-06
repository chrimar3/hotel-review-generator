# Testing Guide

This guide covers the comprehensive testing strategy for Hotel Review Generator, including unit tests, integration tests, performance tests, and quality assurance practices.

## Testing Philosophy

Our testing strategy follows the **Testing Pyramid**:
1. **Unit Tests** (70%): Fast, isolated tests for business logic
2. **Integration Tests** (20%): Tests for component interactions
3. **End-to-End Tests** (10%): Full user workflow tests

## Test Infrastructure

### Framework: Jest + JSDOM
- **Jest**: JavaScript testing framework
- **JSDOM**: DOM implementation for Node.js
- **Testing Library**: Utilities for testing interactions

### Configuration
Tests are configured in `package.json`:
```json
{
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"],
    "collectCoverageFrom": ["index.html"],
    "coverageThreshold": {
      "global": {
        "branches": 60,
        "functions": 60,
        "lines": 60,
        "statements": 60
      }
    }
  }
}
```

## Running Tests

### Basic Commands
```bash
# Run all tests
npm test
# or
make test

# Watch mode (re-runs on file changes)
npm run test:watch
# or
make test-watch

# Coverage report
npm run test:coverage
# or
make test-coverage

# Open coverage report in browser
make test-open-coverage
```

### Advanced Testing
```bash
# Run specific test file
npm test functionality.test.js

# Run tests matching pattern
npm test -- --testNamePattern="Review Generation"

# Run tests in verbose mode
npm test -- --verbose

# Update snapshots (if using snapshot testing)
npm test -- --updateSnapshot
```

## Test Structure

### Current Test Suite
```
tests/
├── functionality.test.js      # Core business logic (35 tests)
├── setup.js                  # Jest configuration and globals
└── fixtures/                 # Test data and mocks
```

### Test Categories (35 tests total)
1. **Configuration and State Management** (3 tests)
2. **DOM Elements and Structure** (3 tests)
3. **Review Generation Functions** (6 tests)
4. **Clipboard Operations** (5 tests)
5. **Feature Selection Logic** (4 tests)
6. **Character Counter Logic** (5 tests)
7. **URL Parameter Handling** (5 tests)
8. **Platform Configuration Logic** (4 tests)

## Writing Tests

### Test File Structure
```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
    document.body.innerHTML = '<!-- mock HTML -->';
    // Initialize test state
  });

  afterEach(() => {
    // Cleanup after each test
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Specific Functionality', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test input';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected output');
    });
  });
});
```

### Testing Patterns

#### Testing DOM Interactions
```javascript
test('should handle button click', () => {
  // Setup DOM
  document.body.innerHTML = `
    <button id="testButton">Click me</button>
  `;
  
  const button = document.getElementById('testButton');
  
  // Mock function
  const mockHandler = jest.fn();
  button.addEventListener('click', mockHandler);
  
  // Simulate click
  button.click();
  
  // Assert
  expect(mockHandler).toHaveBeenCalledTimes(1);
});
```

#### Testing Async Functions
```javascript
test('should handle async clipboard operation', async () => {
  // Mock clipboard API
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn().mockResolvedValue()
    }
  });
  
  const result = await copyToClipboard('test text');
  
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
  expect(result).toBe(true);
});
```

#### Testing Error Handling
```javascript
test('should handle errors gracefully', () => {
  // Mock console.error to avoid noise in test output
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  
  // Test error condition
  expect(() => {
    functionThatShouldThrow();
  }).toThrow('Expected error message');
  
  consoleSpy.mockRestore();
});
```

### Mocking Strategies

#### Browser APIs
```javascript
// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

#### Network Requests
```javascript
// Mock fetch
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockData),
  })
);
```

## Test Data Management

### Fixtures
Create reusable test data in `tests/fixtures/`:
```javascript
// tests/fixtures/mockData.js
export const mockHotelData = {
  name: "Test Hotel",
  features: ["wifi", "parking", "pool"],
  staff: ["Alice", "Bob", "Charlie"]
};

export const mockReviewData = {
  selectedFeatures: ["excellent customer service"],
  personalComments: "Great stay!",
  selectedStaff: "Alice"
};
```

### Test Utilities
```javascript
// tests/utils/testHelpers.js
export function createMockElement(tag, attributes = {}) {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
  return element;
}

export function setupMockDOM(htmlString) {
  document.body.innerHTML = htmlString;
  // Return commonly used elements
  return {
    form: document.querySelector('form'),
    buttons: document.querySelectorAll('button'),
    inputs: document.querySelectorAll('input')
  };
}
```

## Performance Testing

### Lighthouse CI
Automated performance testing with Lighthouse:
```bash
# Run Lighthouse audit
make lighthouse

# Run Lighthouse CI (automated)
make lighthouse-ci
```

### Performance Budgets
```javascript
// lighthouse.config.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/'],
      startServerCommand: 'npm run preview',
    },
    assert: {
      assertions: {
        'categories:performance': ['error', {minScore: 0.9}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:best-practices': ['error', {minScore: 0.9}],
        'categories:seo': ['error', {minScore: 0.9}],
      },
    },
  },
};
```

### Bundle Size Testing
```javascript
test('bundle size should be under limit', () => {
  const fs = require('fs');
  const path = require('path');
  
  if (fs.existsSync('dist')) {
    const stats = fs.statSync('dist');
    const sizeMB = stats.size / (1024 * 1024);
    expect(sizeMB).toBeLessThan(1); // 1MB limit
  }
});
```

## Accessibility Testing

### Automated A11y Testing
```bash
# Run accessibility tests
make a11y

# Or manually
npx pa11y http://localhost:3000
```

### A11y Test Integration
```javascript
// In Jest tests
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('should have no accessibility violations', async () => {
  document.body.innerHTML = `
    <button aria-label="Copy review">Copy</button>
  `;
  
  const results = await axe(document.body);
  expect(results).toHaveNoViolations();
});
```

## Integration Testing

### User Workflow Tests
```javascript
describe('Complete User Workflow', () => {
  test('should generate and copy review', async () => {
    // Setup complete DOM
    setupFullApplication();
    
    // Select features
    const featureCheckbox = document.querySelector('[value="excellent customer service"]');
    featureCheckbox.checked = true;
    featureCheckbox.dispatchEvent(new Event('change'));
    
    // Add comments
    const textarea = document.querySelector('#personalComments');
    textarea.value = 'Great experience!';
    textarea.dispatchEvent(new Event('input'));
    
    // Generate review
    updateReviewPreview();
    
    // Copy to clipboard
    const copyButton = document.querySelector('#copyButton');
    await copyButton.click();
    
    // Verify result
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(state.generatedReview).toContain('excellent customer service');
  });
});
```

## Test Coverage

### Coverage Goals
- **Statements**: 60%+ (current requirement)
- **Branches**: 60%+ (current requirement)
- **Functions**: 60%+ (current requirement)
- **Lines**: 60%+ (current requirement)

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html

# View summary
cat coverage/coverage-summary.json
```

### Improving Coverage
1. **Identify uncovered code**: Use coverage report highlights
2. **Add missing test cases**: Focus on edge cases and error paths
3. **Remove dead code**: Delete unused functions
4. **Test async paths**: Ensure both success and failure scenarios

## Continuous Integration

### GitHub Actions
Tests run automatically on:
- **Pull Requests**: Full test suite
- **Push to main**: Complete validation
- **Daily**: Security and dependency scans

### CI Test Pipeline
```yaml
# .github/workflows/ci.yml (excerpt)
- name: Run Tests
  run: npm test
  
- name: Run Coverage
  run: npm run test:coverage
  
- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Debugging Tests

### Jest Debugging in VS Code
1. Set breakpoints in test files
2. Use "Debug Jest Tests" configuration
3. Press F5 to start debugging
4. Step through test execution

### Console Debugging
```javascript
test('debug test example', () => {
  console.log('Current state:', JSON.stringify(state, null, 2));
  
  // Use jest-console to capture logs
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('Current state:')
  );
});
```

### Test Isolation Issues
```javascript
describe('Test with proper isolation', () => {
  let originalState;
  
  beforeEach(() => {
    // Save original state
    originalState = JSON.parse(JSON.stringify(state));
  });
  
  afterEach(() => {
    // Restore original state
    Object.assign(state, originalState);
    jest.clearAllMocks();
  });
});
```

## Best Practices

### Test Organization
1. **Group related tests**: Use `describe` blocks effectively
2. **Clear test names**: Describe expected behavior
3. **One assertion per test**: Keep tests focused
4. **Setup and teardown**: Use `beforeEach` and `afterEach`

### Test Quality
1. **Follow AAA pattern**: Arrange, Act, Assert
2. **Test behavior, not implementation**: Focus on outcomes
3. **Use meaningful assertions**: Prefer specific matchers
4. **Handle async properly**: Use async/await correctly

### Performance
1. **Fast tests**: Keep unit tests under 100ms
2. **Parallel execution**: Leverage Jest's parallel runner
3. **Smart mocking**: Mock external dependencies
4. **Focused tests**: Use `.only` and `.skip` during development

## Future Enhancements

### Planned Improvements
1. **E2E Testing**: Playwright integration
2. **Visual Testing**: Screenshot comparison
3. **API Testing**: Mock service worker
4. **Performance Budgets**: Automated size limits
5. **A11y Integration**: Axe-core in CI

### Test Expansion Areas
1. **Error Monitoring**: Test ErrorMonitor class
2. **PWA Features**: Service worker testing
3. **A/B Testing**: Variant assignment testing
4. **Mobile Testing**: Touch event simulation
5. **Cross-browser**: Browserstack integration

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [JSDOM Documentation](https://github.com/jsdom/jsdom)

### Tools
- [Jest Extension for VS Code](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)
- [Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-test-explorer)
- [Coverage Gutters](https://marketplace.visualstudio.com/items?itemName=ryanluker.vscode-coverage-gutters)

### Best Practices
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices#section-1-the-golden-rule)

Remember: **Good tests are like good documentation - they explain how the code should behave and give confidence in changes.** 🧪