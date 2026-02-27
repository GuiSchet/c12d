// Test script for OpenAI intent recognition integration
// This tests the client-server flow for the navigation orchestrator

const { execSync } = require('child_process');

console.log("🧪 Testing OpenAI Intent Recognition Integration");
console.log("================================================");

// Test 1: Check if API endpoint exists and responds
console.log("\n1. Testing API endpoint availability...");
try {
  const testResponse = execSync('curl -X POST http://localhost:3000/api/intent-recognition -H "Content-Type: application/json" -d \'{"message":"test"}\' -s', { encoding: 'utf8' });
  console.log("✅ API endpoint responds");
  console.log("Response preview:", testResponse.substring(0, 100) + "...");
} catch (error) {
  console.log("❌ API endpoint test failed. Make sure the dev server is running with 'npm run dev'");
  console.log("Error:", error.message);
}

// Test 2: Check environment variable
console.log("\n2. Checking OPENAI_APIKEY environment variable...");
try {
  const envResult = execSync('grep OPENAI_APIKEY .env 2>/dev/null || echo "Not found in .env"', { encoding: 'utf8' });
  if (envResult.includes('OPENAI_APIKEY')) {
    console.log("✅ OPENAI_APIKEY found in .env");
  } else {
    console.log("⚠️  OPENAI_APIKEY not found in .env file");
    console.log("Please ensure you have OPENAI_APIKEY=your_api_key in your .env file");
  }
} catch (error) {
  console.log("❌ Error checking .env file:", error.message);
}

// Test 3: Check if OpenAI package is installed
console.log("\n3. Checking OpenAI package installation...");
try {
  const packageCheck = execSync('npm list openai 2>/dev/null || echo "OpenAI package not found"', { encoding: 'utf8' });
  if (packageCheck.includes('openai@')) {
    console.log("✅ OpenAI package is installed");
  } else {
    console.log("❌ OpenAI package not installed. Run: npm install openai");
  }
} catch (error) {
  console.log("❌ Error checking OpenAI package:", error.message);
}

console.log("\n📋 Test Summary:");
console.log("- API endpoint: Available (check response above)");
console.log("- Environment: Check OPENAI_APIKEY in .env");
console.log("- Dependencies: Check OpenAI package installation");
console.log("\n🚀 If all checks pass, the OpenAI intent recognition should work!");
console.log("🎯 Navigate to http://localhost:3000/conversation to test with voice commands");