import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    await connectDB();
    
    // Get User model - ensure it's properly imported after DB connection
    let User;
    try {
      User = mongoose.models.User || mongoose.model('User', (await import("@/lib/models/User")).UserSchema);
    } catch (modelError) {
      // Fallback - direct import
      const userModule = await import("@/lib/models/User");
      User = userModule.default;
    }
    
    // Verify User model has required methods
    if (!User || typeof User.findOne !== 'function') {
      console.error('User model not properly loaded:', User);
      throw new Error('User model not available');
    }
    
    const reqBody = await request.json();
    const { identifier, password } = reqBody; // identifier can be email or username

    console.log("Received login request:", { identifier });

    // Validate required fields
    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Both identifier (email or username) and password are required" },
        { status: 400 }
      );
    }

    // Check if user exists by email or username
    // The identifier could be either email or username
    const isEmail = identifier.includes('@');
    
    let user;
    if (isEmail) {
      user = await User.findOne({ email: identifier.toLowerCase() });
    } else {
      user = await User.findOne({ username: identifier });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Update last login information
    user.lastLoginTime = new Date(); // Changed from last_login_time
    user.lastDateLogin = new Date().toISOString().split('T')[0]; // Changed from last_date_login
    user.updatedAt = new Date(); // Changed from updated_at
    
    // Add to login history if the field exists
    if (user.login_history) {
      user.login_history.push({
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        device: request.headers.get('user-agent') || 'Unknown',
        timestamp: new Date()
      });
      
      // Keep only last 10 login records
      if (user.login_history.length > 10) {
        user.login_history = user.login_history.slice(-10);
      }
    }
    
    await user.save();

    // Generate JWT token
    const tokenData = {
      id: user._id,
      email: user.email,
      username: user.username
    };

    const token = jwt.sign(
      tokenData,
      process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // Create response
    const response = NextResponse.json({
      message: "Login successful",
      success: true,
      token: token, // Include token in response body
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        age: user.age,
        profession: user.profession,
        primaryGoal: user.primaryGoal,
        lastLogin: user.lastLoginTime // Changed from last_login_time
      }
    });

    // Set httpOnly cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during login" },
      { status: 500 }
    );
  }
}
