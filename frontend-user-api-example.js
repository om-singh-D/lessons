// Frontend utility functions to access user data from MongoDB
// Save this as utils/userAPI.js in your frontend

class UserAPI {
  constructor() {
    this.baseURL = process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000';
  }

  // Get auth token from localStorage
  getAuthToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  // Get auth headers
  getAuthHeaders() {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Get simplified user info (recommended for most use cases)
  async getUserInfo() {
    try {
      const response = await fetch(`${this.baseURL}/api/user/info`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          user: data.user
        };
      } else {
        throw new Error(data.error || 'Failed to fetch user info');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get complete user data with all analytics
  async getCompleteUserData() {
    try {
      const response = await fetch(`${this.baseURL}/api/user`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          userData: data.data
        };
      } else {
        throw new Error(data.error || 'Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching complete user data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update user profile
  async updateUserProfile(updateData) {
    try {
      const response = await fetch(`${this.baseURL}/api/user`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          user: data.data
        };
      } else {
        throw new Error(data.error || 'Failed to update user profile');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get existing profile data (compatibility with existing endpoint)
  async getProfile() {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          profile: data.data
        };
      } else {
        throw new Error(data.error || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export for use in components
export default new UserAPI();

// Example usage in a React component:
/*
import UserAPI from './utils/userAPI';

function UserDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      const result = await UserAPI.getUserInfo();
      if (result.success) {
        setUser(result.user);
        
        // Store in localStorage for quick access
        localStorage.setItem('username', result.user.username);
        localStorage.setItem('email', result.user.email);
        localStorage.setItem('firstName', result.user.firstName);
        localStorage.setItem('userId', result.user.id);
      }
      setLoading(false);
    }
    
    loadUserData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Please login</div>;

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <p>Email: {user.email}</p>
      <p>Username: {user.username}</p>
      <p>Level: {user.level}</p>
      <p>XP Points: {user.xpPoints}</p>
      <p>Accuracy Rate: {user.accuracyRate}%</p>
    </div>
  );
}
*/
