import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    // Return complete user data with all fields from MongoDB
    return NextResponse.json({
      success: true,
      message: "Complete user data retrieved successfully",
      user: {
        // Core identity
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        profession: user.profession,
        primaryGoal: user.primaryGoal,
        bio: user.bio,
        avatar: user.avatar,
        location: user.location,
        
        // Account details
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLoginTime,
        isAuthenticated: true,
        subscriptionPlan: user.subscription_plan || 'Free',
        emailVerified: user.emailVerified || false,
        
        // Gamification & Progress
        level: user.level || 1,
        xpPoints: user.xp_points || 0,
        streakCount: user.streak_count || 0,
        totalLessons: user.lessons ? user.lessons.length : 0,
        completedLessons: user.lessons ? user.lessons.filter(l => l.completed).length : 0,
        
        // Learning Analytics
        questionsAttempted: user.questions_attempted || 0,
        correctAnswers: user.correct_questions || 0,
        incorrectAnswers: (user.questions_attempted || 0) - (user.correct_questions || 0),
        accuracyRate: user.questions_attempted > 0 ? 
          Math.round((user.correct_questions / user.questions_attempted) * 100) : 0,
        averageSessionTime: user.average_session_time || 0,
        totalStudyTime: user.total_study_time || 0,
        
        // Detailed Progress
        lessons: user.lessons || [],
        questionsHistory: user.questions_history || [],
        achievements: user.achievements || [],
        badges: user.badges || [],
        
        // Learning Preferences
        preferredDifficulty: user.preferred_difficulty || 'medium',
        learningStyle: user.learning_style || 'visual',
        studyGoals: user.study_goals || [],
        dailyGoal: user.daily_goal || 30, // minutes
        
        // Social & Engagement
        friends: user.friends || [],
        mentorRequests: user.mentor_requests || [],
        competitions: user.competitions || [],
        
        // Performance Metrics
        weeklyProgress: user.weekly_progress || {},
        monthlyProgress: user.monthly_progress || {},
        strongSubjects: user.strong_subjects || [],
        weakSubjects: user.weak_subjects || [],
        
        // Recent Activity
        recentActivity: user.recent_activity || [],
        lastActiveDate: user.last_active_date,
        loginHistory: user.login_history || [],
        
        // Personalization
        preferences: user.preferences || {},
        notifications: user.notifications || {
          email: true,
          push: true,
          reminders: true
        },
        
        // Vector Data (for AI recommendations)
        embedding: user.embedding ? "Available" : "Not generated",
        
        // Subscription & Features
        features: {
          aiTutor: user.subscription_plan === 'Premium',
          unlimitedQuestions: user.subscription_plan === 'Premium',
          detailedAnalytics: user.subscription_plan === 'Premium',
          prioritySupport: user.subscription_plan === 'Premium'
        }
      },
      
      // Additional metadata
      meta: {
        dataFreshness: new Date().toISOString(),
        responseTime: Date.now(),
        apiVersion: "1.0",
        totalFields: Object.keys(user.toObject ? user.toObject() : user).length
      }
    });

  } catch (error) {
    console.error("Complete user data fetch error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to fetch complete user data",
        user: null,
        meta: {
          errorTime: new Date().toISOString(),
          apiVersion: "1.0"
        }
      },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}

// PUT method for updating user data
export async function PUT(request) {
  try {
    const user = await getAuthenticatedUser(request);
    const updateData = await request.json();
    
    // Import User model dynamically for Turbopack compatibility
    let User;
    try {
      const userModule = await import('@/lib/models/User');
      User = userModule.default;
    } catch (importError) {
      console.log("Direct import failed, trying alternative...");
      const mongoose = await import('mongoose');
      User = mongoose.models.User || mongoose.model('User');
    }
    
    // Define allowed fields for update
    const allowedFields = [
      'firstName', 'lastName', 'age', 'profession', 'primaryGoal', 
      'bio', 'avatar', 'location', 'learning_style', 'preferred_difficulty',
      'daily_goal', 'study_goals', 'preferences', 'notifications'
    ];
    
    // Filter update data to only include allowed fields
    const filteredUpdate = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdate[key] = updateData[key];
      }
    });
    
    // Add timestamp
    filteredUpdate.updatedAt = new Date();
    
    // Update user data
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      filteredUpdate,
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        error: "User not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "User data updated successfully",
      updatedFields: Object.keys(filteredUpdate),
      user: {
        // Core identity
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        age: updatedUser.age,
        profession: updatedUser.profession,
        primaryGoal: updatedUser.primaryGoal,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
        location: updatedUser.location,
        
        // Learning preferences
        learningStyle: updatedUser.learning_style,
        preferredDifficulty: updatedUser.preferred_difficulty,
        dailyGoal: updatedUser.daily_goal,
        studyGoals: updatedUser.study_goals,
        
        // Settings
        preferences: updatedUser.preferences,
        notifications: updatedUser.notifications,
        
        // Timestamps
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      },
      meta: {
        updateTime: new Date().toISOString(),
        fieldsUpdated: Object.keys(filteredUpdate).length - 1, // -1 for updatedAt
        apiVersion: "1.0"
      }
    });

  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to update user data",
        details: error.name === 'ValidationError' ? error.errors : null
      },
      { status: error.name === 'ValidationError' ? 400 : 500 }
    );
  }
}
