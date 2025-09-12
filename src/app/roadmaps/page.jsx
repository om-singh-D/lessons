"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import Footer from '@/components/Footer';
import LenisProvider from '@/components/ui/lenisProvider';

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

        {/* Hero */}
        <section className="text-center py-12">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent leading-tight">
            Learning Roadmap & Goals
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 mb-8 max-w-3xl mx-auto font-light">
            Create personalized learning roadmaps and track your daily progress with adaptive tasks.
          </p>
        </section>

        {/* Switch view */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowRoadmapView(!showRoadmapView)}
            className="px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 transform bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-md"
          >
            {showRoadmapView ? 'Show Daily Tasks' : 'Show Roadmap'}
          </button>
        </div>

        {/* Conditional Sections */}
        {showRoadmapView ? (
          goals[activeGoal]?.roadmap && Array.isArray(goals[activeGoal].roadmap) && goals[activeGoal].roadmap.length > 0 ? (
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-300 to-emerald-300 bg-clip-text text-transparent">
                Learning Roadmap
              </h3>
              <div className="space-y-4">
                {goals[activeGoal].roadmap.map((step, index) => (
                  <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-zinc-300 font-light leading-relaxed flex-1">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-xl font-semibold text-zinc-300 mb-2">No roadmap available</h3>
              <p className="text-zinc-400 font-light">Generate a roadmap to get started with your learning journey</p>
            </div>
          )
        ) : (
          <div className="text-center text-zinc-300"> {/* placeholder for tasks UI */} Daily tasks UI here </div>
        )}

        <Footer/>
      </div>
    </LenisProvider>
  );
};

export default App;
