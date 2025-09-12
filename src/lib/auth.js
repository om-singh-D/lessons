import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

/**
 * Verify JWT token from cookie or Authorization header
 */
export function verifyToken(token) {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    // Handle Bearer token format
    if (token.startsWith('Bearer ')) {
      token = token.substring(7);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'fallback-secret-key');
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get token from request (cookie or header)
 */
export function getTokenFromRequest(request) {
  // Try to get token from cookie first
  const tokenFromCookie = request.cookies.get('token')?.value;
  if (tokenFromCookie) {
    return tokenFromCookie;
  }

  // Try to get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(request) {
  try {
    await connectDB();
    
    const token = getTokenFromRequest(request);
    if (!token) {
      throw new Error('No authentication token found');
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

/**
 * Middleware function for protecting routes
 */
export function withAuth(handler) {
  return async (request, context) => {
    try {
      const user = await getAuthenticatedUser(request);
      
      // Add user to request context
      request.user = user;
      
      return await handler(request, context);
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required', 
          message: error.message 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * Create JWT token
 */
export function createToken(payload) {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

/**
 * Validate user permissions (for future use)
 */
export function checkPermissions(user, requiredRole = 'user') {
  // Basic role checking - can be extended
  const userRole = user.role || 'user';
  
  const roleHierarchy = {
    'user': 1,
    'premium': 2,
    'admin': 3,
    'super_admin': 4
  };

  const userLevel = roleHierarchy[userRole] || 1;
  const requiredLevel = roleHierarchy[requiredRole] || 1;

  return userLevel >= requiredLevel;
}

// Export helper function for use in API routes
export async function getUserFromToken(request) {
  return await getAuthenticatedUser(request);
}
