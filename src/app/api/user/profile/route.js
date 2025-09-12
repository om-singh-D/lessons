import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

// GET user profile (core identity data)
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request);
    
    return NextResponse.json({
      success: true,
      message: "User profile retrieved successfully",
      profile: {
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
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        subscriptionPlan: user.subscription_plan || 'Free'
      }
    });

  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to fetch user profile"
      },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}

// PUT update user profile (core identity data)
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
    
    // Define allowed profile fields for update
    const allowedProfileFields = [
      'firstName', 'lastName', 'age', 'profession', 
      'primaryGoal', 'bio', 'avatar', 'location'
    ];
    
    // Filter update data to only include allowed profile fields
    const filteredUpdate = {};
    Object.keys(updateData).forEach(key => {
      if (allowedProfileFields.includes(key)) {
        filteredUpdate[key] = updateData[key];
      }
    });
    
    if (Object.keys(filteredUpdate).length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid profile fields provided for update",
        allowedFields: allowedProfileFields
      }, { status: 400 });
    }
    
    // Add timestamp
    filteredUpdate.updatedAt = new Date();
    
    // Update user profile
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
      message: "User profile updated successfully",
      updatedFields: Object.keys(filteredUpdate).filter(f => f !== 'updatedAt'),
      profile: {
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
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        subscriptionPlan: updatedUser.subscription_plan || 'Free'
      }
    });

  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to update user profile",
        details: error.name === 'ValidationError' ? error.errors : null
      },
      { status: error.name === 'ValidationError' ? 400 : 500 }
    );
  }
}
