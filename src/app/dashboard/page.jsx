"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Link from 'next/link';
import { 
  BellIcon, 
  BarChart2, 
  TrendingUp, 
  LayoutDashboard, 
  Home,
  User, 
  Settings, 
  LogOut,
  Menu,
  X,
  Calendar,
  Target,
  Zap,
  Trophy,
  Activity,
  BookOpen,
  CheckCircle,
  Clock,
  Moon,
  Sun,
  RefreshCw,
  MapPin
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// API Configuration
const API_BASE_URL = 'http://localhost:3000'; // Fixed port from 3001 to 3000

// API service
const apiService = {
  async makeRequest(endpoint, options = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for httpOnly JWT
    };

    // Add Authorization header if token exists in localStorage
    if (token) {
      defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async getUserProfile() {
    const response = await this.makeRequest('/api/auth/profile'); // Fixed endpoint
    console.log('API Response - User Profile:', response);
    return response;
  },

  async verifyToken() {
    return this.makeRequest('/api/auth/verify'); // Fixed endpoint
  },

  async logout() {
    return this.makeRequest('/api/auth/logout', { method: 'POST' }); // Fixed endpoint
  }
};

// Generate enhanced activity data from heatmap_matrix
const generateActivityDataFromHeatmap = (heatmapMatrix) => {
  if (!heatmapMatrix || Object.keys(heatmapMatrix).length === 0) {
    // Generate fallback data if no heatmap exists
    const data = {};
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseActivity = isWeekend ? 1 : 2;
      data[dateString] = Math.max(0, baseActivity + Math.floor(Math.random() * 2));
    }
    return data;
  }
  return heatmapMatrix;
};

// Enhanced Activity Heatmap Component
const ActivityHeatmap = ({ heatmapData, isDarkMode }) => {
  const daysInYear = 365;
  const activityData = useMemo(() => generateActivityDataFromHeatmap(heatmapData), [heatmapData]);
  const today = new Date();
  
  const days = Array.from({ length: daysInYear }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (daysInYear - 1 - i));
    return date;
  });

  const months = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let currentMonth = -1;
  
  days.forEach((date, index) => {
    if (date.getMonth() !== currentMonth) {
      currentMonth = date.getMonth();
      months.push({
        name: monthNames[currentMonth],
        index: Math.floor(index / 7) * 7
      });
    }
  });

  const getHeatmapColor = (count) => {
    if (isDarkMode) {
      const colors = [
        'bg-zinc-900/50 border-zinc-800/50',
        'bg-emerald-900/40 border-emerald-800/50',
        'bg-emerald-700/60 border-emerald-600/50',
        'bg-emerald-600/80 border-emerald-500/50',
        'bg-emerald-500 border-emerald-400/50'
      ];
      return colors[Math.min(count, 4)];
    } else {
      const colors = [
        'bg-gray-100 border-gray-200',
        'bg-emerald-100 border-emerald-200',
        'bg-emerald-300 border-emerald-400',
        'bg-emerald-500 border-emerald-600',
        'bg-emerald-700 border-emerald-800'
      ];
      return colors[Math.min(count, 4)];
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-flow-col gap-0.5" style={{ gridTemplateColumns: `repeat(${Math.ceil(daysInYear / 7)}, 1fr)` }}>
        {months.map((month, i) => (
          <div key={i} className={`text-xs ${isDarkMode ? 'text-zinc-500' : 'text-gray-600'} text-center`} style={{ gridColumnStart: Math.floor(month.index / 7) + 1 }}>
            {month.name}
          </div>
        ))}
      </div>
      
      <div className={`flex items-center justify-between ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
        <span className="text-sm font-medium">Study Activity</span>
        <div className="flex items-center gap-2 text-xs">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`h-3 w-3 rounded-sm border transition-all duration-200 ${getHeatmapColor(i)}`} 
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
      
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
        {days.map((date) => {
          const dateString = date.toISOString().split('T')[0];
          const activityCount = activityData[dateString] || 0;
          return (
            <TooltipProvider key={dateString}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={`h-3 w-3 rounded-sm border transition-all duration-200 hover:ring-2 hover:ring-emerald-400/50 cursor-pointer ${getHeatmapColor(activityCount)}`}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    {date.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs opacity-75">
                    {activityCount} {activityCount === 1 ? 'session' : 'sessions'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};

// Enhanced Rating Chart Component
const RatingChart = ({ userData, isDarkMode }) => {
  // Generate mock rating progression based on user data
  const generateRatingData = () => {
    const currentScore = userData?.score || 0;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    
    return months.map((month, index) => ({
      name: month,
      rating: Math.max(0, currentScore - (months.length - index - 1) * 50 + Math.random() * 100),
      practice: Math.max(0, currentScore - (months.length - index - 1) * 30 + Math.random() * 80)
    }));
  };

  const ratingData = useMemo(() => generateRatingData(), [userData?.score]);

  const chartConfig = {
    rating: {
      label: "Rating",
      color: isDarkMode ? "#6366f1" : "#4f46e5",
    },
    practice: {
      label: "Practice Score",
      color: isDarkMode ? "#8b5cf6" : "#7c3aed",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={ratingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartConfig.rating.color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={chartConfig.rating.color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDarkMode ? "#374151" : "#e5e7eb"} 
            opacity={0.3} 
          />
          <XAxis 
            dataKey="name" 
            stroke={isDarkMode ? "#9CA3AF" : "#6b7280"} 
            fontSize={12}
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke={isDarkMode ? "#9CA3AF" : "#6b7280"} 
            fontSize={12}
            tickLine={false} 
            axisLine={false} 
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="rating"
            stroke={chartConfig.rating.color}
            fill="url(#ratingGradient)"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="practice"
            stroke={chartConfig.practice.color}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

// Question Types Donut Chart
const QuestionTypesChart = ({ userData, isDarkMode }) => {
  const topicsSolved = userData?.topics_solved || [];
  const timeSpentPerTopic = userData?.time_spent_per_topic || {};
  
  // Generate question types data based on topics solved
  const questionTypesData = useMemo(() => {
    const defaultData = [
      { name: "Math", value: 0, fill: "#6366f1" },
      { name: "Verbal", value: 0, fill: "#8b5cf6" },
      { name: "Reading", value: 0, fill: "#06b6d4" },
      { name: "Writing", value: 0, fill: "#10b981" },
      { name: "Science", value: 0, fill: "#f59e0b" }
    ];

    // If we have topics data, use it
    if (topicsSolved.length > 0) {
      topicsSolved.forEach(topic => {
        const matchingType = defaultData.find(type => 
          topic.toLowerCase().includes(type.name.toLowerCase())
        );
        if (matchingType) {
          matchingType.value += timeSpentPerTopic[topic] || 10;
        } else {
          defaultData[0].value += 10; // Default to Math
        }
      });
    } else {
      // Use fallback data
      defaultData[0].value = userData?.correct_questions ? Math.floor(userData.correct_questions * 0.4) : 45;
      defaultData[1].value = userData?.correct_questions ? Math.floor(userData.correct_questions * 0.25) : 28;
      defaultData[2].value = userData?.correct_questions ? Math.floor(userData.correct_questions * 0.2) : 22;
      defaultData[3].value = userData?.correct_questions ? Math.floor(userData.correct_questions * 0.1) : 15;
      defaultData[4].value = userData?.correct_questions ? Math.floor(userData.correct_questions * 0.05) : 8;
    }

    return defaultData.filter(item => item.value > 0);
  }, [topicsSolved, timeSpentPerTopic, userData?.correct_questions]);

  const total = questionTypesData.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <ChartContainer config={{}} className="h-[180px] w-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={questionTypesData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {questionTypesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    return (
                      <div className={`${isDarkMode ? 'bg-zinc-900/95 border-zinc-700' : 'bg-white/95 border-gray-200'} border rounded-lg p-3 shadow-xl`}>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{data.name}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                          {data.value} problems ({((data.value / total) * 100).toFixed(1)}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{total}</p>
            <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Total</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2 flex-1">
        {questionTypesData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.fill }}
              />
              <span className={`text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>{item.name}</span>
            </div>
            <div className="text-right">
              <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.value}</span>
              <span className={`text-xs ml-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                ({((item.value / total) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Collapsible Sidebar
const CollapsibleSidebar = ({ userData, onLogout, isDarkMode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkScreenSize = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        if (mobile) setIsCollapsed(true);
      };
      checkScreenSize();
      window.addEventListener('resize', checkScreenSize);
      return () => window.removeEventListener('resize', checkScreenSize);
    }
  }, []);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const menuItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", active: true },
    { icon: BookOpen, label: "Practice", href: "/practice" },
    { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" }
  ];

  const getInitials = (email) => {
    if (!email) return "U";
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  };

  const sidebarBg = isDarkMode ? 'bg-gradient-to-b from-zinc-900 to-zinc-950 border-zinc-800/50' : 'bg-gradient-to-b from-gray-50 to-white border-gray-200';
  const textColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const secondaryTextColor = isDarkMode ? 'text-zinc-400' : 'text-gray-600';

  return (
    <TooltipProvider>
      <div className={`flex flex-col h-screen ${sidebarBg} border-r transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-zinc-800/50' : 'border-gray-200'}`}>
          {!isCollapsed && (
            <h2 className={`text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent`}>
              ALCHPREP
            </h2>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleSidebar} 
            className={`h-8 w-8 p-0 ${secondaryTextColor} hover:${textColor} ${isDarkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-100'} transition-all duration-200`}
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex-1 p-2">
          <nav className="space-y-1">
            {menuItems.map((item, index) => {
              const MenuItem = (
                <div
                  key={index}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 cursor-pointer ${
                    item.active 
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/20' 
                      : `${secondaryTextColor} hover:${textColor} ${isDarkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-100'}`
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Link href={item.href}><item.icon className="h-4 w-4 flex-shrink-0" /></Link>
                  {!isCollapsed && <Link href={item.href} className="flex-1"><span className="font-medium">{item.label}</span></Link>}
                  {!isCollapsed && item.active && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              );

              return isCollapsed ? (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>{MenuItem}</TooltipTrigger>
                  <TooltipContent side="right" className={`${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'} ${textColor}`}>
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ) : MenuItem;
            })}
          </nav>
        </div>

        <div className={`p-4 border-t ${isDarkMode ? 'border-zinc-800/50' : 'border-gray-200'}`}>
          <div className={`flex items-center gap-3 p-2 rounded-lg ${isDarkMode ? 'bg-zinc-800/30' : 'bg-gray-100'} ${isCollapsed ? 'justify-center' : ''}`}>
            <Avatar className="h-8 w-8 ring-2 ring-blue-500/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userData?.username}`} />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-bold">
                {getInitials(userData?.email)}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${textColor} truncate`}>{userData?.username}</p>
                <p className={`text-xs ${secondaryTextColor} truncate`}>{userData?.email}</p>
              </div>
            )}
          </div>
          <div className="mt-3">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onLogout} 
                    className={`h-8 w-8 p-0 ${secondaryTextColor} hover:text-red-400 hover:bg-red-500/10 transition-all duration-200`}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className={`${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-gray-200'}`}>
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogout} 
                className={`w-full justify-start gap-2 ${secondaryTextColor} hover:text-red-400 hover:bg-red-500/10 transition-all duration-200`}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

// Main Dashboard Component
export default function ExamAnalyticsDashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Get user profile data
        const profileData = await apiService.getUserProfile();
        console.log('Dashboard Data:', profileData);
        
        if (profileData && profileData.data) {
          console.log('Setting User Data:', profileData.data);
          setUserData(profileData.data);
          setError(null);
        } else {
          throw new Error('Failed to fetch user profile');
        }
      } catch (err) {
        console.error('Dashboard initialization error:', err);
        setError(err.message);
        
        // Redirect to login or show error state
        if (err.message.includes('token')) {
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // You might want to redirect to login here
        }
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();

    // Set document title
    if (typeof window !== "undefined") {
      document.title = "Dashboard | Alchprep";
    }
  }, []);

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login or refresh page
      window.location.href = '/login';
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleHeatmap = () => {
    setShowHeatmap(!showHeatmap);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const response = await apiService.verifyToken();
      if (response.success && response.data) {
        setUserData(response.data);
      }
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Dashboard Error</h2>
          <p className={`mb-4 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{error}</p>
          <Button onClick={refreshData} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Calculate derived stats
  const accuracyRate = userData?.accuracy_rate || (userData?.correct_questions && userData?.questions_attempted 
    ? ((userData.correct_questions / userData.questions_attempted) * 100).toFixed(1) 
    : 0);
  
  const studyGoal = 200;
  const currentStudyHours = userData?.average_session_duration * userData?.active_days || 45;
  const progressValue = (currentStudyHours / studyGoal) * 100;

  const themeClasses = isDarkMode 
    ? 'bg-zinc-950 text-white'
    : 'bg-gray-50 text-gray-900';

  const cardClasses = isDarkMode
    ? 'border-zinc-800/50 bg-zinc-900'
    : 'border-gray-200 bg-white';

  return (
    <div className={`flex h-screen ${themeClasses} font-sans overflow-hidden`}>
      <CollapsibleSidebar userData={userData} onLogout={handleLogout} isDarkMode={isDarkMode} />
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-4 md:p-8">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Header with Theme Toggle */}
              <div>
                <div className={`p-6 rounded-2xl border ${cardClasses}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="mb-2 text-3xl md:text-5xl font-black">
                        Welcome back, <span className="text-blue-500">{userData?.username}</span> 👋
                      </h1>
                      <p className={`text-lg md:text-xl font-light ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                        Track your progress, analyze performance, and achieve your exam goals.
                      </p>
                    </div>                  {/* Theme and View Controls */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Sun className={`h-4 w-4 ${isDarkMode ? 'text-zinc-500' : 'text-yellow-500'}`} />
                      <Switch 
                        checked={isDarkMode} 
                        onCheckedChange={toggleTheme}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <Moon className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-zinc-500'}`} />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className={`h-4 w-4 ${showHeatmap ? 'text-emerald-500' : 'text-zinc-500'}`} />
                      <Switch 
                        checked={showHeatmap} 
                        onCheckedChange={toggleHeatmap}
                        className="data-[state=checked]:bg-emerald-600"
                      />
                      <MapPin className={`h-4 w-4 ${!showHeatmap ? 'text-purple-500' : 'text-zinc-500'}`} />
                    </div>
                    
                    <Button 
                      onClick={refreshData}
                      variant="ghost"
                      size="sm"
                      className={`${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge variant="secondary" className={`${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                    <Activity className="w-3 h-3 mr-1" />
                    Active Streak: {userData?.streak_count || 0} days
                  </Badge>
                  <Badge variant="secondary" className={`${isDarkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                    <Target className="w-3 h-3 mr-1" />
                    Rating: {userData?.score || 0}
                  </Badge>
                  <Badge variant="secondary" className={`${isDarkMode ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-100 text-purple-700 border-purple-200'}`}>
                    <Trophy className="w-3 h-3 mr-1" />
                    Level: {userData?.level || 1}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { 
                  title: "Current Rating", 
                  value: userData?.score?.toLocaleString() || "0", 
                  change: userData?.game_score ? `+${userData.game_score}` : "+0", 
                  icon: TrendingUp, 
                  color: "emerald" 
                },
                { 
                  title: "Study Hours", 
                  value: `${Math.round(currentStudyHours)}h`, 
                  change: `${Math.round(studyGoal - currentStudyHours)}h left`, 
                  icon: Clock, 
                  color: "blue" 
                },
                { 
                  title: "Problems Solved", 
                  value: userData?.correct_questions?.toLocaleString() || "0", 
                  change: userData?.questions_attempted ? `${userData.questions_attempted} attempted` : "0 attempted", 
                  icon: CheckCircle, 
                  color: "purple" 
                },
                { 
                  title: "Accuracy Rate", 
                  value: `${accuracyRate}%`, 
                  change: userData?.completion_rate ? `${userData.completion_rate}% completion` : "0% completion", 
                  icon: Zap, 
                  color: "orange" 
                },
              ].map((stat, index) => (
                <Card key={index} className={`border ${cardClasses} hover:border-opacity-70 transition-all duration-300 group`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{stat.title}</p>
                        <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                        <p className={`text-xs mt-1 ${isDarkMode ? `text-${stat.color}-400` : `text-${stat.color}-600`}`}>{stat.change}</p>
                      </div>
                      <div className={`p-3 rounded-full ${isDarkMode ? `bg-${stat.color}-500/10` : `bg-${stat.color}-100`} group-hover:${isDarkMode ? `bg-${stat.color}-500/20` : `bg-${stat.color}-200`} transition-colors duration-300`}>
                        <stat.icon className={`h-5 w-5 ${isDarkMode ? `text-${stat.color}-500` : `text-${stat.color}-600`}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Rating Progress Chart */}
              <Card className={`lg:col-span-2 border ${cardClasses}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                        Rating Progress
                      </CardTitle>
                      <CardDescription className={`mt-1 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                        Your rating and practice score trends over time
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={`${isDarkMode ? 'border-emerald-500/20 text-emerald-400' : 'border-emerald-500/30 text-emerald-600'}`}>
                      +{userData?.game_score || 0} this month
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <RatingChart userData={userData} isDarkMode={isDarkMode} />
                </CardContent>
              </Card>

              {/* Question Types */}
              <Card className={`border ${cardClasses}`}>
                <CardHeader>
                  <CardTitle className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <BarChart2 className="h-5 w-5 text-purple-500" />
                    Question Types
                  </CardTitle>
                  <CardDescription className={`${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                    Distribution of problems solved by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QuestionTypesChart userData={userData} isDarkMode={isDarkMode} />
                </CardContent>
              </Card>

              {/* Exam Performance */}
              <Card className={`border ${cardClasses}`}>
                <CardHeader>
                  <CardTitle className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Exam Scores
                  </CardTitle>
                  <CardDescription className={`${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                    Your examination results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userData?.exams && userData.exams.length > 0 ? (
                      userData.exams.map((exam, index) => (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-zinc-800/30 hover:bg-zinc-800/50' : 'bg-gray-100 hover:bg-gray-200'} transition-colors duration-200`}>
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <div>
                              <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{exam.name || 'Exam'}</p>
                              <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{exam.status || 'Completed'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{exam.score || 'N/A'}</p>
                            <p className="text-xs text-emerald-400">{exam.improvement || 'New'}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`text-center py-8 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                        <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No exam records yet</p>
                        <p className="text-xs mt-1">Start practicing to see your progress</p>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" className={`mt-4 w-full text-blue-400 ${isDarkMode ? 'hover:bg-blue-500/10' : 'hover:bg-blue-50'} hover:text-blue-300 transition-all duration-200`}>
                    {userData?.exams?.length ? 'View Detailed Results' : 'Start First Exam'}
                  </Button>
                </CardContent>
              </Card>

              {/* Study Progress */}
              <Card className={`border ${cardClasses}`}>
                <CardHeader>
                  <CardTitle className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Target className="h-5 w-5 text-blue-500" />
                    Study Goals
                  </CardTitle>
                  <CardDescription className={`${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                    Monthly study hour tracking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={`${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Progress</span>
                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{Math.round(currentStudyHours)}h / {studyGoal}h</span>
                    </div>
                    <Progress 
                      value={progressValue} 
                      className={`h-3 ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'} [&>*]:bg-gradient-to-r [&>*]:from-blue-500 [&>*]:to-purple-500`}
                    />
                    <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                      {Math.round(progressValue)}% complete • {Math.round(studyGoal - currentStudyHours)} hours remaining
                    </p>
                  </div>
                  
                  <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${isDarkMode ? 'border-zinc-800/50' : 'border-gray-200'}`}>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-400">{userData?.streak_count || 0}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Day Streak</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">{userData?.average_session_duration?.toFixed(1) || '0.0'}h</p>
                      <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Daily Avg</p>
                    </div>
                  </div>

                  {/* XP and Level Progress */}
                  <div className={`pt-4 border-t ${isDarkMode ? 'border-zinc-800/50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Level {userData?.level || 1}</span>
                      <span className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>{userData?.xp_points || 0} XP</span>
                    </div>
                    <Progress 
                      value={((userData?.xp_points || 0) % 1000) / 10} 
                      className={`h-2 ${isDarkMode ? 'bg-zinc-800' : 'bg-gray-200'} [&>*]:bg-gradient-to-r [&>*]:from-yellow-500 [&>*]:to-orange-500`}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Achievements & Badges */}
              <Card className={`border ${cardClasses}`}>
                <CardHeader>
                  <CardTitle className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Achievements
                  </CardTitle>
                  <CardDescription className={`${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                    Your earned badges and milestones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userData?.badges_earned && userData.badges_earned.length > 0 ? (
                      userData.badges_earned.map((badge, index) => (
                        <div 
                          key={index} 
                          className={`flex items-center gap-3 p-3 rounded-lg ${isDarkMode ? 'bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border border-yellow-500/20' : 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'}`}
                        >
                          <div className="text-2xl">🏆</div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                              {badge}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                              Achievement Unlocked
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`text-center py-6 ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                        <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No badges earned yet</p>
                        <p className="text-xs mt-1">Keep studying to unlock achievements</p>
                      </div>
                    )}
                  </div>
                  
                  {userData?.badges_earned?.length > 0 && (
                    <Button variant="ghost" className={`mt-4 w-full text-purple-400 ${isDarkMode ? 'hover:bg-purple-500/10' : 'hover:bg-purple-50'} hover:text-purple-300 transition-all duration-200`}>
                      View All Achievements
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activity Heatmap or Contribution Map */}
            <Card className={`border ${cardClasses}`}>
              <CardHeader>
                <CardTitle className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {showHeatmap ? (
                    <>
                      <Calendar className="h-5 w-5 text-emerald-500" />
                      Study Activity Heatmap
                    </>
                  ) : (
                    <>
                      <MapPin className="h-5 w-5 text-purple-500" />
                      Contribution Map
                    </>
                  )}
                </CardTitle>
                <CardDescription className={`${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                  {showHeatmap 
                    ? `Your daily study sessions over the past year • ${new Date().getFullYear()}`
                    : 'Your learning contributions and topic coverage'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showHeatmap ? (
                  <>
                    <ActivityHeatmap heatmapData={userData?.heatmap_matrix} isDarkMode={isDarkMode} />
                    <div className={`mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t ${isDarkMode ? 'border-zinc-800/50' : 'border-gray-200'}`}>
                      <div className="text-center">
                        <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{userData?.total_active_days || 0}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Total Sessions</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-400">{userData?.active_days || 0}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>This Month</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-400">{userData?.streak_count || 0}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Current Streak</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-purple-400">{Math.max(userData?.streak_count || 0, 5)}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Best Streak</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    {/* Topics Coverage */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                        <h3 className={`font-semibold text-emerald-400 mb-2`}>Strong Topics</h3>
                        <div className="space-y-1">
                          {userData?.strong_topics && userData.strong_topics.length > 0 ? (
                            userData.strong_topics.slice(0, 3).map((topic, index) => (
                              <Badge key={index} variant="secondary" className="mr-1 mb-1">
                                {topic}
                              </Badge>
                            ))
                          ) : (
                            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>No strong topics yet</p>
                          )}
                        </div>
                      </div>
                      
                      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-200'}`}>
                        <h3 className={`font-semibold text-orange-400 mb-2`}>Weaker Topics</h3>
                        <div className="space-y-1">
                          {userData?.weaker_topics && userData.weaker_topics.length > 0 ? (
                            userData.weaker_topics.slice(0, 3).map((topic, index) => (
                              <Badge key={index} variant="secondary" className="mr-1 mb-1">
                                {topic}
                              </Badge>
                            ))
                          ) : (
                            <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>No weak areas identified</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Learning Style & Subscription */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${isDarkMode ? 'border-zinc-800/50' : 'border-gray-200'}`}>
                      <div className="text-center">
                        <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{userData?.learning_style || 'Mixed'}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Learning Style</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-lg font-bold ${userData?.subscription_plan === 'Free' ? 'text-blue-400' : 'text-yellow-400'}`}>
                          {userData?.subscription_plan || 'Free'}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Plan</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card className={`border ${cardClasses}`}>
              <CardHeader>
                <CardTitle className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Activity className="h-5 w-5 text-blue-500" />
                  Performance Summary
                </CardTitle>
                <CardDescription className={`${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                  Your overall learning statistics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Contest Performance</h3>
                    <p className={`text-2xl font-bold text-blue-400 mt-1`}>{userData?.no_of_contest_attempted || 0}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Contests attempted</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl mb-2">🎯</div>
                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Accuracy Rate</h3>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{accuracyRate}%</p>
                    <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Overall accuracy</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl mb-2">🚀</div>
                    <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Global Rank</h3>
                    <p className="text-2xl font-bold text-purple-400 mt-1">{userData?.rank || 'Unranked'}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-gray-600'}`}>Leaderboard position</p>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className={`mt-6 pt-4 border-t ${isDarkMode ? 'border-zinc-800/50' : 'border-gray-200'}`}>
                  <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Activity</h4>
                  <div className="space-y-2">
                    <div className={`flex items-center gap-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Last login: {userData?.last_login_time ? new Date(userData.last_login_time).toLocaleDateString() : 'Today'}</span>
                    </div>
                    <div className={`flex items-center gap-3 text-sm ${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Account created: {userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'Recently'}</span>
                    </div>
                    {userData?.cheating_warning && (
                      <div className={`flex items-center gap-3 text-sm text-red-400`}>
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>Cheating warning detected - Please follow fair play guidelines</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}