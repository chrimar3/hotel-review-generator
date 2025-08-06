#!/bin/bash

# Hotel Review Generator Deployment Script
# Usage: ./scripts/deploy.sh [environment]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-"staging"}
PROJECT_NAME="hotel-review-generator"
DOCKER_IMAGE="$PROJECT_NAME:latest"
BACKUP_DIR="./backups"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if required commands exist
    command -v node >/dev/null 2>&1 || error "Node.js is required but not installed"
    command -v npm >/dev/null 2>&1 || error "npm is required but not installed"
    command -v git >/dev/null 2>&1 || error "git is required but not installed"
    
    # Check Node version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version 18 or higher is required"
    fi
    
    success "Prerequisites check passed"
}

# Clean previous builds
clean_build() {
    log "Cleaning previous builds..."
    
    if [ -d "dist" ]; then
        rm -rf dist
        log "Removed dist directory"
    fi
    
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
        log "Cleared node_modules cache"
    fi
    
    success "Build cleanup completed"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    npm ci --production=false
    
    success "Dependencies installed"
}

# Run tests
run_tests() {
    log "Running tests..."
    
    npm run test:coverage
    
    success "All tests passed"
}

# Run linting
run_linting() {
    log "Running code quality checks..."
    
    npm run lint
    npm run format
    
    success "Code quality checks passed"
}

# Build application
build_application() {
    log "Building application for $ENVIRONMENT..."
    
    export NODE_ENV=$ENVIRONMENT
    npm run build
    
    if [ ! -d "dist" ]; then
        error "Build failed - dist directory not found"
    fi
    
    success "Application built successfully"
}

# Create backup
create_backup() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Creating backup..."
        
        mkdir -p $BACKUP_DIR
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        
        # Create backup archive
        tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" dist/
        
        success "Backup created: $BACKUP_NAME.tar.gz"
    fi
}

# Deploy to Netlify
deploy_netlify() {
    log "Deploying to Netlify ($ENVIRONMENT)..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        npx netlify deploy --prod --dir=dist --site=$NETLIFY_SITE_ID
    else
        npx netlify deploy --dir=dist --site=$NETLIFY_STAGING_SITE_ID
    fi
    
    success "Netlify deployment completed"
}

# Deploy with Docker
deploy_docker() {
    log "Deploying with Docker..."
    
    # Build Docker image
    docker build -t $DOCKER_IMAGE --target production .
    
    # Stop existing container if running
    if docker ps -q -f name=$PROJECT_NAME; then
        log "Stopping existing container..."
        docker stop $PROJECT_NAME
        docker rm $PROJECT_NAME
    fi
    
    # Run new container
    docker run -d \
        --name $PROJECT_NAME \
        --restart unless-stopped \
        -p 8080:8080 \
        -e NODE_ENV=$ENVIRONMENT \
        $DOCKER_IMAGE
    
    success "Docker deployment completed"
}

# Deploy to Vercel
deploy_vercel() {
    log "Deploying to Vercel ($ENVIRONMENT)..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        npx vercel --prod
    else
        npx vercel
    fi
    
    success "Vercel deployment completed"
}

# Performance testing
run_performance_tests() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Running performance tests..."
        
        # Wait for deployment to be ready
        sleep 30
        
        # Run Lighthouse
        npm run lighthouse
        
        success "Performance tests completed"
    fi
}

# Security scan
run_security_scan() {
    log "Running security scan..."
    
    npm audit --audit-level moderate
    
    success "Security scan completed"
}

# Send notification
send_notification() {
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        log "Sending deployment notification..."
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Hotel Review Generator deployed to $ENVIRONMENT\"}" \
            $SLACK_WEBHOOK_URL
    fi
}

# Rollback function
rollback() {
    if [ "$ENVIRONMENT" = "production" ] && [ -d "$BACKUP_DIR" ]; then
        warning "Rolling back to previous version..."
        
        LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.tar.gz | head -n1)
        if [ -f "$LATEST_BACKUP" ]; then
            rm -rf dist
            tar -xzf "$LATEST_BACKUP"
            deploy_netlify
            success "Rollback completed"
        else
            error "No backup found for rollback"
        fi
    else
        error "Rollback not available for $ENVIRONMENT"
    fi
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Define URLs based on environment
    case $ENVIRONMENT in
        "production")
            URL="https://hotel-review-generator.com"
            ;;
        "staging")
            URL="https://staging.hotel-review-generator.com"
            ;;
        "docker")
            URL="http://localhost:8080"
            ;;
        *)
            warning "Skipping health check for $ENVIRONMENT"
            return
            ;;
    esac
    
    # Check if site is responding
    for i in {1..5}; do
        if curl -sf "$URL" > /dev/null; then
            success "Health check passed - site is responding"
            return
        fi
        log "Health check attempt $i/5 failed, retrying in 10 seconds..."
        sleep 10
    done
    
    error "Health check failed - site is not responding"
}

# Main deployment function
main() {
    log "Starting deployment to $ENVIRONMENT..."
    
    # Trap errors for rollback
    trap 'error "Deployment failed. Use ./scripts/deploy.sh rollback to revert."' ERR
    
    case $1 in
        "rollback")
            rollback
            exit 0
            ;;
        "health")
            health_check
            exit 0
            ;;
    esac
    
    check_prerequisites
    clean_build
    install_dependencies
    run_linting
    run_tests
    run_security_scan
    build_application
    create_backup
    
    # Deploy based on environment
    case $ENVIRONMENT in
        "netlify"|"staging"|"production")
            deploy_netlify
            ;;
        "vercel")
            deploy_vercel
            ;;
        "docker")
            deploy_docker
            ;;
        *)
            error "Unknown deployment environment: $ENVIRONMENT"
            ;;
    esac
    
    health_check
    run_performance_tests
    send_notification
    
    success "Deployment to $ENVIRONMENT completed successfully!"
    log "Application is available at the configured URL"
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi