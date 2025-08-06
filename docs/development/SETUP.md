# Development Setup Guide

This guide will help you set up the Hotel Review Generator for local development.

## Prerequisites

### Required Software
- **Node.js**: Version 18+ ([Download](https://nodejs.org/))
- **npm**: Version 9+ (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))

### Recommended Software
- **VS Code**: With recommended extensions
- **Docker**: For containerized development (optional)
- **Chrome**: For development and debugging

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/chrimar3/hotel-review-generator.git
cd hotel-review-generator
```

### 2. Install Dependencies
```bash
# Using npm
npm install

# Or using Make (recommended)
make install
```

### 3. Start Development
```bash
# Using npm
npm run dev

# Or using Make
make dev
```

The application will be available at `http://localhost:3000`

## Development Environment Setup

### VS Code Configuration

#### Install Recommended Extensions
1. Open VS Code in the project directory
2. When prompted, install recommended extensions
3. Or manually install from `.vscode/extensions.json`

#### Key Extensions
- **ESLint**: Code quality and linting
- **Prettier**: Code formatting
- **Live Server**: Development server
- **GitLens**: Git integration
- **Jest**: Test runner integration

### Environment Variables
Create a `.env.local` file for local development:
```bash
# Development Configuration
NODE_ENV=development
VITE_API_URL=http://localhost:3000
VITE_ENABLE_DEBUG=true

# Testing Configuration  
JEST_TIMEOUT=30000

# Performance Configuration
VITE_BUNDLE_ANALYZER=false
```

### Git Configuration
```bash
# Set up git hooks and configuration
make git-setup

# Or manually
git config core.autocrlf false
git config pull.rebase false
npm run prepare
```

## Development Workflow

### Daily Development
```bash
# Start development
make dev

# In another terminal - run tests in watch mode
make test-watch

# Lint and format code before committing
make commit
```

### Available Commands
```bash
# Development
make dev          # Start development server
make build        # Build for production
make preview      # Preview production build

# Testing
make test         # Run tests
make test-watch   # Run tests in watch mode
make test-coverage # Run tests with coverage

# Code Quality
make lint         # Run ESLint
make lint-fix     # Fix ESLint issues
make format       # Format with Prettier
make validate     # Run all quality checks

# Utilities
make clean        # Clean build artifacts
make info         # Show project information
make help         # Show all available commands
```

## Project Structure Understanding

### Key Directories
```
├── src/                    # Source code (modular architecture)
├── tests/                  # Test files
├── docs/                   # Documentation
├── .vscode/               # VS Code configuration
├── .github/               # GitHub workflows and templates
├── docker/                # Docker configuration
└── scripts/               # Build and deployment scripts
```

### Main Files
- **`index.html`**: Main application file (single-file architecture)
- **`package.json`**: Project configuration and dependencies
- **`vite.config.js`**: Build tool configuration
- **`jest.config.js`**: Test configuration (embedded in package.json)

## Debugging

### Browser Debugging
1. Open Chrome DevTools (F12)
2. Go to Sources tab
3. Set breakpoints in the code
4. Use Console for debugging

### VS Code Debugging
1. Use provided debug configurations in `.vscode/launch.json`
2. Set breakpoints in VS Code
3. Press F5 to start debugging
4. Use Debug Console for evaluation

### Available Debug Configurations
- **Launch Chrome**: Debug in Chrome browser
- **Debug Jest Tests**: Debug test files
- **Debug Current File**: Debug specific test file
- **Launch App + Debug**: Combined server + browser debugging

## Testing Strategy

### Test Types
1. **Unit Tests**: Business logic and utilities
2. **Integration Tests**: Component interactions
3. **Performance Tests**: Lighthouse audits
4. **Accessibility Tests**: A11y compliance

### Running Tests
```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Specific test file
npm test functionality.test.js
```

### Test Structure
```
tests/
├── functionality.test.js   # Core business logic tests
├── setup.js               # Jest configuration
└── fixtures/              # Test data and mocks
```

## Performance Monitoring

### Development Performance
```bash
# Run Lighthouse audit
make lighthouse

# Run accessibility tests
make a11y

# Analyze bundle size
make build-analyze
```

### Performance Budgets
- **Bundle Size**: < 1MB
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

## Code Quality Standards

### ESLint Rules
- Extends `eslint:recommended`
- Security rules enabled
- Accessibility rules included
- Custom rules for project-specific patterns

### Prettier Configuration
- 2-space indentation
- Single quotes preferred
- Semicolons required
- 120-character line length

### Git Commit Convention
Use [Conventional Commits](https://conventionalcommits.org/):
```bash
feat: add new functionality
fix: resolve issue with clipboard
docs: update setup documentation
style: fix formatting issues
refactor: improve code structure
test: add coverage for edge cases
chore: update dependencies
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

#### Node Version Issues
```bash
# Check Node version
node --version

# Update Node if needed
nvm install 18
nvm use 18
```

#### Dependency Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### VS Code Extension Issues
1. Reload VS Code window (Cmd+Shift+P → "Developer: Reload Window")
2. Disable and re-enable extensions
3. Check extension logs in Output panel

### Getting Help
1. **Check Documentation**: Look in `docs/` directory
2. **Search Issues**: Check GitHub issues
3. **Ask Questions**: Use GitHub Discussions
4. **Contact Maintainers**: Create an issue for bugs

### Development Tips
- Use the integrated terminal in VS Code
- Set up keyboard shortcuts for common tasks
- Use Git integration for version control
- Regularly run `make validate` before pushing
- Keep dependencies updated with Dependabot

## Next Steps

After setup:
1. Read [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines
2. Review [ARCHITECTURE.md](../ARCHITECTURE.md) for technical details
3. Check [TESTING.md](TESTING.md) for testing best practices
4. Explore the codebase starting with `index.html`

Happy coding! 🚀