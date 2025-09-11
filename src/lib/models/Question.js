import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  examType: {
    type: String,
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true,
    index: true
  },
  questionType: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer', 'essay'],
    required: true,
    default: 'multiple-choice'
  },
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    index: true
  }],
  aiGenerated: {
    type: Boolean,
    default: true
  },
  geminiKeyIndex: {
    type: Number,
    default: 0
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  verified: {
    type: Boolean,
    default: false
  },
  reportedIssues: [{
    type: {
      type: String,
      enum: ['incorrect-answer', 'unclear-question', 'typo', 'inappropriate-content']
    },
    description: String,
    reportedBy: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  indexes: [
    { examType: 1, subject: 1, difficulty: 1 },
    { examType: 1, difficulty: 1 },
    { usageCount: -1 },
    { lastUsed: -1 }
  ]
});

// Pre-save middleware to update lastUsed when usageCount is incremented
QuestionSchema.pre('save', function(next) {
  if (this.isModified('usageCount')) {
    this.lastUsed = new Date();
  }
  next();
});

// Instance method to increment usage
QuestionSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Static method to find questions by criteria
QuestionSchema.statics.findByCriteria = function(examType, subject, difficulty, limit = 10) {
  return this.find({
    examType: examType,
    subject: subject,
    difficulty: difficulty,
    verified: true
  }).limit(limit).sort({ usageCount: 1, createdAt: -1 });
};

// Static method to get random questions
QuestionSchema.statics.getRandomQuestions = function(examType, subject, difficulty, count = 1) {
  return this.aggregate([
    {
      $match: {
        examType: examType,
        subject: subject,
        difficulty: difficulty,
        verified: true
      }
    },
    { $sample: { size: count } }
  ]);
};

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema);
