import mongoose from 'mongoose';

const LessonActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['reading', 'exercise', 'video', 'discussion', 'project', 'quiz', 'practice'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  content: {
    type: String,
    required: true
  },
  materials: [{
    type: String
  }],
  instructions: {
    type: String
  }
});

const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  gradeLevel: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  teachingObjectives: [{
    type: String,
    required: true
  }],
  keyConcepts: [{
    concept: {
      type: String,
      required: true
    },
    explanation: {
      type: String,
      required: true
    },
    examples: [{
      type: String
    }]
  }],
  lessonOutline: {
    introduction: {
      type: String,
      required: true
    },
    mainContent: {
      type: String,
      required: true
    },
    conclusion: {
      type: String,
      required: true
    }
  },
  activities: [LessonActivitySchema],
  homework: {
    assignments: [{
      title: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      dueDate: {
        type: String
      },
      estimatedTime: {
        type: Number // in minutes
      }
    }],
    readingMaterials: [{
      title: {
        type: String
      },
      source: {
        type: String
      },
      pages: {
        type: String
      }
    }]
  },
  resources: {
    textbooks: [{
      title: {
        type: String
      },
      author: {
        type: String
      },
      chapters: {
        type: String
      }
    }],
    onlineResources: [{
      title: {
        type: String
      },
      url: {
        type: String
      },
      description: {
        type: String
      }
    }],
    multimedia: [{
      type: {
        type: String,
        enum: ['video', 'audio', 'image', 'interactive']
      },
      title: {
        type: String
      },
      url: {
        type: String
      },
      description: {
        type: String
      }
    }],
    additionalMaterials: [{
      type: String
    }]
  },
  assessment: {
    formativeAssessment: [{
      type: {
        type: String,
        enum: ['quiz', 'discussion', 'observation', 'exit_ticket', 'peer_review']
      },
      description: {
        type: String
      },
      criteria: [{
        type: String
      }]
    }],
    summativeAssessment: [{
      type: {
        type: String,
        enum: ['test', 'project', 'presentation', 'essay', 'portfolio']
      },
      description: {
        type: String
      },
      rubric: [{
        criteria: {
          type: String
        },
        levels: [{
          level: {
            type: String
          },
          description: {
            type: String
          },
          points: {
            type: Number
          }
        }]
      }]
    }]
  },
  differentiation: {
    forAdvancedLearners: [{
      type: String
    }],
    forStruggling: [{
      type: String
    }],
    forELL: [{ // English Language Learners
      type: String
    }],
    forSpecialNeeds: [{
      type: String
    }]
  },
  standards: [{
    standardType: {
      type: String // e.g., "Common Core", "Next Generation Science Standards"
    },
    standardCode: {
      type: String
    },
    description: {
      type: String
    }
  }],
  tags: [{
    type: String
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastEdited: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 1
  }
});

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  
  // Profile Information
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  age: {
    type: Number,
    min: 13,
    max: 120
  },
  profession: {
    type: String
  },
  primaryGoal: {
    type: String
  },
  avatar: {
    type: String
  },
  bio: {
    type: String
  },
  
  // Learning Analytics
  active_days: {
    type: Number,
    default: 1
  },
  total_active_days: {
    type: Number,
    default: 1
  },
  heatmap_matrix: {
    type: Map,
    of: Number,
    default: new Map()
  },
  vector_embedding: [{
    type: Number
  }],
  score: {
    type: Number,
    default: 0
  },
  game_score: {
    type: Number,
    default: 0
  },
  strong_topics: [{
    type: String
  }],
  weaker_topics: [{
    type: String
  }],
  no_of_contest_attempted: {
    type: Number,
    default: 0
  },
  correct_questions: {
    type: Number,
    default: 0
  },
  questions_attempted: {
    type: Number,
    default: 0
  },
  cheating_warning: {
    type: Boolean,
    default: false
  },
  ip_address: {
    type: String
  },
  topics_solved: [{
    type: String
  }],
  yt_links_for_weaker_topics: [{
    type: String
  }],
  
  // Social Features
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friends_count: {
    type: Number,
    default: 0
  },
  friendsof: {
    type: Number,
    default: 0
  },
  
  // Learning Analytics
  average_session_duration: {
    type: Number,
    default: 0
  },
  time_spent_per_topic: {
    type: Map,
    of: Number,
    default: new Map()
  },
  learning_style: {
    type: String,
    enum: ['Visual', 'Auditory', 'Kinesthetic', 'Mixed'],
    default: 'Mixed'
  },
  recommended_topics: [{
    type: String
  }],
  
  // Subscription & Gamification
  subscription_plan: {
    type: String,
    enum: ['Free', 'Premium', 'Pro'],
    default: 'Free'
  },
  rank: {
    type: Number,
    default: 0
  },
  streak_count: {
    type: Number,
    default: 0
  },
  xp_points: {
    type: Number,
    default: 100
  },
  level: {
    type: Number,
    default: 2
  },
  badges_earned: [{
    type: String,
    default: ['First Login']
  }],
  leaderboard_position: {
    type: Number,
    default: 0
  },
  
  // Lesson Creator Feature
  lessons: [LessonSchema],
  
  // Exams
  exams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest'
  }],
  
  // Login History
  login_history: [{
    ip_address: {
      type: String
    },
    device: {
      type: String,
      default: 'Unknown'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastLoginTime: {  // Changed from last_login_time to lastLoginTime
    type: Date,
    default: Date.now
  },
  lastDateLogin: {  // Changed from last_date_login to lastDateLogin
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  },
  
  // Computed Fields
  accuracy_rate: {
    type: Number,
    default: 0
  },
  completion_rate: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {  // Changed from created_at to createdAt
    type: Date,
    default: Date.now
  },
  updatedAt: {  // Changed from updated_at to updatedAt
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for user ID
UserSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ 'lessons.topic': 1 });
UserSchema.index({ 'lessons.gradeLevel': 1 });
UserSchema.index({ 'lessons.subject': 1 });
UserSchema.index({ 'lessons.createdAt': -1 });

// Pre-save middleware to update timestamps
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();  // Changed from updated_at to updatedAt
  if (this.isModified('lessons')) {
    const lesson = this.lessons[this.lessons.length - 1];
    if (lesson && lesson.isNew) {
      lesson.updatedAt = new Date();
      lesson.lastEdited = new Date();
    }
  }
  next();
});

// Method to calculate accuracy rate
UserSchema.methods.calculateAccuracyRate = function() {
  if (this.questions_attempted === 0) return 0;
  return (this.correct_questions / this.questions_attempted) * 100;
};

// Method to calculate completion rate
UserSchema.methods.calculateCompletionRate = function() {
  // This would be based on courses/lessons completed vs enrolled
  return this.completion_rate;
};

// Method to add a new lesson
UserSchema.methods.addLesson = function(lessonData) {
  const lesson = {
    ...lessonData,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastEdited: new Date(),
    version: 1
  };
  
  this.lessons.push(lesson);
  return this.lessons[this.lessons.length - 1];
};

// Method to update a lesson
UserSchema.methods.updateLesson = function(lessonId, updateData) {
  const lesson = this.lessons.id(lessonId);
  if (!lesson) {
    throw new Error('Lesson not found');
  }
  
  Object.assign(lesson, updateData);
  lesson.updatedAt = new Date();
  lesson.lastEdited = new Date();
  lesson.version += 1;
  
  return lesson;
};

// Method to delete a lesson
UserSchema.methods.deleteLesson = function(lessonId) {
  const lesson = this.lessons.id(lessonId);
  if (!lesson) {
    throw new Error('Lesson not found');
  }
  
  lesson.remove();
  return true;
};

// Method to get lessons by criteria
UserSchema.methods.getLessons = function(criteria = {}) {
  let lessons = this.lessons;
  
  if (criteria.topic) {
    lessons = lessons.filter(lesson => 
      lesson.topic.toLowerCase().includes(criteria.topic.toLowerCase())
    );
  }
  
  if (criteria.gradeLevel) {
    lessons = lessons.filter(lesson => 
      lesson.gradeLevel === criteria.gradeLevel
    );
  }
  
  if (criteria.subject) {
    lessons = lessons.filter(lesson => 
      lesson.subject.toLowerCase().includes(criteria.subject.toLowerCase())
    );
  }
  
  if (criteria.difficulty) {
    lessons = lessons.filter(lesson => 
      lesson.difficulty === criteria.difficulty
    );
  }
  
  if (criteria.tags && criteria.tags.length > 0) {
    lessons = lessons.filter(lesson => 
      lesson.tags.some(tag => criteria.tags.includes(tag))
    );
  }
  
  // Sort by most recent first
  return lessons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
