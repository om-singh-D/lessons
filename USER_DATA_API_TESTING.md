# Simple JSON Test for User Data API

## Endpoints to Test:

### 1. Signup Endpoint
```
POST http://localhost:3000/api/auth/signup
Content-Type: application/json

{
  "username": "testuser123",
  "email": "testuser123@example.com",
  "password": "TestPass123!",
  "firstName": "Test",
  "lastName": "User",
  "age": 25,
  "profession": "Developer",
  "primaryGoal": "Learn programming"
}
```

Expected Response:
```json
{
  "success": true,
  "message": "User created successfully",
  "token": "eyJ...",
  "user": {
    "id": "...",
    "username": "testuser123",
    "email": "testuser123@example.com",
    "firstName": "Test"
  }
}
```

### 2. User Info Endpoint (Simplified)
```
GET http://localhost:3000/api/user/info
Authorization: Bearer YOUR_TOKEN_HERE
```

Expected Response:
```json
{
  "success": true,
  "message": "User info retrieved successfully",
  "user": {
    "id": "...",
    "username": "testuser123",
    "email": "testuser123@example.com",
    "firstName": "Test",
    "lastName": "User",
    "age": 25,
    "profession": "Developer",
    "primaryGoal": "Learn programming",
    "bio": null,
    "avatar": null,
    "createdAt": "2025-09-12T...",
    "lastLogin": "2025-09-12T...",
    "isAuthenticated": true,
    "subscriptionPlan": "Free",
    "level": 2,
    "xpPoints": 100,
    "streakCount": 0,
    "totalLessons": 0,
    "questionsAttempted": 0,
    "correctAnswers": 0,
    "accuracyRate": 0
  }
}
```

### 3. Complete User Data Endpoint
```
GET http://localhost:3000/api/user
Authorization: Bearer YOUR_TOKEN_HERE
```

Expected Response:
```json
{
  "success": true,
  "message": "Complete user data retrieved successfully",
  "user": {
    "id": "...",
    "username": "testuser123",
    "email": "testuser123@example.com",
    "firstName": "Test",
    "lastName": "User",
    "age": 25,
    "profession": "Developer",
    "primaryGoal": "Learn programming",
    "bio": null,
    "avatar": null,
    "location": null,
    "createdAt": "2025-09-12T...",
    "updatedAt": "2025-09-12T...",
    "lastLogin": "2025-09-12T...",
    "isAuthenticated": true,
    "subscriptionPlan": "Free",
    "emailVerified": false,
    "level": 2,
    "xpPoints": 100,
    "streakCount": 0,
    "totalLessons": 0,
    "completedLessons": 0,
    "questionsAttempted": 0,
    "correctAnswers": 0,
    "incorrectAnswers": 0,
    "accuracyRate": 0,
    "averageSessionTime": 0,
    "totalStudyTime": 0,
    "lessons": [],
    "questionsHistory": [],
    "achievements": [],
    "badges": [],
    "preferredDifficulty": "medium",
    "learningStyle": "Mixed",
    "studyGoals": [],
    "dailyGoal": 30,
    "friends": [],
    "mentorRequests": [],
    "competitions": [],
    "weeklyProgress": {},
    "monthlyProgress": {},
    "strongSubjects": [],
    "weakSubjects": [],
    "recentActivity": [],
    "lastActiveDate": null,
    "loginHistory": [],
    "preferences": {},
    "notifications": {
      "email": true,
      "push": true,
      "reminders": true
    },
    "embedding": "Not generated",
    "features": {
      "aiTutor": false,
      "unlimitedQuestions": false,
      "detailedAnalytics": false,
      "prioritySupport": false
    }
  },
  "meta": {
    "dataFreshness": "2025-09-12T...",
    "responseTime": 1234567890,
    "apiVersion": "1.0",
    "totalFields": 50
  }
}
```

## MongoDB Data Structure

The user data in MongoDB contains these fields:

**Core Identity:**
- `_id`: ObjectId
- `username`: String (unique)
- `email`: String (unique)
- `firstName`, `lastName`: String
- `age`: Number
- `profession`: String
- `primaryGoal`: String

**Gamification:**
- `level`: Number (default: 2)
- `xp_points`: Number (default: 100)
- `streak_count`: Number
- `score`, `game_score`: Number

**Learning Analytics:**
- `questions_attempted`: Number
- `correct_questions`: Number
- `accuracy_rate`: Number
- `completion_rate`: Number
- `average_session_duration`: Number

**Social Features:**
- `friends`: Array
- `friends_count`: Number
- `friendsof`: Number

**System Data:**
- `createdAt`, `updatedAt`: Date
- `lastLoginTime`: Date
- `subscription_plan`: String (default: "Free")
- `vector_embedding`: Array of Numbers
- `learning_style`: String (default: "Mixed")

## Testing with Postman

1. Import the collection: `AlchPrep-User-Data-API.postman_collection.json`
2. Import the environment: `AlchPrep-Development.postman_environment.json`
3. Run the "User Signup" request first to get a token
4. The token will be automatically set in the environment
5. Run "Get User Info" and "Get Complete User Data" to see the JSON responses

## Direct MongoDB Query Equivalent

The API endpoints return data equivalent to these MongoDB queries:

```javascript
// For /api/user/info (simplified)
db.users.findOne({_id: userId}, {
  username: 1, email: 1, firstName: 1, lastName: 1,
  age: 1, profession: 1, primaryGoal: 1, level: 1,
  xp_points: 1, streak_count: 1, questions_attempted: 1,
  correct_questions: 1, subscription_plan: 1,
  createdAt: 1, lastLoginTime: 1
})

// For /api/user (complete)
db.users.findOne({_id: userId})  // Returns all fields
```
