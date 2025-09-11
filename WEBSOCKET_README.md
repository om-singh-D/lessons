# ALCHPREP WebSocket Implementation

This implementation provides real-time functionality for:
1. **AI Question Generation** - Using Gemini API with rotation and rate limiting
2. **Contest Participation** - Real-time contest joining, answer submission, and leaderboard updates
3. **MongoDB Integration** - Storing questions and contest data
4. **Redis Support** - For session management and caching (optional, falls back to in-memory)

## Features Implemented

### ✅ 1. Gemini API Integration with Rotation
- **Multiple API Key Support**: Automatically rotates between multiple Gemini API keys
- **Rate Limit Handling**: Intelligent rate limit detection and key rotation
- **Error Recovery**: Proper error handling with retry mechanisms
- **Usage Statistics**: Track API usage across all keys

### ✅ 2. MongoDB Integration
- **Question Model**: Store generated questions with metadata
- **Contest Model**: Complete contest management with participants
- **Automatic Indexing**: Optimized database queries
- **Data Validation**: Comprehensive schema validation

### ✅ 3. WebSocket Real-time Features
- **Question Generation**: Real-time AI question generation with progress updates
- **Contest Participation**: Live contest joining and answer submission
- **Leaderboard Updates**: Real-time leaderboard updates
- **Connection Management**: Automatic reconnection and error handling

### ✅ 4. Redis Integration (Optional)
- **Session Management**: Store user sessions and active participants
- **Caching**: Cache frequently accessed data
- **Fallback Support**: Graceful fallback to in-memory storage

## Setup Instructions

### 1. Install Dependencies
```bash
cd C:\Users\elsas\OneDrive\Desktop\test\alchprep\ALCHPREP
npm install
```

### 2. Environment Configuration
Create/update your `.env.local` file with the provided configuration:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://youtube:root@cluster0.oblcbgu.mongodb.net/alchprep

# Redis Configuration (Optional)
REDIS_URL=redis://default:WmZBkLB7hO7tzJ0DH5vyY3fDEGjXYT2K@redis-14368.crce206.ap-south-1-1.ec2.redns.redis-cloud.com:14368

# Gemini API Keys for Rotation
GEMINI_API_KEY=AIzaSyC9ordkhWuD8B7axV5wYoMswPy9ghOJfbY
GEMINI_API_KEY_1=AIzaSyC9ordkhWuD8B7axV5wYoMswPy9ghOJfbY
GEMINI_API_KEY_2=AIzaSyC9ordkhWuD8B7axV5wYoMswPy9ghOJfbY
# Add more keys as needed...

# App Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 3. Start the Application

#### Development Mode (Recommended)
```bash
# Start both Next.js and WebSocket server
npm run dev:full

# Or start them separately:
# Terminal 1: Next.js app
npm run dev

# Terminal 2: WebSocket server
npm run dev:ws
```

#### Production Mode
```bash
# Build the application
npm run build

# Start both servers
npm run start:full
```

## API Endpoints

### Question Generation
- `GET /api/questions` - Fetch questions with filters
- `POST /api/questions` - Generate new questions using AI
- `PUT /api/questions?id={id}` - Update/verify questions
- `DELETE /api/questions?id={id}` - Delete questions

### Contest Management
- `GET /api/contest` - List contests
- `POST /api/contest` - Create new contest
- `GET /api/contest/[id]` - Get contest details
- `POST /api/contest/[id]/register` - Register for contest
- `DELETE /api/contest/[id]/register` - Unregister from contest

### WebSocket Events

#### Question Generation Events
```javascript
// Client sends
socket.emit('question:generate', {
  examType: 'SAT',
  subject: 'Mathematics',
  difficulty: 'medium',
  questionType: 'multiple-choice',
  requestId: 'unique-request-id'
});

// Server responds
socket.on('question:generating', (data) => {
  // Progress update
});

socket.on('question:generated', (data) => {
  // Question generated successfully
});

socket.on('question:error', (data) => {
  // Error occurred
});
```

#### Contest Events
```javascript
// Join contest
socket.emit('contest:join', { contestId, userId });

// Submit answer
socket.emit('contest:submit_answer', {
  contestId,
  questionId,
  answer,
  timeSpent,
  userId
});

// Get leaderboard
socket.emit('contest:get_leaderboard', { contestId });

// Listen for updates
socket.on('contest:leaderboard_update', (data) => {
  // Real-time leaderboard updates
});
```

## Usage Examples

### 1. Using the React Hooks

```jsx
import { useQuestionGeneration, useContest } from '@/hooks/useWebSocket';

function MyComponent() {
  const {
    generateQuestion,
    isGenerating,
    generatedQuestion,
    error,
    progress
  } = useQuestionGeneration();
  
  const handleGenerate = () => {
    generateQuestion('SAT', 'Mathematics', 'medium', 'multiple-choice');
  };
  
  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? `Generating... ${progress}` : 'Generate Question'}
      </button>
      
      {generatedQuestion && (
        <div>
          <h3>{generatedQuestion.question}</h3>
          <ul>
            {generatedQuestion.options?.map((option, index) => (
              <li key={index}>{option}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### 2. Testing the Implementation

Visit `http://localhost:3000/demo` to test the WebSocket functionality:

1. **Connection Status**: See real-time connection status
2. **Question Generation**: Generate AI questions with live progress
3. **Contest Demo**: Join contests and see leaderboard updates

## Error Handling

### Gemini API Errors
- **Rate Limit (429)**: Automatically rotates to next available API key
- **Invalid Key (401)**: Marks key as permanently blocked
- **Quota Exceeded (403)**: Temporarily blocks key with exponential backoff

### WebSocket Errors
- **Connection Lost**: Automatic reconnection with exponential backoff
- **Server Errors**: Graceful error handling with user feedback
- **Timeout Handling**: 30-second timeout for question generation

### Database Errors
- **Connection Issues**: Automatic reconnection with mongoose
- **Validation Errors**: Clear error messages returned to client
- **Index Optimization**: Optimized queries for better performance

## Performance Optimizations

1. **Connection Pooling**: MongoDB connection pooling for better performance
2. **Caching**: Redis caching for frequently accessed data
3. **Pagination**: Efficient pagination for large datasets
4. **Indexing**: Database indexes for faster queries
5. **Rate Limiting**: API rate limiting to prevent abuse

## Monitoring & Logging

- **API Usage Statistics**: Track Gemini API usage across all keys
- **WebSocket Metrics**: Monitor connection counts and event frequency
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Database query performance monitoring

## Scaling Considerations

1. **Horizontal Scaling**: WebSocket server can be scaled horizontally
2. **Load Balancing**: Use sticky sessions for WebSocket connections
3. **Database Sharding**: MongoDB can be sharded for large datasets
4. **Redis Clustering**: Redis can be clustered for high availability

## Security Features

1. **Rate Limiting**: Prevent API abuse
2. **Input Validation**: Comprehensive input validation
3. **CORS Configuration**: Proper CORS setup for WebSocket connections
4. **Error Sanitization**: Don't expose sensitive errors to clients

## Troubleshooting

### Common Issues

1. **WebSocket Connection Fails**
   - Check if port 3001 is available
   - Verify NEXT_PUBLIC_WS_URL in environment variables
   - Check firewall settings

2. **Gemini API Errors**
   - Verify API keys are valid
   - Check API quota limits
   - Ensure proper key rotation setup

3. **Database Connection Issues**
   - Verify MongoDB URI
   - Check network connectivity
   - Ensure database exists

4. **Redis Connection Issues**
   - Verify Redis URL (optional)
   - System falls back to in-memory storage
   - Check Redis server status

## Next Steps

1. **Authentication**: Add JWT-based authentication
2. **Real-time Analytics**: Add real-time analytics dashboard
3. **Mobile Support**: Add mobile app WebSocket support
4. **Clustering**: Set up WebSocket clustering for production
5. **Monitoring**: Add comprehensive monitoring and alerting

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── questions/route.js          # Question API endpoints
│   │   ├── contest/route.js            # Contest API endpoints
│   │   ├── contest/[id]/route.js       # Contest details
│   │   ├── contest/[id]/register/route.js # Contest registration
│   │   └── websocket/route.js          # WebSocket info endpoint
│   └── demo/page.jsx                   # Demo page
├── lib/
│   ├── mongodb.js                      # MongoDB connection
│   ├── redis.js                       # Redis utilities
│   ├── geminiManager.js               # Gemini API manager
│   └── models/
│       ├── Question.js                 # Question model
│       └── Contest.js                  # Contest model
├── hooks/
│   └── useWebSocket.js                 # WebSocket React hooks
└── components/
    └── WebSocketDemo.jsx               # Demo component

websocket-server.js                     # Standalone WebSocket server
.env.local                             # Environment variables
```
