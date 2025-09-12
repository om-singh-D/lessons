# Testing User Data Routes in Postman

## 🚀 Quick Setup Guide

### 1. Import the Collection and Environment

1. **Open Postman**
2. **Import Collection:**
   - Click "Import" button
   - Select `AlchPrep-User-Data-API.postman_collection.json`
   - Click "Import"

3. **Import Environment:**
   - Click "Import" button
   - Select `AlchPrep-Development.postman_environment.json`
   - Click "Import"

4. **Select Environment:**
   - In the top-right corner, select "AlchPrep Development Environment"

### 2. Start Your Server

Make sure your Next.js server is running:
```bash
npm run dev
```

Server should be available at: `http://localhost:3000`

## 🧪 Testing Workflow

### Step 1: Create a Test User

1. **Run Request:** `1. Signup User`
   - This will automatically create a user with timestamp
   - The auth token will be saved automatically
   - Expected Response: `201 Created`

```json
{
  "message": "User created successfully",
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "68c47a0824f3d3c48652c9ad",
    "username": "postman_test_1757707200000",
    "email": "postman_test_1757707200000@example.com",
    "firstName": "Postman",
    "age": 25,
    "profession": "Developer",
    "primaryGoal": "Learn new skills"
  }
}
```

### Step 2: Test User Data Routes

Now you can test all the user data endpoints:

#### 2A. Get Simplified User Info ⭐ (Recommended)

**Request:** `3. Get User Info (Simplified)`
- **Method:** GET
- **URL:** `/api/user/info`
- **Headers:** `Authorization: Bearer {{auth_token}}`

**Expected Response:**
```json
{
  "success": true,
  "message": "User info retrieved successfully",
  "user": {
    "id": "68c47a0824f3d3c48652c9ad",
    "username": "postman_test_1757707200000",
    "email": "postman_test_1757707200000@example.com",
    "firstName": "Postman",
    "lastName": "Test",
    "age": 25,
    "profession": "Developer",
    "primaryGoal": "Learn new skills",
    "isAuthenticated": true,
    "level": 1,
    "xpPoints": 0,
    "streakCount": 0,
    "accuracyRate": 0
  }
}
```

#### 2B. Get Complete User Data

**Request:** `4. Get Complete User Data`
- **Method:** GET
- **URL:** `/api/user`
- **Headers:** `Authorization: Bearer {{auth_token}}`

**Expected Response:** Complete user object with analytics, learning profile, and gamification data.

#### 2C. Update User Profile

**Request:** `5. Update User Profile`
- **Method:** PUT
- **URL:** `/api/user`
- **Headers:** `Authorization: Bearer {{auth_token}}`
- **Body:** JSON with fields to update

### Step 3: Test Error Scenarios

#### 3A. Test Without Authentication

**Request:** `7. Test Without Token (401 Error)`
- Should return `401 Unauthorized`

#### 3B. Test Invalid Token

**Request:** `8. Test Invalid Token (401 Error)`
- Should return `401 Unauthorized`

## 📋 Available Endpoints Summary

| Endpoint | Method | Purpose | Response Size |
|----------|---------|---------|---------------|
| `/api/user/info` | GET | Simplified user data | Small (recommended) |
| `/api/user` | GET | Complete user data | Large (detailed) |
| `/api/user` | PUT | Update user profile | Updated data |
| `/api/auth/profile` | GET | Existing profile endpoint | Medium |

## 🔧 Manual Testing (Alternative)

If you prefer manual requests, here are the curl commands:

### 1. Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "testuser123@example.com",
    "firstName": "Test",
    "age": 25,
    "profession": "Developer",
    "primaryGoal": "Learn new skills",
    "password": "testpassword123"
  }'
```

### 2. Get User Info (replace TOKEN with actual token from signup)
```bash
curl -X GET http://localhost:3000/api/user/info \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Get Complete User Data
```bash
curl -X GET http://localhost:3000/api/user \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🎯 Key Points for localStorage Integration

The `/api/user/info` endpoint returns data that matches what your frontend stores in localStorage:

```javascript
// These fields are available in the API response:
localStorage.setItem('username', user.username);
localStorage.setItem('email', user.email);
localStorage.setItem('firstName', user.firstName);
localStorage.setItem('userId', user.id);
localStorage.setItem('token', authToken);
```

## 🐛 Troubleshooting

### Common Issues:

1. **401 Unauthorized:**
   - Make sure you ran the signup request first
   - Check that the token is properly stored in variables
   - Verify the Authorization header format: `Bearer {{auth_token}}`

2. **500 Server Error:**
   - Check that MongoDB is connected
   - Verify the server is running on port 3000
   - Check server logs for detailed error messages

3. **ECONNREFUSED:**
   - Make sure `npm run dev` is running
   - Verify the base_url is set to `http://localhost:3000`

### Debug Steps:
1. Check Postman Console (View → Show Postman Console)
2. Look at the Variables tab in your request
3. Verify the auth_token variable has a value
4. Check your terminal for server logs

## 📊 Expected Data Structure

The user object contains all the data you need for your application, including:

- **Identity:** username, email, firstName, lastName
- **Profile:** age, profession, primaryGoal, bio
- **Analytics:** level, xpPoints, streakCount, accuracyRate
- **Learning:** totalLessons, questionsAttempted, correctAnswers
- **Account:** createdAt, lastLogin, subscriptionPlan

Perfect for storing in localStorage and using throughout your application! 🚀
