import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/auth";

export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    
    return NextResponse.json({
      success: true,
      valid: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        valid: false,
        error: error.message 
      },
      { status: 401 }
    );
  }
}
