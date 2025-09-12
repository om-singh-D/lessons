import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

// GET user settings and preferences
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    return NextResponse.json({
      success: true,
      message: "User settings retrieved successfully",
      settings: {
        // Learning preferences
        learningStyle: user.learning_style || 'Mixed',
        preferredDifficulty: user.preferred_difficulty || 'medium',
        dailyGoal: user.daily_goal || 30,
        studyGoals: user.study_goals || [],
        
        // Notifications
        notifications: user.notifications || {
          email: true,
          push: true,
          reminders: true
        },
        
        // General preferences
        preferences: user.preferences || {},
        
        // Account settings
        subscriptionPlan: user.subscription_plan || 'Free',
        emailVerified: user.emailVerified || false,
        
        // Timestamps
        updatedAt: user.updatedAt
      }
    });

  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to fetch user settings"
      },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}

// PUT update user settings and preferences
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
    
    // Define allowed settings fields for update
    const allowedSettingsFields = [
      'learning_style', 'preferred_difficulty', 'daily_goal', 
      'study_goals', 'notifications', 'preferences'
    ];
    
    // Filter update data to only include allowed settings fields
    const filteredUpdate = {};
    Object.keys(updateData).forEach(key => {
      if (allowedSettingsFields.includes(key)) {
        filteredUpdate[key] = updateData[key];
      }
    });
    
    if (Object.keys(filteredUpdate).length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid settings fields provided for update",
        allowedFields: allowedSettingsFields
      }, { status: 400 });
    }
    
    // Add timestamp
    filteredUpdate.updatedAt = new Date();
    
    // Update user settings
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
      message: "User settings updated successfully",
      updatedFields: Object.keys(filteredUpdate).filter(f => f !== 'updatedAt'),
      settings: {
        // Learning preferences
        learningStyle: updatedUser.learning_style || 'Mixed',
        preferredDifficulty: updatedUser.preferred_difficulty || 'medium',
        dailyGoal: updatedUser.daily_goal || 30,
        studyGoals: updatedUser.study_goals || [],
        
        // Notifications
        notifications: updatedUser.notifications || {
          email: true,
          push: true,
          reminders: true
        },
        
        // General preferences
        preferences: updatedUser.preferences || {},
        
        // Account settings
        subscriptionPlan: updatedUser.subscription_plan || 'Free',
        emailVerified: updatedUser.emailVerified || false,
        
        // Timestamps
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to update user settings",
        details: error.name === 'ValidationError' ? error.errors : null
      },
      { status: error.name === 'ValidationError' ? 400 : 500 }
    );
  }
}
