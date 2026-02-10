#!/bin/bash

# ============================================================================
# BidStation Firebase Setup Script
# ============================================================================
# This script automates the setup process for BidStation with Firebase
# Run this after cloning the repository
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================================================
# STEP 1: Check Prerequisites
# ============================================================================
print_header "Step 1: Checking Prerequisites"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    print_info "Please install Node.js 16.x or higher from https://nodejs.org"
    exit 1
fi
NODE_VERSION=$(node -v)
print_success "Node.js $NODE_VERSION installed"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
NPM_VERSION=$(npm -v)
print_success "npm $NPM_VERSION installed"

# Check Git
if ! command -v git &> /dev/null; then
    print_error "Git is not installed"
    print_info "Please install Git from https://git-scm.com"
    exit 1
fi
print_success "Git installed"

# ============================================================================
# STEP 2: Install Client Dependencies
# ============================================================================
print_header "Step 2: Installing Client Dependencies"

cd client

if [ -f "package.json" ]; then
    print_info "Installing npm packages..."
    npm install
    print_success "Client dependencies installed"
else
    print_error "package.json not found in client directory"
    exit 1
fi

# ============================================================================
# STEP 3: Setup Environment Variables
# ============================================================================
print_header "Step 3: Setting Up Environment Variables"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Created .env file from .env.example"
        print_warning "IMPORTANT: You must edit .env and add your Firebase config values!"
        print_info "Get your config from: Firebase Console → Project Settings → Your apps"
    else
        print_error ".env.example not found"
        exit 1
    fi
else
    print_info ".env file already exists"
fi

# ============================================================================
# STEP 4: Check Firebase CLI (Optional)
# ============================================================================
print_header "Step 4: Checking Firebase CLI (Optional)"

if ! command -v firebase &> /dev/null; then
    print_warning "Firebase CLI not installed"
    read -p "Install Firebase CLI globally? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install -g firebase-tools
        print_success "Firebase CLI installed"
    else
        print_info "Skipping Firebase CLI installation"
        print_info "You can install it later with: npm install -g firebase-tools"
    fi
else
    FIREBASE_VERSION=$(firebase --version)
    print_success "Firebase CLI $FIREBASE_VERSION installed"
fi

# ============================================================================
# STEP 5: Initialize Firebase (Optional)
# ============================================================================
if command -v firebase &> /dev/null; then
    print_header "Step 5: Firebase Initialization (Optional)"
    
    read -p "Initialize Firebase project now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd ..  # Go back to project root
        
        print_info "Logging into Firebase..."
        firebase login
        
        print_info "Initializing Firestore..."
        firebase init firestore
        
        print_success "Firebase initialized"
        print_info "Remember to deploy rules: firebase deploy --only firestore:rules"
    else
        print_info "Skipping Firebase initialization"
        print_info "You can initialize later with: firebase init"
    fi
fi

# ============================================================================
# STEP 6: Final Instructions
# ============================================================================
print_header "Setup Complete! 🎉"

echo -e "${GREEN}Installation successful!${NC}\n"
echo -e "${YELLOW}Next steps:${NC}\n"
echo "1. ${BLUE}Configure Firebase:${NC}"
echo "   - Create a project at https://console.firebase.google.com"
echo "   - Enable Authentication (Email/Password)"
echo "   - Create Firestore Database"
echo "   - Get your config values"
echo ""
echo "2. ${BLUE}Update .env file:${NC}"
echo "   cd client"
echo "   nano .env  # or use your preferred editor"
echo "   # Fill in all VITE_FIREBASE_* values"
echo ""
echo "3. ${BLUE}Configure Email Action URLs:${NC}"
echo "   Firebase Console → Authentication → Templates"
echo "   Set Action URL to: http://localhost:3000/auth/action"
echo ""
echo "4. ${BLUE}Start development server:${NC}"
echo "   npm run dev"
echo "   # App will open at http://localhost:3000"
echo ""
echo "5. ${BLUE}Deploy Firestore rules (when ready):${NC}"
echo "   firebase deploy --only firestore:rules"
echo ""
echo -e "${GREEN}For detailed instructions, see:${NC}"
echo "   - README.md"
echo "   - docs/FIREBASE_MIGRATION_GUIDE.md"
echo "   - docs/SETUP_GUIDE.md"
echo ""
echo -e "${BLUE}Happy coding! 🚀${NC}\n"
