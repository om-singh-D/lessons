import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Helper function to create vector embedding from user profile
function createUserVectorEmbedding(userProfile) {
  // Simple vector embedding based on user profile characteristics
  // In a real implementation, you might use ML models for better embeddings
  const { age, profession, primaryGoal } = userProfile;
  
  // Create a simple vector based on user characteristics
  const vector = [];
  
  // Age-based features (normalized to 0-1)
  vector.push(Math.min(age / 100, 1)); // Age factor
  
  // Profession-based features (simple encoding)
  const professionMap = {
    'student': [1, 0, 0, 0, 0],
    'developer': [0, 1, 0, 0, 0],
    'teacher': [0, 0, 1, 0, 0],
    'engineer': [0, 0, 0, 1, 0],
    'other': [0, 0, 0, 0, 1]
  };
  
  const professionVector = professionMap[profession.toLowerCase()] || professionMap['other'];
  vector.push(...professionVector);
  
  // Goal-based features
  const goalMap = {
    'learn new skills': [1, 0, 0, 0],
    'career advancement': [0, 1, 0, 0],
    'exam preparation': [0, 0, 1, 0],
    'personal growth': [0, 0, 0, 1]
  };
  
  const goalVector = goalMap[primaryGoal.toLowerCase()] || [0.5, 0.5, 0.5, 0.5];
  vector.push(...goalVector);
  
  return vector;
}

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
    const { username, email, firstName, age, profession, primaryGoal, password } = reqBody;

    console.log("Received signup request:", { username, email, firstName, age, profession, primaryGoal });

    // Validate required fields
    if (!username || !email || !firstName || !age || !profession || !primaryGoal || !password) {
      return NextResponse.json(
        { error: "All fields are required: username, email, firstName, age, profession, primaryGoal, password" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate age
    if (isNaN(age) || age < 13 || age > 120) {
      return NextResponse.json(
        { error: "Age must be a number between 13 and 120" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists (email or username)
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username }]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        );
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create vector embedding
    const vectorEmbedding = createUserVectorEmbedding({ age, profession, primaryGoal });

    // Create new user
    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      age: parseInt(age),
      profession,
      primaryGoal,
      vector_embedding: vectorEmbedding,
      createdAt: new Date(),  // Changed from created_at to createdAt
      updatedAt: new Date(),  // Changed from updated_at to updatedAt
      lastLoginTime: new Date(),  // Changed from last_login_time to lastLoginTime
      lastDateLogin: new Date().toISOString().split('T')[0]  // Changed from last_date_login to lastDateLogin
    });

    console.log("About to save user with data:", JSON.stringify(newUser.toObject(), null, 2));
    await newUser.save();
    console.log("User saved successfully:", newUser._id);

    // Generate JWT token
    const tokenData = {
      id: newUser._id,
      email: newUser.email,
      username: newUser.username
    };

    const token = jwt.sign(
      tokenData,
      process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // Create response
    const response = NextResponse.json({
      message: "User created successfully",
      success: true,
      token: token, // Include token in response body
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        age: newUser.age,
        profession: newUser.profession,
        primaryGoal: newUser.primaryGoal
      }
    }, { status: 201 });

    // Set httpOnly cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return response;

  } catch (error) {
    console.error("Signup error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Log specific error info for validation errors
    if (error.errInfo) {
      console.error("Validation error info:", JSON.stringify(error.errInfo, null, 2));
    }
    
    // Provide more detailed error information for validation errors
    let errorMessage = error.message || "An error occurred during signup";
    let errorDetails = {};
    
    if (error.name === 'ValidationError') {
      errorDetails.validationErrors = error.errors;
      errorMessage = "Validation failed";
    } else if (error.code === 121) {
      // MongoDB document validation error
      errorDetails.mongoValidation = error.errInfo;
      errorMessage = "Document failed validation";
    } else if (error.code === 11000) {
      // Duplicate key error
      errorMessage = "User with this email or username already exists";
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        fullError: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
