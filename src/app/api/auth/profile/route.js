import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    
    // Return user profile data
    return NextResponse.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        profession: user.profession,
        primaryGoal: user.primaryGoal,
        avatar: user.avatar,
        bio: user.bio,
        vectorEmbedding: user.vector_embedding,
        // Learning analytics
        activedays: user.active_days,
        totalActiveDays: user.total_active_days,
        score: user.score,
        gameScore: user.game_score,
        rank: user.rank,
        level: user.level,
        xpPoints: user.xp_points,
        streakCount: user.streak_count,
        subscriptionPlan: user.subscription_plan,
        badgesEarned: user.badges_earned,
        // Timestamps
        createdAt: user.created_at,
        lastLogin: user.last_login_time,
        lastDateLogin: user.last_date_login
      }
    });

  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user profile" },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await getUserFromToken(request);
    const reqBody = await request.json();
    
    // Allow updating specific profile fields
    const allowedFields = ['firstName', 'lastName', 'age', 'profession', 'primaryGoal', 'bio', 'avatar'];
    const updates = {};
    
    allowedFields.forEach(field => {
      if (reqBody[field] !== undefined) {
        updates[field] = reqBody[field];
      }
    });
    
    // Update user
    Object.assign(user, updates);
    user.updated_at = new Date();
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        profession: user.profession,
        primaryGoal: user.primaryGoal,
        bio: user.bio,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: error.message.includes('Authentication') ? 401 : 500 }
    );
  }
}
