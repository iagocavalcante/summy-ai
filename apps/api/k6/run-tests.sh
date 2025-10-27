#!/bin/bash

# k6 Load Testing Runner
# Usage: ./run-tests.sh [test-type]
# Test types: smoke, load, stress, spike, all

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL=${API_URL:-"http://localhost:3000"}
RESULTS_DIR="k6/results"

# Create results directory
mkdir -p "$RESULTS_DIR"

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
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

# Check if k6 is installed
check_k6() {
    if ! command -v k6 &> /dev/null; then
        print_error "k6 is not installed!"
        echo ""
        echo "Install k6:"
        echo "  macOS:   brew install k6"
        echo "  Linux:   sudo apt-get install k6"
        echo "  Windows: choco install k6"
        echo "  Docker:  docker pull grafana/k6"
        echo ""
        echo "Or visit: https://k6.io/docs/get-started/installation/"
        exit 1
    fi
    print_success "k6 is installed: $(k6 version)"
}

# Check if API is running
check_api() {
    print_header "Checking API availability"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL" | grep -q "200\|404"; then
        print_success "API is reachable at $API_URL"
    else
        print_error "API is not reachable at $API_URL"
        print_warning "Please start the API server first: pnpm dev"
        exit 1
    fi
}

# Run smoke test
run_smoke() {
    print_header "Running Smoke Test"
    k6 run \
        --out json="$RESULTS_DIR/smoke-test.json" \
        -e API_URL="$API_URL" \
        k6/scenarios/smoke-test.js
    print_success "Smoke test completed"
}

# Run load test
run_load() {
    print_header "Running Load Test"
    k6 run \
        --out json="$RESULTS_DIR/load-test.json" \
        -e API_URL="$API_URL" \
        k6/scenarios/load-test.js
    print_success "Load test completed"
}

# Run stress test
run_stress() {
    print_header "Running Stress Test"
    print_warning "This test will push the system to its limits"
    k6 run \
        --out json="$RESULTS_DIR/stress-test.json" \
        -e API_URL="$API_URL" \
        k6/scenarios/stress-test.js
    print_success "Stress test completed"
}

# Run spike test
run_spike() {
    print_header "Running Spike Test"
    print_warning "This test simulates sudden traffic spikes"
    k6 run \
        --out json="$RESULTS_DIR/spike-test.json" \
        -e API_URL="$API_URL" \
        k6/scenarios/spike-test.js
    print_success "Spike test completed"
}

# Run all tests
run_all() {
    run_smoke
    echo ""
    run_load
    echo ""
    run_stress
    echo ""
    run_spike
    print_header "All tests completed!"
}

# Generate HTML report
generate_report() {
    print_header "Generating HTML Report"
    if [ -f "$RESULTS_DIR/load-test.json" ]; then
        echo "<!-- k6 HTML Report -->" > "$RESULTS_DIR/report.html"
        echo "<html><body><h1>k6 Load Test Results</h1>" >> "$RESULTS_DIR/report.html"
        echo "<p>Results saved in $RESULTS_DIR/</p>" >> "$RESULTS_DIR/report.html"
        echo "</body></html>" >> "$RESULTS_DIR/report.html"
        print_success "Report generated at $RESULTS_DIR/report.html"
    else
        print_warning "No test results found. Run tests first."
    fi
}

# Main script
main() {
    check_k6
    check_api

    TEST_TYPE=${1:-"smoke"}

    case $TEST_TYPE in
        smoke)
            run_smoke
            ;;
        load)
            run_load
            ;;
        stress)
            run_stress
            ;;
        spike)
            run_spike
            ;;
        all)
            run_all
            ;;
        *)
            print_error "Unknown test type: $TEST_TYPE"
            echo ""
            echo "Usage: $0 [test-type]"
            echo "Test types: smoke, load, stress, spike, all"
            exit 1
            ;;
    esac

    echo ""
    print_header "Test Summary"
    echo "Results directory: $RESULTS_DIR"
    echo "View detailed metrics in the JSON files"
}

# Run main function
main "$@"
