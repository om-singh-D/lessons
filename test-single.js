const http = require('http');

async function testSingleSignup() {
  const testUser = {
    username: 'singletest' + Date.now(),
    email: 'singletest' + Date.now() + '@example.com',
    firstName: 'John',
    age: 25,
    profession: 'Developer',
    primaryGoal: 'Learn new skills',
    password: 'TestPass123!'
  };

  const options = {
    hostname: 'localhost',
    port: 3000,  // Changed from 3001 to 3000
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
        console.log('Response Status:', res.statusCode);
        console.log('Response Body:', body);
        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(testUser));
    req.end();
  });
}

console.log('Testing single signup to see detailed server logs...');
testSingleSignup().catch(console.error);
