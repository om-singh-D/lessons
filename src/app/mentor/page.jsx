"use client";
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import Footer from '@/components/Footer';
import LenisProvider from '@/components/ui/lenisProvider';
import { BookOpen, Clock, Users, Trophy, Target, TrendingUp, Zap, Calendar, CheckCircle, XCircle } from 'lucide-react';

const Page = () => {
  const [userEmail, setUserEmail] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userGoals, setUserGoals] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Get email and token from local storage
    const email = localStorage.getItem('email') || 'vermanickb75@gmail.com'; // Fallback
    const token = localStorage.getItem('token');

    if (email && token) {
      setUserEmail(email);
      setAuthToken(token);
    } else {
      setIsLoading(false);
      setError("User not authenticated. Please log in.");
    }
  }, []);

  useEffect(() => {
    if (userEmail && authToken) {
      // 2. Fetch all crucial data
      const fetchAllData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // Fetch user data
          const userRes = await fetch(`https://alchprep-backend12.vercel.app/user/${userEmail}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (!userRes.ok) throw new Error('Failed to fetch user data');
          const user = await userRes.json();
          setUserData(user);

          // Fetch user goals
          const goalsRes = await fetch(`https://alchprep-backend12.vercel.app/goals/${userEmail}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (!goalsRes.ok) throw new Error('Failed to fetch goals data');
          const goals = await goalsRes.json();
          setUserGoals(goals);

          // Fetch leaderboard data (assuming a dedicated endpoint)
          const leaderboardRes = await fetch('https://alchprep-backend12.vercel.app/leaderboard', {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (!leaderboardRes.ok) throw new Error('Failed to fetch leaderboard');
          const leaderboard = await leaderboardRes.json();
          setLeaderboardData(leaderboard);

        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchAllData();
    }
  }, [userEmail, authToken]);

  // Helper function to extract all daily tasks into a flat array
  const getAllDailyTasks = (goalsData) => {
    if (!goalsData || !goalsData.goals) return [];
    const tasks = [];
    // Iterate over each top-level goal keyword (e.g., 'Ai Ml')
    for (const goalKeyword in goalsData.goals) {
      if (Object.hasOwnProperty.call(goalsData.goals, goalKeyword)) {
        const goal = goalsData.goals[goalKeyword];
        if (goal.daily_tasks) {
          // Iterate over each date within the daily_tasks
          for (const date in goal.daily_tasks) {
            if (Object.hasOwnProperty.call(goal.daily_tasks, date)) {
              const tasksForDate = goal.daily_tasks[date];
              // Iterate over each task within the specific date
              for (const taskId in tasksForDate) {
                if (Object.hasOwnProperty.call(tasksForDate, taskId)) {
                  tasks.push({
                    id: `${goalKeyword}-${date}-${taskId}`,
                    date: date,
                    name: tasksForDate[taskId].question,
                    completed: tasksForDate[taskId].completed,
                    topic: goalKeyword // Use the goal keyword as the topic
                  });
                }
              }
            }
          }
        }
      }
    }
    return tasks;
  };

  const getMotivationalMessage = () => {
    const allDailyTasks = getAllDailyTasks(userGoals);
    const completedTasks = allDailyTasks.filter(task => task.completed).length;
    const totalTasks = allDailyTasks.length;

    if (totalTasks === 0) {
      return "Start your first task today and level up! 🎉";
    }

    if (completedTasks === totalTasks) {
      return "🎉 Great job! You completed all your tasks. Keep up the momentum!";
    }

    const completionPercentage = (completedTasks / totalTasks) * 100;
    if (completionPercentage >= 75) {
      return "Excellent progress! You're almost there, just a few more tasks to complete. You can do it!";
    } else if (completionPercentage >= 50) {
      return "You're halfway through! Keep pushing and you'll finish all your tasks in no time. Keep it up!";
    } else if (completionPercentage > 0) {
      return "You've made a great start! Every step counts. Let's tackle the next task together!";
    }

    return "You're at the beginning of an amazing journey. Let's start with your first task and build some momentum!";
  };

  const getPersonalizedSuggestions = () => {
    const allDailyTasks = getAllDailyTasks(userGoals);
    const unsolvedTasks = allDailyTasks.filter(task => !task.completed);
    if (unsolvedTasks.length === 0) {
      return "You've solved all your tasks! Great work. To keep improving, consider exploring advanced topics or a new learning path.";
    }

    const uniqueTopics = [...new Set(unsolvedTasks.map(task => task.topic))];
    return `You've left some questions unsolved on these topics: ${uniqueTopics.join(', ')}. Focus on these areas to improve!`;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-400"></div>
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-16">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-300 mb-2">Error</h3>
          <p className="text-red-400">{error}</p>
        </div>
      );
    }
    if (!userData || !userGoals) {
      return (
        <div className="text-center py-16">
          <BookOpen className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-zinc-300 mb-2">No data found</h3>
          <p className="text-zinc-400">Please log in or check API endpoints</p>
        </div>
      );
    }

    const allDailyTasks = getAllDailyTasks(userGoals);
    const completedTasks = allDailyTasks.filter(task => task.completed).length;
    // The userData.xp structure is now an object with date keys.
    const totalXP = Object.values(userData.xp).reduce((sum, points) => sum + points, 0);

    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
          {/* Background gradient effect */}
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          </div>

          <div className="max-w-7xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent leading-tight">
              Welcome Back, {userEmail.split('@')[0]}!
            </h1>
            <p className="text-lg md:text-xl text-zinc-300 mb-8 max-w-3xl mx-auto font-light">
              {getMotivationalMessage()}
            </p>
            <div className="flex justify-center items-center gap-6 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span>Total XP: {totalXP}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                <span>Completed: {completedTasks}/{allDailyTasks.length}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* Daily Tasks Card */}
              <div className="lg:col-span-2">
                <div className="relative bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg p-6 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-blue-400" />
                      Daily Tasks
                    </h2>
                    <a
                      href="/daily-tasks"
                      className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors duration-300 border border-blue-500/30"
                    >
                      View All
                    </a>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                    {allDailyTasks.slice(0, 6).map(task => (
                      <div key={task.id} className={`p-4 rounded-lg border transition-all duration-300 ${
                        task.completed
                          ? 'bg-green-500/10 border-green-500/30 text-green-300'
                          : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {task.completed ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-zinc-500"></div>
                            )}
                            <div>
                              <p className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                                {task.name}
                              </p>
                              <p className="text-xs text-zinc-500">{task.date}</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-zinc-700 text-zinc-300 rounded text-xs">
                            {task.topic}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {allDailyTasks.length === 0 && (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                      <p className="text-zinc-400">No tasks available. Start your learning journey!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Personalized Roadmap Card */}
                <div className="relative bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg p-6 hover:shadow-2xl transition-all duration-300">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    Roadmap
                  </h3>
                  <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
                    {getPersonalizedSuggestions()}
                  </p>
                  <a
                    href="/roadmaps"
                    className="inline-flex items-center px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors duration-300 border border-purple-500/30"
                  >
                    View Roadmap
                  </a>
                </div>

                {/* Leaderboard Card */}
                <div className="relative bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg p-6 hover:shadow-2xl transition-all duration-300">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Leaderboard
                  </h3>
                  <div className="space-y-3">
                    {leaderboardData.sort((a, b) => b.total_xp - a.total_xp).slice(0, 5).map((user, index) => (
                      <div key={user.email} className={`flex justify-between items-center p-3 rounded-lg transition-all duration-300 ${
                        index === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-white/5'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-600 text-white' : 'bg-zinc-700 text-white'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="text-zinc-300 text-sm truncate">
                            {user.email.split('@')[0]}
                          </span>
                        </div>
                        <span className="text-zinc-400 text-sm font-medium">
                          {user.total_xp} XP
                        </span>
                      </div>
                    ))}
                  </div>
                  <a
                    href="/leaderboard"
                    className="inline-flex items-center px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg text-sm font-medium hover:bg-yellow-500/30 transition-colors duration-300 border border-yellow-500/30 mt-4 w-full justify-center"
                  >
                    View Full Leaderboard
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  return (
    <LenisProvider>
      <div className="min-h-screen bg-zinc-950 text-white font-sans">
        <Header />
        {renderContent()}
        <Footer />

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animate-blob {
            animation: blob 7s infinite;
          }
          .animation-delay-2000 {
            animation-delay: 2s;
          }
        `}</style>
      </div>
    </LenisProvider>
  );
};

export default Page;