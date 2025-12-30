#!/bin/bash

# Automated Test Runner for Investment System
# Run with: ./run-tests.sh

echo "=========================================="
echo "  Investment System - Test Suite"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Run Node.js tests
echo "Running automated code tests..."
node test-investment-system.cjs
TEST_EXIT_CODE=$?

echo ""
echo "=========================================="
echo "  Manual Browser Tests"
echo "=========================================="
echo ""
echo "Please run these tests in your browser:"
echo ""
echo "1. Graph Persistence Test:"
echo "   - Open Bitcoin details"
echo "   - Switch between 1M, 1Y, 1M"
echo "   - Graph should remain identical"
echo ""
echo "2. Price Consistency Test:"
echo "   - Refresh page multiple times"
echo "   - Prices should stay the same"
echo ""
echo "3. localStorage Test (in console):"
echo "   const graphs = JSON.parse(localStorage.getItem('investment_graph_data'));"
echo "   console.log(Object.keys(graphs));"
echo ""
echo "=========================================="

# Exit with test result
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All automated tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Check output above.${NC}"
    exit 1
fi
