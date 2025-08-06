# Contributing to Hotel Review Generator

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm 9+
- Git

### Quick Start
```bash
# Clone the repository
git clone https://github.com/chrimar3/hotel-review-generator.git
cd hotel-review-generator

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## Development Workflow

### 1. Branch Strategy
- `main` - Production ready code
- `develop` - Integration branch for features
- `feature/*` - Feature development
- `hotfix/*` - Critical fixes

### 2. Making Changes
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code changes ...

# Run tests
npm test

# Run linting
npm run lint

# Commit with conventional format
git commit -m "feat: add new functionality"
```

### 3. Commit Convention
We use [Conventional Commits](https://conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes  
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/updates
- `chore:` - Build process or tooling changes

### 4. Pull Request Process

1. **Update Documentation** - Update README.md if needed
2. **Add Tests** - Ensure adequate test coverage
3. **Run Quality Checks** - `npm run validate`
4. **Create PR** - Use the provided template
5. **Code Review** - Address review feedback
6. **Merge** - Squash and merge after approval

## Code Standards

### JavaScript Style
- Use ESLint configuration
- Prefer `const` and `let` over `var`
- Use arrow functions for callbacks
- Write descriptive variable names
- Add JSDoc comments for functions

### Testing Requirements
- Unit tests for business logic
- Integration tests for workflows  
- Maintain 80%+ code coverage
- Use descriptive test names

### Documentation
- Update README.md for user-facing changes
- Add inline comments for complex logic
- Update API documentation
- Include examples for new features

## Project Structure

```
├── src/                    # Source code
├── tests/                  # Test files
├── docs/                   # Documentation
├── scripts/                # Build and deployment scripts
├── docker/                 # Container configurations
└── .github/                # GitHub workflows and templates
```

## Issue Guidelines

### Bug Reports
Use the bug report template and include:
- Browser/environment details
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### Feature Requests
Use the feature request template and include:
- Clear description of the feature
- Use cases and benefits
- Proposed implementation approach

## Performance Considerations

- Keep bundle size minimal
- Test on mobile devices
- Monitor Core Web Vitals
- Use efficient DOM operations
- Optimize for offline functionality

## Security Guidelines

- Never commit secrets or credentials
- Validate and sanitize all inputs
- Follow OWASP security practices
- Report security issues privately
- Use HTTPS for all external requests

## Release Process

Releases are automated through GitHub Actions:

1. **Version Bump** - Update package.json version
2. **Update Changelog** - Document changes in CHANGELOG.md
3. **Create Release** - GitHub release triggers deployment
4. **Deploy** - Automatic deployment to staging and production

## Getting Help

- **Documentation** - Check the docs/ directory
- **Issues** - Search existing GitHub issues
- **Discussions** - Use GitHub Discussions for questions
- **Contact** - Reach out to maintainers for urgent matters

## Recognition

Contributors are recognized in:
- CHANGELOG.md for each release
- README.md contributors section
- GitHub contributors graph

Thank you for contributing to Hotel Review Generator!