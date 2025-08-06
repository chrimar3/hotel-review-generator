# Hotel Review Generator - Development Makefile
# Provides convenient shortcuts for common development tasks

.PHONY: help install dev build test lint clean deploy docker-build docker-run

# Default target
help: ## Show this help message
	@echo "Hotel Review Generator - Development Commands"
	@echo "============================================="
	@echo ""
	@echo "Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Example usage:"
	@echo "  make install    # Install dependencies"
	@echo "  make dev        # Start development server"
	@echo "  make test       # Run test suite"
	@echo "  make validate   # Run all quality checks"

# Installation and Setup
install: ## Install project dependencies
	@echo "📦 Installing dependencies..."
	npm ci
	@echo "✅ Dependencies installed successfully"

install-dev: ## Install dependencies including dev tools
	@echo "📦 Installing all dependencies..."
	npm install
	@echo "✅ All dependencies installed successfully"

clean: ## Clean build artifacts and dependencies
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf coverage/
	rm -rf node_modules/.cache/
	@echo "✅ Build artifacts cleaned"

clean-all: clean ## Clean everything including node_modules
	@echo "🧹 Cleaning all artifacts and dependencies..."
	rm -rf node_modules/
	rm -rf package-lock.json
	@echo "✅ Everything cleaned"

# Development
dev: ## Start development server
	@echo "🚀 Starting development server..."
	npm run dev

preview: build ## Preview production build locally
	@echo "👁️  Starting preview server..."
	npm run preview

# Building
build: ## Build for production
	@echo "🏗️  Building for production..."
	npm run build
	@echo "✅ Production build completed"

build-analyze: build ## Build and analyze bundle size
	@echo "📊 Analyzing bundle size..."
	npx vite-bundle-analyzer dist/

# Testing
test: ## Run test suite
	@echo "🧪 Running tests..."
	npm test

test-watch: ## Run tests in watch mode
	@echo "👀 Running tests in watch mode..."
	npm run test:watch

test-coverage: ## Run tests with coverage report
	@echo "📊 Running tests with coverage..."
	npm run test:coverage
	@echo "📋 Coverage report generated in coverage/ directory"

test-open-coverage: test-coverage ## Run tests and open coverage report
	@echo "🌐 Opening coverage report..."
	open coverage/lcov-report/index.html

# Code Quality
lint: ## Run ESLint
	@echo "🔍 Running ESLint..."
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	@echo "🔧 Running ESLint with auto-fix..."
	npm run lint:fix

format: ## Format code with Prettier
	@echo "💅 Formatting code with Prettier..."
	npm run format

validate: ## Run all quality checks (lint + test + build)
	@echo "✅ Running complete validation pipeline..."
	npm run validate
	@echo "🎉 All validation checks passed!"

# Performance and Auditing
lighthouse: dev-background ## Run Lighthouse performance audit
	@echo "🏃‍♂️ Running Lighthouse audit..."
	sleep 5
	npm run lighthouse
	@$(MAKE) stop-background

lighthouse-ci: ## Run Lighthouse CI (for automated testing)
	@echo "🏃‍♂️ Running Lighthouse CI..."
	npx lhci autorun

a11y: dev-background ## Run accessibility tests
	@echo "♿ Running accessibility tests..."
	sleep 5
	npm run a11y
	@$(MAKE) stop-background

# Security
security-audit: ## Run security audit
	@echo "🔒 Running security audit..."
	npm audit
	npm audit --audit-level high

security-fix: ## Fix security vulnerabilities
	@echo "🔧 Fixing security vulnerabilities..."
	npm audit fix

# Docker Commands
docker-build: ## Build Docker image
	@echo "🐳 Building Docker image..."
	docker build -t hotel-review-generator:latest .
	@echo "✅ Docker image built successfully"

docker-run: docker-build ## Build and run Docker container
	@echo "🐳 Running Docker container..."
	docker run -p 8080:80 hotel-review-generator:latest

docker-dev: ## Run development environment with Docker Compose
	@echo "🐳 Starting development environment..."
	docker-compose up --build

docker-prod: ## Run production environment with Docker Compose
	@echo "🐳 Starting production environment..."
	docker-compose -f docker-compose.prod.yml up --build

# Deployment
deploy-netlify: build ## Deploy to Netlify
	@echo "🚀 Deploying to Netlify..."
	npm run deploy:netlify

deploy-vercel: build ## Deploy to Vercel
	@echo "🚀 Deploying to Vercel..."
	npm run deploy:vercel

# Git Helpers
git-setup: ## Setup git hooks and configuration
	@echo "🔧 Setting up git configuration..."
	git config core.autocrlf false
	git config pull.rebase false
	npm run prepare
	@echo "✅ Git configuration completed"

commit: lint-fix format ## Format, lint, and prepare for commit
	@echo "📝 Code prepared for commit"
	@echo "💡 Run 'git add .' and 'git commit -m \"your message\"'"

# Information
info: ## Show project information
	@echo "Hotel Review Generator - Project Information"
	@echo "==========================================="
	@echo "Node version: $$(node --version)"
	@echo "npm version: $$(npm --version)"
	@echo "Project version: $$(node -p "require('./package.json').version")"
	@echo "Dependencies: $$(npm list --depth=0 2>/dev/null | wc -l | tr -d ' ') packages"
	@echo "Bundle size: $$([ -d dist ] && du -sh dist | cut -f1 || echo 'Not built yet')"
	@echo "Tests: $$(npm test -- --passWithNoTests --silent 2>/dev/null | grep -o '[0-9]* passed' || echo 'Run make test')"

status: ## Show development status
	@echo "🔍 Development Status Check"
	@echo "=========================="
	@echo "Git status:"
	@git status --porcelain | head -10
	@echo ""
	@echo "Recent commits:"
	@git log --oneline -5
	@echo ""
	@echo "Dependencies status:"
	@npm outdated | head -10 || echo "All dependencies up to date"

# Background task helpers (internal)
dev-background:
	@echo "🚀 Starting development server in background..."
	@npm run dev > /dev/null 2>&1 &
	@echo $$! > .dev-server.pid

stop-background:
	@echo "🛑 Stopping background server..."
	@if [ -f .dev-server.pid ]; then \
		kill $$(cat .dev-server.pid) 2>/dev/null || true; \
		rm -f .dev-server.pid; \
	fi
	@pkill -f "vite" 2>/dev/null || true

# Quick shortcuts
start: dev ## Alias for dev
s: dev ## Short alias for dev
b: build ## Short alias for build  
t: test ## Short alias for test
l: lint ## Short alias for lint
v: validate ## Short alias for validate

# Default goal when running 'make' without arguments
.DEFAULT_GOAL := help