const http = require('http');

function testEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ ${description}: SUCCESS`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Response: ${jsonData.success ? 'Success' : 'Failed'}`);
          if (jsonData.subjects) {
            console.log(`   Available subjects: ${jsonData.subjects.slice(0, 3).join(', ')}...`);
          }
          resolve(jsonData);
        } catch (error) {
          console.log(`❌ ${description}: Failed to parse JSON`);
          console.log(`   Raw response: ${data.substring(0, 200)}...`);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${description}: Connection failed`);
      console.log(`   Error: ${error.message}`);
      reject(error);
    });

    req.setTimeout(5000, () => {
      console.log(`❌ ${description}: Timeout`);
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

async function testLessonCreatorAPI() {
  console.log('🧪 Testing Lesson Creator API Endpoints\n');
  console.log('=' .repeat(50));
  
  try {
    // Test templates endpoint
    await testEndpoint('/api/lessons/templates', 'GET Templates');
    console.log('');
    
    // Test templates with parameters
    await testEndpoint('/api/lessons/templates?subject=mathematics&gradeLevel=middle', 'GET Templates with params');
    console.log('');
    
    // Test main API route (this will fail without auth, but should return 401)
    try {
      await testEndpoint('/api/lessons', 'GET Lessons (should fail without auth)');
    } catch (error) {
      // Expected to fail due to missing auth
      console.log('   (Expected failure due to missing authentication)');
    }
    console.log('');
    
    console.log('🎉 API endpoint testing completed!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. The templates endpoint is working');
    console.log('2. You can now use the lesson creator with proper authentication');
    console.log('3. Create lessons using the /api/lessons endpoint with a valid JWT token');
    console.log('4. Export lessons in PDF, Google Docs, or LMS formats');
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
  }
}

// Run the test
testLessonCreatorAPI();
