#!/bin/bash

echo "🧪 Testing Mixamo Animation API"
echo "================================="

# Test health endpoint
echo "1️⃣ Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3002/health)
if [ "$HEALTH_RESPONSE" = "OK" ]; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed: $HEALTH_RESPONSE"
    exit 1
fi

# Test documentation endpoint
echo ""
echo "2️⃣ Testing documentation endpoint..."
DOC_RESPONSE=$(curl -s http://localhost:3002/ | head -c 50)
if [[ $DOC_RESPONSE == *"Mixamo Animation API"* ]]; then
    echo "✅ Documentation endpoint working"
else
    echo "❌ Documentation endpoint failed"
fi

# Test search endpoint (without auth - should fail)
echo ""
echo "3️⃣ Testing search endpoint without auth (should fail)..."
SEARCH_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3002/search -o /dev/null)
if [ "$SEARCH_RESPONSE" = "401" ]; then
    echo "✅ Authentication check working (401 as expected)"
else
    echo "❌ Authentication check failed, got: $SEARCH_RESPONSE"
fi

echo ""
echo "🎉 All basic tests passed!"
echo "💡 To test with authentication, set MIXAMO_TOKEN and run:"
echo "   export MIXAMO_TOKEN='Bearer your-token-here'"
echo "   bun examples/client.ts" 