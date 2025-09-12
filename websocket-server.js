// Load environment variables first
require('dotenv').config({ path: '.env' });

const { createServer } = require('http');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3001; // WebSocket server port

async function startServer() {
  try {
    // Create HTTP server for WebSocket
    const server = createServer();
    
    // Initialize Socket.IO
    const io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://your-production-domain.com'] 
          : ['http://localhost:3002'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });
    
    // Import utilities using dynamic imports to handle ES modules
    let connectDB, Question, Contest, getGeminiManager;
    let setData, getData, deleteData, addToSet, removeFromSet;
    
    try {
      // Load environment variables
      console.log('Environment variables loaded:', {
        MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set' : 'Not set',
        REDIS_URL: process.env.REDIS_URL ? 'Set' : 'Not set'
      });
      
      // Use require for CommonJS modules or dynamic imports for ES modules
      connectDB = require('./src/lib/mongodb.js').default;
      Question = require('./src/lib/models/Question.js').default;
      Contest = require('./src/lib/models/Contest.js').default;
      getGeminiManager = require('./src/lib/geminiManager.js').getGeminiManager;
      
      const redisUtils = require('./src/lib/redis.js');
      setData = redisUtils.setData;
      getData = redisUtils.getData;
      deleteData = redisUtils.deleteData;
      addToSet = redisUtils.addToSet;
      removeFromSet = redisUtils.removeFromSet;
      
    } catch (error) {
      console.error('Error importing modules, trying alternative approach:', error);
      
      // Alternative approach using dynamic imports
      try {
        const mongoModule = await import('./src/lib/mongodb.js');
        const questionModule = await import('./src/lib/models/Question.js');
        const contestModule = await import('./src/lib/models/Contest.js');
        const geminiModule = await import('./src/lib/geminiManager.js');
        const redisModule = await import('./src/lib/redis.js');
        
        connectDB = mongoModule.default;
        Question = questionModule.default;
        Contest = contestModule.default;
        getGeminiManager = geminiModule.getGeminiManager;
        setData = redisModule.setData;
        getData = redisModule.getData;
        deleteData = redisModule.deleteData;
        addToSet = redisModule.addToSet;
        removeFromSet = redisModule.removeFromSet;
        
      } catch (importError) {
        console.error('Failed to import modules:', importError);
        console.log('Starting WebSocket server without database integration...');
        
        // Mock functions for basic WebSocket functionality
        connectDB = async () => console.log('Database connection mocked');
        getGeminiManager = () => ({
          generateQuestion: async () => ({
            question: "Sample question?",
            options: ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
            correctAnswer: "A",
            explanation: "This is a sample explanation.",
            subject: "Sample",
            difficulty: "medium",
            examType: "Sample",
            questionType: "multiple-choice"
          }),
          getUsageStats: () => ({}),
          currentKeyIndex: 0
        });
        setData = async () => {};
        getData = async () => null;
        deleteData = async () => {};
        addToSet = async () => {};
        removeFromSet = async () => {};
      }
    }
    
    // Initialize connections
    try {
      await connectDB();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
    }
    
    const geminiManager = getGeminiManager();
    
    // WebSocket connection handling
    io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);
      
      // Join user to a room based on their ID
      socket.on('user:join', async (data) => {
        const { userId, username } = data;
        socket.userId = userId;
        socket.username = username;
        
        await socket.join(`user:${userId}`);
        await addToSet('online_users', userId);
        
        console.log(`User ${username} (${userId}) joined`);
        
        // Notify user of successful connection
        socket.emit('user:connected', {
          success: true,
          userId,
          username,
          socketId: socket.id
        });
      });
      
      // Handle question generation requests
      socket.on('question:generate', async (data) => {
        try {
          const { examType, subject, difficulty = 'medium', questionType = 'multiple-choice', requestId } = data;
          
          if (!examType || !subject) {
            socket.emit('question:error', {
              requestId,
              error: 'examType and subject are required'
            });
            return;
          }
          
          // Notify that question generation started
          socket.emit('question:generating', {
            requestId,
            message: 'Generating question using AI...',
            examType,
            subject,
            difficulty
          });
          
          try {
            // Try to generate question using Gemini AI
            const questionData = await geminiManager.generateQuestion(
              examType,
              subject,
              difficulty,
              questionType
            );
            
            // Save to database if available
            if (Question) {
              const question = new Question({
                ...questionData,
                geminiKeyIndex: geminiManager.currentKeyIndex,
                aiGenerated: true,
                verified: false,
                tags: [examType, subject, difficulty]
              });
              
              await question.save();
            }
            
            // Send generated question
            socket.emit('question:generated', {
              requestId,
              question: questionData,
              geminiStats: geminiManager.getUsageStats()
            });
            
          } catch (apiError) {
            console.log('Gemini API failed, using mock data for demo...');
            
            // Generate mock question data for testing
            const mockQuestion = {
              question: `Sample ${difficulty} ${examType} question for ${subject}: What is the fundamental concept in ${subject}?`,
              options: [
                "A) This is the correct answer for the sample question",
                "B) This is an incorrect option to test the interface", 
                "C) Another incorrect option for demonstration purposes",
                "D) Final incorrect option to complete the multiple choice"
              ],
              correctAnswer: "A",
              explanation: `This is a sample explanation for the ${subject} question. In a real scenario, this would contain detailed reasoning for why option A is correct and why the other options are incorrect.`,
              subject: subject,
              difficulty: difficulty,
              examType: examType,
              questionType: questionType,
              _id: `mock_${Date.now()}`,
              aiGenerated: true,
              verified: false,
              tags: [examType, subject, difficulty],
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            // Send mock question with API error notice
            socket.emit('question:generated', {
              requestId,
              question: mockQuestion,
              geminiStats: geminiManager.getUsageStats(),
              notice: 'This is mock data - Gemini API needs to be enabled. See console for details.'
            });
          }
          
        } catch (error) {
          console.error('Error in question generation:', error);
          
          socket.emit('question:error', {
            requestId: data.requestId,
            error: 'Failed to generate question',
            code: 'GENERATION_ERROR'
          });
        }
      });
      
      // Handle contest joining
      socket.on('contest:join', async (data) => {
        try {
          const { contestId, userId } = data;
          
          const contest = await Contest.findById(contestId);
          if (!contest) {
            socket.emit('contest:error', {
              error: 'Contest not found'
            });
            return;
          }
          
          // Check if user is registered
          const participant = contest.participants.find(p => p.userId === userId);
          if (!participant) {
            socket.emit('contest:error', {
              error: 'User not registered for this contest'
            });
            return;
          }
          
          // Join contest room
          await socket.join(`contest:${contestId}`);
          socket.contestId = contestId;
          
          // Add to active participants list
          await addToSet(`contest:${contestId}:active`, userId);
          
          console.log(`User ${userId} joined contest ${contestId}`);
          
          // Send contest data
          socket.emit('contest:joined', {
            contest: {
              id: contest._id,
              title: contest.title,
              startTime: contest.startTime,
              endTime: contest.endTime,
              status: contest.status,
              totalQuestions: contest.totalQuestions,
              userProgress: {
                answersCount: participant.answers.length,
                score: participant.score,
                completed: participant.completed
              }
            }
          });
          
          // Broadcast to contest room about new participant
          socket.to(`contest:${contestId}`).emit('contest:participant_joined', {
            userId,
            username: socket.username,
            totalParticipants: contest.participants.length
          });
          
        } catch (error) {
          console.error('Error joining contest:', error);
          socket.emit('contest:error', {
            error: 'Failed to join contest'
          });
        }
      });
      
      // Handle contest answer submission
      socket.on('contest:submit_answer', async (data) => {
        try {
          const { contestId, questionId, answer, timeSpent, userId } = data;
          
          const contest = await Contest.findById(contestId);
          if (!contest) {
            socket.emit('contest:error', {
              error: 'Contest not found'
            });
            return;
          }
          
          // Find participant
          const participantIndex = contest.participants.findIndex(p => p.userId === userId);
          if (participantIndex === -1) {
            socket.emit('contest:error', {
              error: 'Participant not found'
            });
            return;
          }
          
          const participant = contest.participants[participantIndex];
          
          // Check if already answered
          const existingAnswer = participant.answers.find(a => a.questionId.toString() === questionId);
          if (existingAnswer) {
            socket.emit('contest:error', {
              error: 'Question already answered'
            });
            return;
          }
          
          // Get the correct answer from the question
          const question = await Question.findById(questionId);
          if (!question) {
            socket.emit('contest:error', {
              error: 'Question not found'
            });
            return;
          }
          
          const isCorrect = question.correctAnswer === answer;
          const contestQuestion = contest.questions.find(q => q.questionId.toString() === questionId);
          const points = isCorrect ? (contestQuestion?.points || 1) : 0;
          
          // Add answer
          participant.answers.push({
            questionId,
            answer,
            isCorrect,
            timeSpent,
            answeredAt: new Date()
          });
          
          participant.score += points;
          participant.totalTimeSpent += timeSpent;
          
          // Check if contest is completed
          if (participant.answers.length >= contest.totalQuestions) {
            participant.completed = true;
            participant.completedAt = new Date();
          }
          
          await contest.save();
          
          // Increment question usage
          await question.incrementUsage();
          
          // Send response to user
          socket.emit('contest:answer_submitted', {
            questionId,
            isCorrect,
            points,
            totalScore: participant.score,
            answersCount: participant.answers.length,
            completed: participant.completed
          });
          
          // Broadcast to contest room if user completed
          if (participant.completed) {
            await contest.calculateRankings();
            
            socket.to(`contest:${contestId}`).emit('contest:participant_completed', {
              userId,
              username: socket.username,
              score: participant.score,
              rank: participant.rank,
              totalTimeSpent: participant.totalTimeSpent
            });
          }
          
          // Send updated leaderboard
          const leaderboard = await Contest.getLeaderboard(contestId, 10);
          io.to(`contest:${contestId}`).emit('contest:leaderboard_update', leaderboard);
          
        } catch (error) {
          console.error('Error submitting answer:', error);
          socket.emit('contest:error', {
            error: 'Failed to submit answer'
          });
        }
      });
      
      // Handle real-time leaderboard requests
      socket.on('contest:get_leaderboard', async (data) => {
        try {
          const { contestId, limit = 10 } = data;
          
          const leaderboard = await Contest.getLeaderboard(contestId, limit);
          socket.emit('contest:leaderboard', leaderboard);
          
        } catch (error) {
          console.error('Error getting leaderboard:', error);
          socket.emit('contest:error', {
            error: 'Failed to get leaderboard'
          });
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`User disconnected: ${socket.id}`);
        
        if (socket.userId) {
          await removeFromSet('online_users', socket.userId);
          
          if (socket.contestId) {
            await removeFromSet(`contest:${socket.contestId}:active`, socket.userId);
            
            // Notify contest room about participant leaving
            socket.to(`contest:${socket.contestId}`).emit('contest:participant_left', {
              userId: socket.userId,
              username: socket.username
            });
          }
        }
      });
      
      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
    
    // Start WebSocket server
    server.listen(port, () => {
      console.log(`> WebSocket server ready on http://${hostname}:${port}`);
      console.log(`> Next.js app should be running on http://${hostname}:3000`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down WebSocket server gracefully');
      server.close(() => {
        console.log('WebSocket server closed');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('Failed to start WebSocket server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
