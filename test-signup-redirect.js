const http = require('http');

async function testSignupRedirect() {
  const testUser = {
    username: 'redirecttest' + Date.now(),
    email: 'redirecttest' + Date.now() + '@example.com',
    firstName: 'John',
    age: 25,
    profession: 'Developer',
    primaryGoal: 'Learn new skills',
    password: 'TestPass123!'
  };

  console.log('🚀 Testing Signup Redirect Flow');
  console.log('User data:', {
    username: testUser.username,
    email: testUser.email,
    firstName: testUser.firstName,
    age: testUser.age,
    profession: testUser.profession,
    primaryGoal: testUser.primaryGoal
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/signup',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('\n📊 Signup Response:');
        console.log('Status:', res.statusCode);
        
        try {
          const data = JSON.parse(body);
          console.log('Data:', data);
          
          if (res.statusCode === 201) {
            console.log('✅ Signup successful!');
            console.log('✅ User will be redirected to dashboard');
            console.log('🍪 JWT cookie should be set automatically');
            
            // Check if Set-Cookie header exists
            if (res.headers['set-cookie']) {
              console.log('✅ Set-Cookie header found:', res.headers['set-cookie']);
            } else {
              console.log('❌ No Set-Cookie header found');
            }
          } else {
            console.log('❌ Signup failed');
          }
        } catch (error) {
          console.log('❌ JSON parse error:', error.message);
          console.log('Raw body:', body);
        }
        
        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(testUser));
    req.end();
  });
}

testSignupRedirect().catch(console.error);
