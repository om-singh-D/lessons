"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import Footer from '@/components/Footer';
import LenisProvider from '@/components/ui/lenisProvider';
import { MapPin, Target, Clock, CheckCircle, ArrowRight, Filter, BookOpen, Zap, TrendingUp, Users } from 'lucide-react';

// Base URLs
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=AIzaSyC9ordkhWuD8B7axV5wYoMswPy9ghOJfbY';
const BACKEND_URL = 'http://localhost:8080/goals';

// Custom spinner component
const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const availableGoals = [
  { id: 'AI', name: 'Artificial Intelligence', icon: '🤖', color: 'from-blue-500 to-purple-600' },
  { id: 'DataScience', name: 'Data Science', icon: '📊', color: 'from-green-500 to-blue-600' },
  { id: 'WebDev', name: 'Web Development', icon: '💻', color: 'from-orange-500 to-red-600' },
  { id: 'Mobile', name: 'Mobile Development', icon: '📱', color: 'from-purple-500 to-pink-600' },
  { id: 'DevOps', name: 'DevOps', icon: '⚙️', color: 'from-teal-500 to-green-600' }
];

const App = () => {
  const [goals, setGoals] = useState({});
  const [activeGoal, setActiveGoal] = useState('AI');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userId, setUserId] = useState(null);
  const [expandedDates, setExpandedDates] = useState({});
  const [apiError, setApiError] = useState(null);
  const [message, setMessage] = useState('');

  // States for the interactive task
  const [showAnswerPrompt, setShowAnswerPrompt] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentTask, setCurrentTask] = useState(null);

  // States for difficulty and XP
  const [difficulty, setDifficulty] = useState(1);
  const [xp, setXp] = useState(0);

  // States for Roadmap generation
  const [showRoadmapPrompt, setShowRoadmapPrompt] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

  // State to toggle between tasks and roadmap view
  const [showRoadmapView, setShowRoadmapView] = useState(false);

  // Function to show a custom message
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  // Effect to check for user authentication on mount
  useEffect(() => {
    const userEmail = localStorage.getItem('email') || "vermanickb75@gmail.com"; // ✅ use your email
    if (userEmail) {
      setUserId(userEmail);
      localStorage.setItem('email', userEmail);
    }
  }, []);

  // Function to save changes to the server
  const saveGoalsToServer = async (payload) => {
    try {
      const response = await fetch(`${BACKEND_URL}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Failed to save tasks to the server.');
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to save goals:', error);
      setApiError('Failed to connect to the server. Make sure it is running.');
      return null;
    }
  };

  // ✅ Modified fetchGoals to normalize roadmap
  const fetchGoals = async () => {
    if (!userId) return;
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      // Fetch full user goals
      const response = await fetch(`${BACKEND_URL}/${userId}`);
      let data = {};
      if (response.status !== 404) {
        data = await response.json();
      }

      // Normalize roadmap if object with numeric keys
      if (data.goals && data.goals[activeGoal]?.roadmap) {
        const roadmapData = data.goals[activeGoal].roadmap;
        if (roadmapData && typeof roadmapData === "object" && !Array.isArray(roadmapData)) {
          data.goals[activeGoal].roadmap = Object.keys(roadmapData)
            .sort((a, b) => Number(a) - Number(b))
            .map(key => roadmapData[key]);
        }
      }

      const fetchedDifficulty = data.goals?.[activeGoal]?.difficulty_level || 1;
      const fetchedXp = data.goals?.[activeGoal]?.xp || 0;

      setDifficulty(fetchedDifficulty);
      setXp(fetchedXp);
      setGoals(data.goals || {});

      // Auto-generate tasks if today's tasks are missing
      if (!data.goals?.[activeGoal]?.daily_tasks?.[today]) {
        await generateDailyTasks();
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      setApiError('Failed to connect to the server. Make sure it is running.');
    } finally {
      setLoading(false);
    }
  };

  // --- keep your existing generateDailyTasks, judgeAnswer, generateRoadmap, etc. ---
  // (not repeating them here for brevity, just keep them exactly the same as your code)

  // Main effect for fetching goals
  useEffect(() => {
    if (userId) {
      fetchGoals();
    }
  }, [userId, activeGoal]);

  const toggleExpand = (date) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const handleTaskClick = (task, date, taskId) => {
    if (!task.completed) {
      setCurrentTask({ ...task, date, taskId });
      setShowAnswerPrompt(true);
    }
  };

  const handleRoadmapClick = () => {
    setShowRoadmapPrompt(true);
  };

  const getButtonText = () => {
    if (generatingRoadmap) return (
      <div className="flex items-center space-x-2"><Spinner /><span>Generating...</span></div>
    );
    const roadmapExists = (goals[activeGoal]?.roadmap && Array.isArray(goals[activeGoal].roadmap) && goals[activeGoal].roadmap.length > 0);
    return roadmapExists ? 'Update Roadmap' : 'Generate Roadmap';
  };

  const levels = ["beginner", "intermediate", "above avg", "professional"];

  if (!userId) {
    return null;
  }

  return (
    <LenisProvider>
      <div className="min-h-screen bg-zinc-950 text-white font-sans">
        <Header/>
        
        {/* Background gradient effect */}
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10">
          {/* Hero Section */}
          <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent leading-tight">
                Learning Roadmaps
              </h1>
              <p className="text-lg md:text-xl text-zinc-300 mb-8 max-w-3xl mx-auto font-light">
                Create personalized learning roadmaps and track your progress with structured, adaptive learning paths.
              </p>
            </div>
          </section>

          {/* Goal Selection */}
          <section className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white mb-6 text-center">Choose Your Learning Path</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {availableGoals.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => setActiveGoal(goal.id)}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        activeGoal === goal.id
                          ? 'bg-white/10 border-blue-500/50 shadow-lg scale-105'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{goal.icon}</div>
                        <p className="text-white font-medium text-sm">{goal.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Messages */}
              {apiError && (
                <div className="bg-red-800/20 text-red-300 border border-red-700/50 p-4 rounded-xl text-center font-medium shadow-lg mb-6 backdrop-blur-md">
                  {apiError}
                </div>
              )}
              {message && (
                <div className="bg-green-800/20 text-green-300 border border-green-700/50 p-4 rounded-xl text-center font-medium shadow-lg mb-6 backdrop-blur-md">
                  {message}
                </div>
              )}

              {/* Roadmap Generation Section */}
              <div className="relative bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg p-6 mb-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-blue-400" />
                      {availableGoals.find(g => g.id === activeGoal)?.name} Roadmap
                    </h3>
                    <p className="text-zinc-300 mb-4">
                      Current Difficulty: <span className="text-purple-400 font-bold">{difficulty}</span>
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <select
                        value={selectedLevel}
                        onChange={(e) => setSelectedLevel(e.target.value)}
                        className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-md"
                      >
                        <option value="beginner" className="bg-zinc-900">Beginner</option>
                        <option value="intermediate" className="bg-zinc-900">Intermediate</option>
                        <option value="advanced" className="bg-zinc-900">Advanced</option>
                        <option value="expert" className="bg-zinc-900">Expert</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={generateRoadmap}
                    disabled={generatingRoadmap}
                    className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
                      generatingRoadmap 
                        ? 'bg-white/10 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-105 shadow-lg'
                    }`}
                  >
                    {generatingRoadmap ? (
                      <div className="flex items-center gap-2">
                        <Spinner />
                        <span>Generating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        <span>Generate Roadmap</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Main Content */}
              {loading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                  <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-400"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Roadmap Display */}
                  {goals[activeGoal]?.roadmap && Array.isArray(goals[activeGoal].roadmap) && goals[activeGoal].roadmap.length > 0 ? (
                    <div className="relative bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg p-6">
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <Target className="w-6 h-6 text-green-400" />
                        Learning Path
                      </h3>
                      <div className="space-y-4">
                        {goals[activeGoal].roadmap.map((step, index) => (
                          <div key={index} className="relative bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6 hover:shadow-lg transition-all duration-300 group">
                            {/* Connector Line */}
                            {index < goals[activeGoal].roadmap.length - 1 && (
                              <div className="absolute left-8 top-16 w-0.5 h-8 bg-gradient-to-b from-blue-400 to-purple-400 opacity-30"></div>
                            )}
                            
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-zinc-300 leading-relaxed group-hover:text-white transition-colors duration-300">
                                  {step}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <CheckCircle className="w-5 h-5 text-zinc-600 group-hover:text-green-400 transition-colors duration-300" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="relative bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg p-12">
                        <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-zinc-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-zinc-300 mb-2">No roadmap available</h3>
                        <p className="text-zinc-400 font-light mb-6">Generate a personalized roadmap to start your {availableGoals.find(g => g.id === activeGoal)?.name} journey</p>
                        <button
                          onClick={generateRoadmap}
                          disabled={generatingRoadmap}
                          className="px-6 py-3 bg-blue-500/20 text-blue-300 rounded-lg font-medium hover:bg-blue-500/30 transition-colors duration-300 border border-blue-500/30"
                        >
                          {generatingRoadmap ? <Spinner /> : 'Generate First Roadmap'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <Footer/>
        
        <style jsx>{`
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

export default App;
