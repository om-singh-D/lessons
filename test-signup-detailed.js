const http = require('http');

// Test data for signup with more fields
const testUser = {
  username: 'testuser' + Date.now(),
  email: 'testuser' + Date.now() + '@example.com',
  firstName: 'John',
  lastName: 'Doe',  // Adding lastName
  age: 25,
  profession: 'Developer',
  primaryGoal: 'Learn new skills',
  password: 'TestPass123!',
  avatar: '',  // Adding avatar
  bio: 'Test user bio'  // Adding bio
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

async function testDetailedSignup() {
  console.log('🚀 Testing Detailed Signup with Validation Debugging\n');

  try {
    // Test 1: Minimal required fields only
    console.log('1️⃣  Testing with minimal required fields...');
    const minimalUser = {
      username: 'minimal' + Date.now(),
      email: 'minimal' + Date.now() + '@example.com',
      password: 'TestPass123!'
    };
    
    console.log('Minimal data:', minimalUser);
    const minimalResponse = await makeRequest('POST', '/api/auth/signup', minimalUser);
    console.log('Minimal test - Status:', minimalResponse.statusCode);
    console.log('Minimal test - Response:', minimalResponse.data);
    
    if (minimalResponse.statusCode === 201) {
      console.log('✅ Minimal signup successful!');
    } else {
      console.log('❌ Minimal signup failed');
    }

    // Test 2: Complete profile data
    console.log('\n2️⃣  Testing with complete profile data...');
    console.log('Complete data:', testUser);
    
    const completeResponse = await makeRequest('POST', '/api/auth/signup', testUser);
    console.log('Complete test - Status:', completeResponse.statusCode);
    console.log('Complete test - Response:', completeResponse.data);
    
    if (completeResponse.statusCode === 201) {
      console.log('✅ Complete signup successful!');
    } else {
      console.log('❌ Complete signup failed');
    }

    // Test 3: Test with various profession values
    console.log('\n3️⃣  Testing with different profession values...');
    const professions = ['student', 'developer', 'teacher', 'engineer', 'designer'];
    
    for (const profession of professions) {
      const professionUser = {
        username: profession + Date.now(),
        email: profession + Date.now() + '@example.com',
        firstName: 'John',
        age: 25,
        profession: profession,
        primaryGoal: 'Learn new skills',
        password: 'TestPass123!'
      };
      
      const profResponse = await makeRequest('POST', '/api/auth/signup', professionUser);
      console.log(`${profession} - Status: ${profResponse.statusCode}`);
      
      if (profResponse.statusCode === 201) {
        console.log(`✅ ${profession} signup successful!`);
        break; // If one works, we know the issue isn't profession-related
      }
    }

    // Test 4: Test with different primary goals
    console.log('\n4️⃣  Testing with different primary goal values...');
    const goals = ['learn new skills', 'career advancement', 'exam preparation', 'personal growth'];
    
    for (const goal of goals) {
      const goalUser = {
        username: 'goal' + Date.now(),
        email: 'goal' + Date.now() + '@example.com',
        firstName: 'John',
        age: 25,
        profession: 'Developer',
        primaryGoal: goal,
        password: 'TestPass123!'
      };
      
      const goalResponse = await makeRequest('POST', '/api/auth/signup', goalUser);
      console.log(`${goal} - Status: ${goalResponse.statusCode}`);
      
      if (goalResponse.statusCode === 201) {
        console.log(`✅ ${goal} signup successful!`);
        break;
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error);
  }

  console.log('\n🎉 Detailed signup testing completed!');
}

// Run the test
testDetailedSignup();
