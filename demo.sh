#!/bin/bash

# MEDISYNC Demo Script
# This script helps you quickly seed the database and start the development servers

set -e

SEED=false
BACKEND=false
FRONTEND=false
ALL=false

# Colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
WHITE='\033[0;37m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${CYAN}============================================================${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}============================================================${NC}"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -seed|--seed)
            SEED=true
            shift
            ;;
        -backend|--backend)
            BACKEND=true
            shift
            ;;
        -frontend|--frontend)
            FRONTEND=true
            shift
            ;;
        -all|--all)
            ALL=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# If no options provided, show help
if [ "$SEED" = false ] && [ "$BACKEND" = false ] && [ "$FRONTEND" = false ] && [ "$ALL" = false ]; then
    print_header "MEDISYNC Demo Setup"
    cat << 'EOF'

Welcome to MEDISYNC! Choose what you want to do:

Usage: ./demo.sh [option]

Options:
  -seed, --seed          Seed the database with demo data (5 pharmacies, 5 patients, etc.)
  -backend, --backend    Start the backend server (port 5000)
  -frontend, --frontend  Start the frontend server (port 5173)
  -all, --all            Do everything: seed, then start both servers

Examples:
  ./demo.sh --seed                   # Just seed the database
  ./demo.sh --backend                # Just start backend
  ./demo.sh --frontend               # Just start frontend
  ./demo.sh --all                    # Full setup: seed + both servers

Demo Credentials:
  Pharmacist: pharmacist@medisync.test / password123
  Patient:    patient@medisync.test / password123
  Admin:      admin@medisync.test / password123

After services start:
  Backend:  http://localhost:5000
  Frontend: http://localhost:5173

EOF
    echo -e "${YELLOW}Pro Tip: Open two browser windows and login to both to see real-time updates!${NC}"
    exit 0
fi

# Handle --all flag
if [ "$ALL" = true ]; then
    SEED=true
    BACKEND=true
    FRONTEND=true
fi

# Seed the database
if [ "$SEED" = true ]; then
    print_header "Seeding Database"
    
    if [ ! -d "backend" ]; then
        echo -e "${RED}Error: backend directory not found${NC}"
        exit 1
    fi
    
    cd backend
    
    echo -e "${YELLOW}Installing dependencies (if needed)...${NC}"
    npm install --silent
    
    echo -e "${YELLOW}Running seed script...${NC}"
    if npm run seed; then
        echo ""
        echo -e "${GREEN}✓ Database seeded successfully!${NC}"
        echo ""
        echo -e "${CYAN}Created:${NC}"
        echo -e "${WHITE}  • 1 Admin user${NC}"
        echo -e "${WHITE}  • 5 Pharmacists with full pharmacy setups${NC}"
        echo -e "${WHITE}  • 5 Patients for testing${NC}"
        echo -e "${WHITE}  • 5 Pharmacies with 8 medicines each${NC}"
        echo -e "${WHITE}  • Sample prescriptions and orders${NC}"
    else
        echo -e "${RED}✗ Seeding failed!${NC}"
        exit 1
    fi
    
    cd ..
fi

# Start backend
if [ "$BACKEND" = true ]; then
    print_header "Starting Backend Server"
    
    if [ ! -d "backend" ]; then
        echo -e "${RED}Error: backend directory not found${NC}"
        exit 1
    fi
    
    cd backend
    echo -e "${GREEN}Backend starting on port 5000...${NC}"
    npm run dev &
    BACKEND_PID=$!
    cd ..
fi

# Start frontend
if [ "$FRONTEND" = true ]; then
    print_header "Starting Frontend Server"
    
    if [ ! -d "frontend" ]; then
        echo -e "${RED}Error: frontend directory not found${NC}"
        exit 1
    fi
    
    cd frontend
    echo -e "${GREEN}Frontend starting on port 5173...${NC}"
    npm run dev &
    FRONTEND_PID=$!
    cd ..
fi

# If both services started, show summary
if [ "$BACKEND" = true ] && [ "$FRONTEND" = true ]; then
    print_header "Services Started"
    
    echo -e "${GREEN}✓ Backend running at: http://localhost:5000${NC}"
    echo -e "${GREEN}✓ Frontend running at: http://localhost:5173${NC}"
    
    echo ""
    echo -e "${CYAN}Test Flow:${NC}"
    echo -e "${WHITE}1. Open http://localhost:5173 in your browser${NC}"
    echo -e "${WHITE}2. Login as pharmacist@medisync.test / password123${NC}"
    echo -e "${WHITE}3. Go to 'Stock Control' and update a medicine${NC}"
    echo -e "${WHITE}4. Open a new window and login as patient@medisync.test${NC}"
    echo -e "${WHITE}5. Search for pharmacies and use geolocation${NC}"
    echo -e "${WHITE}6. Watch for real-time notifications!${NC}"
    
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop the servers${NC}"
    echo ""
    
    # Wait for both services
    wait
fi

echo ""
