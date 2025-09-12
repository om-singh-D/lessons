const axios = require('axios');

const baseUrl = 'http://localhost:3000';

// Generate unique test data
const timestamp = new Date().toISOString().replace(/[-:\.]/g, '').slice(0, 14);
const testUser = {
    username: `testuser${timestamp}`,
    email: `testuser${timestamp}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    age: 25,
    profession: 'Developer',
    primaryGoal: 'Learn programming',
    password: 'TestPassword123!'
};

async function testUserDataAPI() {
    console.log('🧪 Testing User Data API Endpoints');
    console.log('='.repeat(50));
    
    try {
        // Test 1: Signup
        console.log('\n1️⃣ Testing Signup...');
        const signupResponse = await axios.post(`${baseUrl}/api/auth/signup`, testUser);
        
        if (signupResponse.data.success) {
            console.log('✅ Signup successful!');
            console.log(`👤 Username: ${signupResponse.data.user.username}`);
            console.log(`📧 Email: ${signupResponse.data.user.email}`);
            console.log(`🎫 Token received: ${!!signupResponse.data.token}`);
            
            const token = signupResponse.data.token;
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
            
            // Test 2: Get User Info (simplified)
            console.log('\n2️⃣ Testing /api/user/info...');
            try {
                const userInfoResponse = await axios.get(`${baseUrl}/api/user/info`, { headers });
                
                if (userInfoResponse.data.success) {
                    console.log('✅ User info retrieved successfully!');
                    console.log('\n📊 User Info JSON Response:');
                    console.log(JSON.stringify(userInfoResponse.data, null, 2));
                } else {
                    console.log('❌ User info failed:', userInfoResponse.data.error);
                }
            } catch (error) {
                console.log('❌ User info error:', error.response?.data || error.message);
            }
            
            // Test 3: Get Complete User Data
            console.log('\n3️⃣ Testing /api/user (complete data)...');
            try {
                const completeUserResponse = await axios.get(`${baseUrl}/api/user`, { headers });
                
                if (completeUserResponse.data.success) {
                    console.log('✅ Complete user data retrieved!');
                    console.log('\n📈 Complete User JSON Response:');
                    console.log(JSON.stringify(completeUserResponse.data, null, 2));
                } else {
                    console.log('❌ Complete user data failed:', completeUserResponse.data.error);
                }
            } catch (error) {
                console.log('❌ Complete user data error:', error.response?.data || error.message);
            }
            
            // Test 4: Test profile endpoint
            console.log('\n4️⃣ Testing /api/auth/profile...');
            try {
                const profileResponse = await axios.get(`${baseUrl}/api/auth/profile`, { headers });
                
                if (profileResponse.data.success) {
                    console.log('✅ Profile data retrieved!');
                    console.log('\n👤 Profile JSON Response:');
                    console.log(JSON.stringify(profileResponse.data, null, 2));
                } else {
                    console.log('❌ Profile failed:', profileResponse.data.error);
                }
            } catch (error) {
                console.log('❌ Profile error:', error.response?.data || error.message);
            }
            
            console.log('\n🎉 All tests completed!');
            
        } else {
            console.log('❌ Signup failed:', signupResponse.data.error);
        }
        
    } catch (error) {
        console.log('❌ Error during testing:', error.response?.data || error.message);
        console.log('💡 Make sure the server is running: npm run dev');
    }
}

// Check if axios is available
if (typeof require !== 'undefined') {
    testUserDataAPI();
} else {
    console.log('This script requires Node.js with axios package');
}
