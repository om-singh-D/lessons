import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Create response
    const response = NextResponse.json({
      message: "Logout successful",
      success: true
    });

    // Clear the token cookie
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0) // Set the cookie to expire immediately
    });

    return response;

  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during logout" },
      { status: 500 }
    );
  }
}

// Also support GET method for logout
export async function GET() {
  return POST();
}
