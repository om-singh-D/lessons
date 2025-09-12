const http = require('http');

// Test data for signup
const testUser = {
  username: 'testuser' + Date.now(), // Make username unique
  email: 'testuser' + Date.now() + '@example.com', // Make email unique
  firstName: 'John',
  age: 25,
  profession: 'Developer',
  primaryGoal: 'Learn new skills',
  password: 'TestPass123!'
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, port = 3001) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testSignupRoute() {
  console.log('🚀 Testing Signup Route and Database Connection\n');

  try {
    // Test 1: Check if server is running
    console.log('1️⃣  Testing server connectivity on port 3001...');
    try {
      const healthResponse = await makeRequest('GET', '/');
      console.log('✅ Server is running on port 3001, status:', healthResponse.statusCode);
    } catch (error) {
      console.log('❌ Server connectivity failed:', error.message);
      return;
    }

    // Test 2: Test signup with valid data
    console.log('\n2️⃣  Testing user signup...');
    console.log('Signup data:', testUser);
    
    try {
      const signupResponse = await makeRequest('POST', '/api/auth/signup', testUser);
      
      console.log('Signup Status:', signupResponse.statusCode);
      console.log('Signup Response:', signupResponse.data);
      
      if (signupResponse.statusCode === 201) {
        console.log('✅ User signup successful!');
        console.log('✅ Data was successfully saved to MongoDB');
        
        // Check if JWT token was set
        if (signupResponse.headers['set-cookie']) {
          console.log('✅ JWT token cookie was set');
        }
        
        return signupResponse.data;
      } else if (signupResponse.statusCode === 500) {
        console.log('❌ Database connection failed - MongoDB error');
        if (signupResponse.data && signupResponse.data.error) {
          console.log('Error details:', signupResponse.data.error);
        }
      } else {
        console.log('❌ Signup failed with status:', signupResponse.statusCode);
        if (signupResponse.data) {
          console.log('Error details:', signupResponse.data);
        }
      }
    } catch (error) {
      console.log('❌ Signup request failed:', error.message);
    }

    // Test 3: Test with duplicate username (should fail)
    console.log('\n3️⃣  Testing duplicate username (should fail)...');
    try {
      const duplicateResponse = await makeRequest('POST', '/api/auth/signup', testUser);
      console.log('Duplicate test status:', duplicateResponse.statusCode);
      console.log('Duplicate test response:', duplicateResponse.data);
      
      if (duplicateResponse.statusCode === 400) {
        console.log('✅ Duplicate validation working correctly');
      }
    } catch (error) {
      console.log('❌ Duplicate test failed:', error.message);
    }

  } catch (error) {
    console.log('❌ Test failed:', error);
  }

  console.log('\n🎉 Signup route testing completed!');
}

// Run the test
testSignupRoute();
