"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
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
  Clock
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

// Enhanced mock data with more realistic patterns
const dummyExams = [
  { exam: "SAT", score: "1480", percentile: "95th", status: "Completed", improvement: "+120", color: "bg-emerald-500" },
  { exam: "GRE", score: "325", percentile: "90th", status: "In Progress", improvement: "+15", color: "bg-blue-500" },
  { exam: "IELTS", score: "8.0", percentile: "99th", status: "Completed", improvement: "+1.5", color: "bg-purple-500" },
  { exam: "TOEFL", score: "110", percentile: "88th", status: "Scheduled", improvement: "N/A", color: "bg-orange-500" },
];

const StudyHoursGoal = 200;
const CurrentStudyHours = 145;
const progressValue = (CurrentStudyHours / StudyHoursGoal) * 100;

// Enhanced rating data with more variation
const mockRatingData = [
  { name: 'Jan', rating: 1200, practice: 850 },
  { name: 'Feb', rating: 1250, practice: 920 },
  { name: 'Mar', rating: 1230, practice: 980 },
  { name: 'Apr', rating: 1300, practice: 1050 },
  { name: 'May', rating: 1350, practice: 1120 },
  { name: 'Jun', rating: 1320, practice: 1180 },
  { name: 'Jul', rating: 1400, practice: 1250 },
  { name: 'Aug', rating: 1420, practice: 1280 },
];

// Question types data for pie chart
const questionTypesData = [
  { name: "Math", value: 145, fill: "#6366f1" },
  { name: "Verbal", value: 89, fill: "#8b5cf6" },
  { name: "Reading", value: 76, fill: "#06b6d4" },
  { name: "Writing", value: 54, fill: "#10b981" },
  { name: "Science", value: 32, fill: "#f59e0b" }
];

const mockLeaderboardData = [
  { rank: 1, user: "AlphaTester", rating: 1850, change: "+25", avatar: "AT" },
  { rank: 2, user: "BetaPro", rating: 1780, change: "+18", avatar: "BP" },
  { rank: 3, user: "GammaMaster", rating: 1750, change: "-5", avatar: "GM" },
  { rank: 4, user: "Hello", rating: 1420, change: "+20", avatar: "H" },
  { rank: 5, user: "CodeChamp", rating: 1390, change: "+12", avatar: "CC" },
];

// Chart configurations
const chartConfig = {
  rating: {
    label: "Rating",
    color: "#6366f1",
  },
  practice: {
    label: "Practice Score",
    color: "#8b5cf6",
  },
};

// Generate enhanced activity data with real dates
const generateActivityData = (days) => {
  const data = {};
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    // More realistic activity pattern
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseActivity = isWeekend ? 2 : 3;
    data[dateString] = Math.max(0, baseActivity + Math.floor(Math.random() * 3) - 1);
  }
  return data;
};

const ActivityHeatmap = () => {
  const daysInYear = 365;
  const mockActivityData = useMemo(() => generateActivityData(daysInYear), []);
  const today = new Date();
  
  // Generate days for the past year
  const days = Array.from({ length: daysInYear }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (daysInYear - 1 - i));
    return date;
  });

  // Get month labels for the heatmap
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
    const colors = [
      'bg-zinc-900/50 border-zinc-800/50',
      'bg-emerald-900/40 border-emerald-800/50',
      'bg-emerald-700/60 border-emerald-600/50',
      'bg-emerald-600/80 border-emerald-500/50',
      'bg-emerald-500 border-emerald-400/50'
    ];
    return colors[Math.min(count, 4)];
  };
  
  return (
    <div className="space-y-4">
      {/* Month labels */}
      <div className="grid grid-flow-col gap-0.5" style={{ gridTemplateColumns: `repeat(${Math.ceil(daysInYear / 7)}, 1fr)` }}>
        {months.map((month, i) => (
          <div key={i} className="text-xs text-zinc-500 text-center" style={{ gridColumnStart: Math.floor(month.index / 7) + 1 }}>
            {month.name}
          </div>
        ))}
      </div>
      
      {/* Activity legend */}
      <div className="flex items-center justify-between text-zinc-400">
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
      
      {/* Heatmap grid */}
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
        {days.map((date) => {
          const dateString = date.toISOString().split('T')[0];
          const activityCount = mockActivityData[dateString] || 0;
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
                  <p className="text-xs text-zinc-400">
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
const RatingChart = () => (
  <ChartContainer config={chartConfig} className="h-[200px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={mockRatingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis 
          dataKey="name" 
          stroke="#9CA3AF" 
          fontSize={12}
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          stroke="#9CA3AF" 
          fontSize={12}
          tickLine={false} 
          axisLine={false} 
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="rating"
          stroke="#6366f1"
          fill="url(#ratingGradient)"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="practice"
          stroke="#8b5cf6"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  </ChartContainer>
);

// Question Types Donut Chart
const QuestionTypesChart = () => {
  const total = questionTypesData.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <ChartContainer config={chartConfig} className="h-[180px] w-[180px]">
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
                      <div className="bg-zinc-900/95 border border-zinc-700 rounded-lg p-3 shadow-xl">
                        <p className="text-sm font-medium text-white">{data.name}</p>
                        <p className="text-sm text-zinc-400">
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
            <p className="text-2xl font-bold text-white">{total}</p>
            <p className="text-xs text-zinc-400">Total</p>
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
              <span className="text-sm text-zinc-300">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-white">{item.value}</span>
              <span className="text-xs text-zinc-400 ml-1">
                ({((item.value / total) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Collapsible Sidebar (keeping the existing one but with enhanced styling)
const CollapsibleSidebar = ({ email, username, onLogout }) => {
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

  return (
    <TooltipProvider>
      <div className={`flex flex-col h-screen bg-gradient-to-b from-zinc-900 to-zinc-950 border-r border-zinc-800/50 transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
          {!isCollapsed && (
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ALCHPREP
            </h2>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleSidebar} 
            className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all duration-200"
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 p-2">
          <nav className="space-y-1">
            {menuItems.map((item, index) => {
              const MenuItem = (
                <div
                  key={index}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 cursor-pointer ${
                    item.active 
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/20' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                  {!isCollapsed && item.active && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              );

              return isCollapsed ? (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>{MenuItem}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-zinc-800 border-zinc-700">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              ) : MenuItem;
            })}
          </nav>
        </div>

        {/* User Account */}
        <div className="p-4 border-t border-zinc-800/50">
          <div className={`flex items-center gap-3 p-2 rounded-lg bg-zinc-800/30 ${isCollapsed ? 'justify-center' : ''}`}>
            <Avatar className="h-8 w-8 ring-2 ring-blue-500/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${username}`} />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs font-bold">
                {getInitials(email)}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{username}</p>
                <p className="text-xs text-zinc-400 truncate">{email}</p>
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
                    className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-zinc-800 border-zinc-700">
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onLogout} 
                className="w-full justify-start gap-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
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
  const [email, setEmail] = useState("user@example.com");
  const [username, setUsername] = useState("User");
   useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = localStorage.getItem("email");
      const storedUsername =
        localStorage.getItem("username") ||
        storedEmail?.split("@")[0] ||  
        "User";

      if (storedEmail) setEmail(storedEmail);
      if (storedUsername) setUsername(storedUsername);
    }
  }, []);
  useEffect(() => {
    // Simulate getting user data
    if (typeof window !== "undefined") {
      document.title = "Dashboard | Alchprep";
    }
  }, []);

  const handleLogout = () => {
    console.log("Logout clicked");
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 font-sans text-white overflow-hidden">
      <CollapsibleSidebar email={email} username={username} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-4 md:p-8">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Header */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-2xl blur-xl"></div>
              <div className="relative p-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
                <h1 className="mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-3xl md:text-5xl font-black text-transparent">
                  Welcome back, <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">{username}</span> 👋
                </h1>
                <p className="text-lg md:text-xl text-zinc-400 font-light">
                  Track your progress, analyze performance, and achieve your exam goals.
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    <Activity className="w-3 h-3 mr-1" />
                    Active Streak: 12 days
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    <Target className="w-3 h-3 mr-1" />
                    Rating: 1420
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Current Rating", value: "1,420", change: "+50", icon: TrendingUp, color: "emerald" },
                { title: "Study Hours", value: `${CurrentStudyHours}h`, change: `${StudyHoursGoal - CurrentStudyHours}h left`, icon: Clock, color: "blue" },
                { title: "Problems Solved", value: "396", change: "+23 today", icon: CheckCircle, color: "purple" },
                { title: "Accuracy Rate", value: "87.2%", change: "+2.1%", icon: Zap, color: "orange" },
              ].map((stat, index) => (
                <Card key={index} className="border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 backdrop-blur-sm hover:border-zinc-700/50 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-zinc-400">{stat.title}</p>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                        <p className={`text-xs mt-1 text-${stat.color}-400`}>{stat.change}</p>
                      </div>
                      <div className={`p-3 rounded-full bg-${stat.color}-500/10 group-hover:bg-${stat.color}-500/20 transition-colors duration-300`}>
                        <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Rating Progress Chart */}
              <Card className="lg:col-span-2 border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                        Rating Progress
                      </CardTitle>
                      <CardDescription className="text-zinc-400 mt-1">
                        Your rating and practice score trends over time
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/20 text-emerald-400">
                      +50 this month
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <RatingChart />
                </CardContent>
              </Card>

              {/* Question Types */}
              <Card className="border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-purple-500" />
                    Question Types
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Distribution of problems solved by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QuestionTypesChart />
                </CardContent>
              </Card>

              {/* Exam Performance */}
              <Card className="border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Exam Scores
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Your latest examination results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dummyExams.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 hover:bg-zinc-800/50 transition-colors duration-200">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <div>
                            <p className="text-sm font-semibold text-white">{item.exam}</p>
                            <p className="text-xs text-zinc-400">{item.status}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">{item.score}</p>
                          <p className="text-xs text-emerald-400">{item.improvement !== "N/A" ? item.improvement : item.percentile}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="mt-4 w-full text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-all duration-200">
                    View Detailed Results
                  </Button>
                </CardContent>
              </Card>

              {/* Study Progress */}
              <Card className="border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Study Goals
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Monthly study hour tracking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Progress</span>
                      <span className="text-white font-medium">{CurrentStudyHours}h / {StudyHoursGoal}h</span>
                    </div>
                    <Progress 
                      value={progressValue} 
                      className="h-3 bg-zinc-800 [&>*]:bg-gradient-to-r [&>*]:from-blue-500 [&>*]:to-purple-500"
                    />
                    <p className="text-sm text-zinc-400">
                      {progressValue.toFixed(0)}% complete • {StudyHoursGoal - CurrentStudyHours} hours remaining
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-400">12</p>
                      <p className="text-xs text-zinc-400">Day Streak</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">4.2h</p>
                      <p className="text-xs text-zinc-400">Daily Avg</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leaderboard */}
              <Card className="border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Leaderboard
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Top performers this week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockLeaderboardData.map((user, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-zinc-800/50 ${
                          user.user === "Hello" ? 'bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20' : 'bg-zinc-800/20'
                        }`}
                      >
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-yellow-900' :
                          index === 1 ? 'bg-zinc-400 text-zinc-900' :
                          index === 2 ? 'bg-amber-600 text-amber-100' :
                          'bg-zinc-700 text-zinc-300'
                        }`}>
                          {user.rank}
                        </div>
                        
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`text-xs font-bold ${
                            user.user === "Hello" ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' : 'bg-zinc-700 text-zinc-300'
                          }`}>
                            {user.avatar}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            user.user === "Hello" ? 'text-blue-400' : 'text-white'
                          }`}>
                            {user.user}
                          </p>
                          <p className="text-xs text-zinc-400">{user.rating} pts</p>
                        </div>
                        
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            user.change.startsWith('+') ? 'border-emerald-500/20 text-emerald-400' : 'border-red-500/20 text-red-400'
                          }`}
                        >
                          {user.change}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="mt-4 w-full text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 transition-all duration-200">
                    View Full Leaderboard
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Activity Heatmap */}
            <Card className="border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-500" />
                  Study Activity
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Your daily study sessions over the past year • {new Date().getFullYear()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityHeatmap />
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-800/50">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">1,247</p>
                    <p className="text-xs text-zinc-400">Total Sessions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-400">127</p>
                    <p className="text-xs text-zinc-400">This Month</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-blue-400">12</p>
                    <p className="text-xs text-zinc-400">Current Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-purple-400">28</p>
                    <p className="text-xs text-zinc-400">Longest Streak</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card className="border border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-zinc-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Recent Achievements
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Your latest milestones and accomplishments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      title: "Math Master",
                      description: "Solved 100 math problems",
                      icon: "🧮",
                      color: "from-blue-500/20 to-cyan-500/20",
                      borderColor: "border-blue-500/30"
                    },
                    {
                      title: "Consistency King",
                      description: "10-day study streak",
                      icon: "🔥",
                      color: "from-orange-500/20 to-red-500/20",
                      borderColor: "border-orange-500/30"
                    },
                    {
                      title: "Rating Climber",
                      description: "Gained 50 rating points",
                      icon: "📈",
                      color: "from-emerald-500/20 to-green-500/20",
                      borderColor: "border-emerald-500/30"
                    }
                  ].map((achievement, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-xl bg-gradient-to-br ${achievement.color} border ${achievement.borderColor} hover:scale-105 transition-all duration-200 cursor-pointer`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{achievement.icon}</div>
                        <h3 className="font-bold text-white mb-1">{achievement.title}</h3>
                        <p className="text-xs text-zinc-400">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}