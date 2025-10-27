#!/bin/bash

# Summ AI Deployment Script for Fly.io
# This script deploys both the API and Web applications to Fly.io

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}9 ${NC}$1"
}

print_success() {
    echo -e "${GREEN}${NC} $1"
}

print_warning() {
    echo -e "${YELLOW} ${NC} $1"
}

print_error() {
    echo -e "${RED}${NC} $1"
}

# Function to check if flyctl is installed
check_flyctl() {
    if ! command -v flyctl &> /dev/null; then
        print_error "flyctl is not installed. Please install it first:"
        echo "  curl -L https://fly.io/install.sh | sh"
        exit 1
    fi
    print_success "flyctl is installed"
}

# Function to check if user is logged in to Fly.io
check_auth() {
    if ! flyctl auth whoami &> /dev/null; then
        print_error "You are not logged in to Fly.io"
        echo "Please run: flyctl auth login"
        exit 1
    fi
    print_success "Logged in to Fly.io"
}

# Function to deploy API
deploy_api() {
    print_info "Deploying API to Fly.io..."

    cd apps/api

    # Check if app exists
    if ! flyctl status &> /dev/null; then
        print_warning "API app not found. Creating new app..."
        flyctl apps create summ-ai-api --org personal || true
    fi

    # Deploy
    flyctl deploy --ha=false

    print_success "API deployed successfully"
    cd ../..
}

# Function to deploy Web
deploy_web() {
    print_info "Deploying Web frontend to Fly.io..."

    cd apps/web

    # Check if app exists
    if ! flyctl status &> /dev/null; then
        print_warning "Web app not found. Creating new app..."
        flyctl apps create summ-ai-web --org personal || true
    fi

    # Deploy
    flyctl deploy --ha=false

    print_success "Web frontend deployed successfully"
    cd ../..
}

# Main deployment logic
main() {
    echo ""
    print_info "========================================="
    print_info "  Summ AI Deployment Script"
    print_info "========================================="
    echo ""

    # Check prerequisites
    print_info "Checking prerequisites..."
    check_flyctl
    check_auth
    echo ""

    # Parse command line arguments
    DEPLOY_API=true
    DEPLOY_WEB=true

    if [ "$1" == "api" ]; then
        DEPLOY_WEB=false
    elif [ "$1" == "web" ]; then
        DEPLOY_API=false
    elif [ "$1" == "both" ] || [ -z "$1" ]; then
        DEPLOY_API=true
        DEPLOY_WEB=true
    else
        print_error "Invalid argument. Usage: ./deploy.sh [api|web|both]"
        exit 1
    fi

    # Deploy applications
    if [ "$DEPLOY_API" == true ]; then
        deploy_api
        echo ""
    fi

    if [ "$DEPLOY_WEB" == true ]; then
        deploy_web
        echo ""
    fi

    # Summary
    print_success "========================================="
    print_success "  Deployment Complete!"
    print_success "========================================="
    echo ""

    if [ "$DEPLOY_API" == true ]; then
        print_info "API URL: https://summ-ai-api.fly.dev"
    fi

    if [ "$DEPLOY_WEB" == true ]; then
        print_info "Web URL: https://summ-ai-web.fly.dev"
    fi

    echo ""
    print_info "To view logs:"
    if [ "$DEPLOY_API" == true ]; then
        echo "  flyctl logs -a summ-ai-api"
    fi
    if [ "$DEPLOY_WEB" == true ]; then
        echo "  flyctl logs -a summ-ai-web"
    fi
    echo ""
}

# Run main function
main "$@"
