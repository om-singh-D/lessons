import mongoose from 'mongoose';

const ContestQuestionSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  points: {
    type: Number,
    default: 1
  },
  timeLimit: {
    type: Number, // in seconds
    default: 60
  }
});

const ContestParticipantSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    answer: {
      type: String,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    timeSpent: {
      type: Number, // in seconds
      required: true
    },
    answeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  score: {
    type: Number,
    default: 0
  },
  totalTimeSpent: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  }
});

const ContestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  examType: {
    type: String,
    required: true,
    index: true
  },
  subjects: [{
    type: String,
    required: true
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    required: true
  },
  questions: [ContestQuestionSchema],
  participants: [ContestParticipantSchema],
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true,
    index: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  maxParticipants: {
    type: Number,
    default: 1000
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  registrationDeadline: {
    type: Date
  },
  createdBy: {
    type: String,
    required: true
  },
  prizes: [{
    position: Number,
    description: String,
    value: String
  }],
  rules: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming',
    index: true
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  topScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  indexes: [
    { examType: 1, status: 1 },
    { startTime: 1, endTime: 1 },
    { isActive: 1, isPublic: 1 },
    { 'participants.score': -1 }
  ]
});

// Pre-save middleware to update contest statistics
ContestSchema.pre('save', function(next) {
  if (this.isModified('questions')) {
    this.totalQuestions = this.questions.length;
  }
  
  if (this.isModified('participants')) {
    const completedParticipants = this.participants.filter(p => p.completed);
    if (completedParticipants.length > 0) {
      const scores = completedParticipants.map(p => p.score);
      this.averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      this.topScore = Math.max(...scores);
    }
  }
  
  // Update status based on current time
  const now = new Date();
  if (now < this.startTime) {
    this.status = 'upcoming';
  } else if (now >= this.startTime && now <= this.endTime) {
    this.status = 'ongoing';
  } else {
    this.status = 'completed';
  }
  
  next();
});

// Instance method to add participant
ContestSchema.methods.addParticipant = function(userId, username, email) {
  // Check if user already registered
  const existingParticipant = this.participants.find(p => p.userId === userId);
  if (existingParticipant) {
    throw new Error('User already registered for this contest');
  }
  
  // Check if contest is full
  if (this.participants.length >= this.maxParticipants) {
    throw new Error('Contest is full');
  }
  
  // Check registration deadline
  if (this.registrationDeadline && new Date() > this.registrationDeadline) {
    throw new Error('Registration deadline has passed');
  }
  
  this.participants.push({
    userId,
    username,
    email,
    joinedAt: new Date(),
    answers: [],
    score: 0,
    totalTimeSpent: 0,
    completed: false
  });
  
  return this.save();
};

// Instance method to submit answer
ContestSchema.methods.submitAnswer = function(userId, questionId, answer, timeSpent) {
  const participant = this.participants.find(p => p.userId === userId);
  if (!participant) {
    throw new Error('Participant not found');
  }
  
  if (participant.completed) {
    throw new Error('Contest already completed by participant');
  }
  
  // Check if question exists in contest
  const contestQuestion = this.questions.find(q => q.questionId.toString() === questionId);
  if (!contestQuestion) {
    throw new Error('Question not found in contest');
  }
  
  // Check if already answered
  const existingAnswer = participant.answers.find(a => a.questionId.toString() === questionId);
  if (existingAnswer) {
    throw new Error('Question already answered');
  }
  
  // Add answer (isCorrect will be determined by comparing with actual question)
  participant.answers.push({
    questionId,
    answer,
    isCorrect: false, // Will be updated when we have the correct answer
    timeSpent,
    answeredAt: new Date()
  });
  
  participant.totalTimeSpent += timeSpent;
  
  return this.save();
};

// Instance method to calculate rankings
ContestSchema.methods.calculateRankings = function() {
  // Sort participants by score (descending) and then by total time spent (ascending)
  const sortedParticipants = this.participants
    .filter(p => p.completed)
    .sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher score is better
      }
      return a.totalTimeSpent - b.totalTimeSpent; // Less time is better for same score
    });
  
  // Assign ranks
  sortedParticipants.forEach((participant, index) => {
    participant.rank = index + 1;
  });
  
  return this.save();
};

// Static method to get active contests
ContestSchema.statics.getActiveContests = function(examType = null) {
  const query = { isActive: true, status: { $in: ['upcoming', 'ongoing'] } };
  if (examType) {
    query.examType = examType;
  }
  return this.find(query).sort({ startTime: 1 });
};

// Static method to get leaderboard
ContestSchema.statics.getLeaderboard = function(contestId, limit = 10) {
  return this.findById(contestId)
    .select('participants title examType')
    .then(contest => {
      if (!contest) return null;
      
      const leaderboard = contest.participants
        .filter(p => p.completed)
        .sort((a, b) => {
          if (a.score !== b.score) return b.score - a.score;
          return a.totalTimeSpent - b.totalTimeSpent;
        })
        .slice(0, limit)
        .map((p, index) => ({
          rank: index + 1,
          username: p.username,
          score: p.score,
          totalTimeSpent: p.totalTimeSpent,
          completedAt: p.completedAt
        }));
      
      return {
        contestTitle: contest.title,
        examType: contest.examType,
        leaderboard
      };
    });
};

export default mongoose.models.Contest || mongoose.model('Contest', ContestSchema);
