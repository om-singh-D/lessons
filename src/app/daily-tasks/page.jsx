"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import Footer from '@/components/Footer';
import LenisProvider from '@/components/ui/lenisProvider';
import { Calendar, Target, Zap, CheckCircle, Clock, Filter, Plus, BookOpen, Trophy, TrendingUp } from 'lucide-react';

// Base URLs
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=AIzaSyC9ordkhWuD8B7axV5wYoMswPy9ghOJfbY';
const BACKEND_URL = 'http://localhost:8080'; // Updated to the base URL

// Custom spinner component
const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const App = () => {
  const [goals, setGoals] = useState({});
  // Default activeGoal is now null, it will be set by the fetch call
  const [activeGoal, setActiveGoal] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userId, setUserId] = useState(null);
  const [expandedDates, setExpandedDates] = useState({});
  const [apiError, setApiError] = useState(null);
  const [message, setMessage] = useState('');

  // State for the interactive task
  const [showAnswerPrompt, setShowAnswerPrompt] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentTask, setCurrentTask] = useState(null);

  // New states for difficulty and XP
  const [difficulty, setDifficulty] = useState(1);
  const [xp, setXp] = useState(0);

  // Function to show a custom message
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  // Effect to check for user authentication on mount
  useEffect(() => {
    const userEmail = localStorage.getItem('email') || "vermanickb75@gmail.com";
    if (userEmail) {
      setUserId(userEmail);
      localStorage.setItem('email', userEmail);
    }
  }, []);

  // Helper to calculate past performance and retrieve past questions
  const getPerformanceAndPastQuestions = () => {
    let completedTasks = 0;
    let totalTasks = 0;
    const pastQuestions = [];

    if (goals[activeGoal] && goals[activeGoal].daily_tasks) {
      for (const date in goals[activeGoal].daily_tasks) {
        const tasks = goals[activeGoal].daily_tasks[date];
        for (const taskId in tasks) {
          pastQuestions.push(tasks[taskId].question);
          if (tasks[taskId].completed) completedTasks++;
          totalTasks++;
        }
      }
    }
    
    let performanceContext = '';
    if (totalTasks === 0) {
      performanceContext = 'The user is new and has no past performance data. Suggesting foundational tasks.';
    } else {
      const completionRate = (completedTasks / totalTasks) * 100;
      if (completionRate > 75) {
        performanceContext = `The user is performing very well, with a completion rate of ${completionRate.toFixed(0)}%. Suggest more advanced or challenging tasks.`;
      } else if (completionRate > 40) {
        performanceContext = `The user is progressing steadily, with a completion rate of ${completionRate.toFixed(0)}%. Suggest a mix of foundational and new tasks.`;
      } else {
        performanceContext = `The user has a low completion rate of ${completionRate.toFixed(0)}%. Suggest easier, more manageable tasks to help build momentum.`;
      }
    }
    return { performanceContext, pastQuestions };
  };

  // Function to save changes to the server
  const saveGoalsToServer = async (payload) => {
    try {
      const response = await fetch(`${BACKEND_URL}/goals/${userId}`, {
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

  // Function to generate new tasks using Gemini API
  const generateDailyTasks = async () => {
    setGenerating(true);
    setApiError(null);
    const today = new Date().toISOString().split('T')[0];
    const { performanceContext, pastQuestions } = getPerformanceAndPastQuestions();
    
    // Adjusted prompt to include past questions to avoid repetition
    const prompt = `You are a helpful assistant for a user working on a goal related to ${activeGoal}. The user's current difficulty level is ${difficulty} (on a scale of 1-1000). Based on the following past performance data: "${performanceContext}", generate a list of three to four brand new, simple daily tasks for today (${today}). DO NOT repeat any of the following past questions: ${JSON.stringify(pastQuestions)}. Adjust the complexity of the tasks based on the difficulty level (e.g., a difficulty of 10 is much easier than a difficulty of 900). Each task must be related to the goal and should be easy to understand. For each task, provide a concise question and a short, correct answer. Return the output as a JSON array in the following format: [{ "question": "...", "answer": "...", "completed": false }]`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: { "type": "ARRAY", "items": { "type": "OBJECT", "properties": { "question": { "type": "STRING" }, "answer": { "type": "STRING" }, "completed": { "type": "BOOLEAN" } }, "propertyOrdering": ["question", "answer", "completed"] } }
      }
    };

    let generatedTasks;
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      generatedTasks = result?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedTasks) throw new Error("Invalid response from Gemini API.");
      generatedTasks = JSON.parse(generatedTasks);
    } catch (error) {
      console.error("Gemini API call failed:", error);
      setApiError('Failed to generate tasks. Please check your internet connection.');
      setGenerating(false);
      return;
    }

    const newTasks = {};
    generatedTasks.forEach((task, index) => {
      newTasks[`task${index + 1}`] = task;
    });

    const payloadToServer = {
      goalKeyword: activeGoal,
      daily_tasks: { [today]: newTasks },
      difficulty_level: difficulty,
      xp: xp
    };

    const serverResponse = await saveGoalsToServer(payloadToServer);
    if (serverResponse) {
      showMessage('Daily tasks generated and saved!');
      fetchGoals();
    }
    setGenerating(false);
  };

  // Function to fetch goals from the backend
  const fetchGoals = async () => {
    if (!userId) return;
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    try {
      const response = await fetch(`${BACKEND_URL}/goals/${userId}`);
      let data = {};
      if (response.status !== 404) {
        data = await response.json();
      }

      // Extract the goals object
      const fetchedGoals = data.goals || {};

      // Set the goals and identify the active goal
      setGoals(fetchedGoals);
      const goalKeyword = "Learn JavaScript"; // Use the fixed goal keyword
      setActiveGoal(goalKeyword);

      // The rest of the logic remains the same
      const fetchedDifficulty = fetchedGoals[goalKeyword]?.difficulty_level || 1;
      const fetchedXp = fetchedGoals[goalKeyword]?.xp || 0;
      setDifficulty(fetchedDifficulty);
      setXp(fetchedXp);
      
      if (!fetchedGoals[goalKeyword]?.daily_tasks?.[today]) {
        await generateDailyTasks();
      }
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      setApiError('Failed to connect to the server. Make sure it is running.');
    } finally {
      setLoading(false);
    }
  };

  // Function to judge the user's answer
  const judgeAnswer = async (task, date, taskId) => {
    setGenerating(true);
    setApiError(null);

    const prompt = `You are a helpful assistant that judges a user's answer to a task.
    Task: "${task.question}"
    Correct Answer: "${task.answer}"
    User's Answer: "${userAnswer}"
    Is the user's answer correct or close enough? Respond with "CORRECT" or "INCORRECT".`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "text/plain" }
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      const judgement = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();

      let newDifficulty = difficulty;
      let newXp = xp;
      
      if (judgement === 'CORRECT') {
        newDifficulty = Math.min(difficulty + 2, 1000);
        newXp = xp + 10;
        setXp(newXp);
        setDifficulty(newDifficulty);
        showMessage('Correct! XP +10! 🎉');
        if (newDifficulty === 1000) {
          showMessage("You've become a professional! 🚀");
        }
      } else {
        // No change in difficulty for an incorrect answer
        showMessage('That’s not quite right. Keep going! 💪');
      }

      // Update the server with the new state
      const newGoals = { ...goals };
      newGoals[activeGoal].daily_tasks[date][taskId].completed = (judgement === 'CORRECT');
      newGoals[activeGoal].difficulty_level = newDifficulty;
      newGoals[activeGoal].xp = newXp;

      const payloadToServer = {
        goalKeyword: activeGoal,
        daily_tasks: { [date]: newGoals[activeGoal].daily_tasks[date] },
        difficulty_level: newDifficulty,
        xp: newXp
      };
      await saveGoalsToServer(payloadToServer);
      setGoals(newGoals);

    } catch (error) {
      console.error("Gemini API call failed:", error);
      setApiError('Failed to judge answer. Please try again.');
    } finally {
      setGenerating(false);
      setShowAnswerPrompt(false);
      setUserAnswer('');
      setCurrentTask(null);
    }
  };

  // Main effect for fetching goals
  useEffect(() => {
    if (userId) {
      fetchGoals();
    }
  }, [userId]); // Removed activeGoal from dependency array

  const toggleExpand = (date) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const handleLogout = () => {
    localStorage.removeItem('email');
     localStorage.removeItem('token');
      localStorage.removeItem('username');
    window.location.reload(); // Simple reload to "log out"
  };

  const handleTaskClick = (task, date, taskId) => {
    if (!task.completed) {
      setCurrentTask({ ...task, date, taskId });
      setShowAnswerPrompt(true);
    }
  };

  if (!userId || !activeGoal) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white font-sans flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-4 text-zinc-400">Loading user data...</p>
        </div>
      </div>
    );
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

        <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
          <div className="w-full max-w-7xl mx-auto font-sans space-y-8">
            {/* Hero Section */}
            <section className="text-center py-12">
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent leading-tight">
                Daily Goal Tracker
              </h1>
              <p className="text-lg md:text-xl text-zinc-300 mb-8 max-w-3xl mx-auto font-light">
                Track your progress, complete daily tasks, and level up your skills with personalized challenges.
              </p>
            </section>
            
            {/* Status Message */}
            {apiError && (
              <div className="bg-red-800/20 text-red-300 border border-red-700/50 p-4 rounded-xl text-center font-medium shadow-lg animate-fade-in backdrop-blur-md">
                {apiError}
              </div>
            )}
            {message && (
              <div className="bg-green-800/20 text-green-300 border border-green-700/50 p-4 rounded-xl text-center font-medium shadow-lg animate-fade-in-out backdrop-blur-md">
                {message}
              </div>
            )}

            {/* Goal Stats and Task Generation */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex-1 space-y-3 mb-6 md:mb-0">
                  <h2 className="text-3xl font-bold text-white">Goal: {activeGoal}</h2>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <p className="text-lg text-zinc-300">
                      Current XP: <span className="text-blue-400 font-bold">{xp}</span>
                    </p>
                    <p className="text-lg text-zinc-300">
                      Difficulty: <span className="text-purple-400 font-bold">{difficulty}</span>
                      {difficulty === 1000 && <span className="ml-2 px-2 py-1 bg-yellow-800/20 text-yellow-300 border border-yellow-700/50 rounded-full text-sm">Professional</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => generateDailyTasks()}
                  disabled={generating}
                  className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform ${
                    generating 
                      ? 'bg-white/10 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-105 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {generating ? (
                    <div className="flex items-center space-x-2">
                      <Spinner />
                      <span>Generating...</span>
                    </div>
                  ) : (
                    'Generate New Tasks'
                  )}
                </button>
              </div>
            </div>
            
            {/* Tasks List */}
            {loading ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 animate-pulse"></div>
                <p className="text-zinc-400 font-light text-lg">Loading your daily tasks...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {goals && goals[activeGoal] && goals[activeGoal].daily_tasks && Object.keys(goals[activeGoal].daily_tasks).length > 0 ? (
                  Object.keys(goals[activeGoal].daily_tasks).sort((a,b) => b.localeCompare(a)).map(date => (
                    <div key={date} className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300">
                      <button
                        className="w-full flex justify-between items-center text-left p-6"
                        onClick={() => toggleExpand(date)}
                      >
                        <h3 className="text-2xl font-bold text-white">Tasks for {date}</h3>
                        <svg
                          className={`w-6 h-6 transform transition-transform duration-300 text-zinc-400 ${expandedDates[date] ? 'rotate-180' : ''}`}
                          fill="currentColor" viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <div className={`transition-all duration-500 ease-in-out ${expandedDates[date] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                        <div className="px-6 pb-6 border-t border-white/10 pt-6 space-y-4">
                          {Object.keys(goals[activeGoal].daily_tasks[date]).map(taskId => {
                            const task = goals[activeGoal].daily_tasks[date][taskId];
                            return (
                              <div
                                key={taskId}
                                className={`bg-white/5 backdrop-blur-md p-4 rounded-xl flex flex-col items-start space-y-3 border border-white/10 transition-all duration-300 ${
                                  task.completed 
                                    ? 'opacity-60' 
                                    : 'hover:border-blue-500/50 hover:bg-white/10 cursor-pointer transform hover:scale-[1.02]'
                                }`}
                                onClick={() => handleTaskClick(task, date, taskId)}
                              >
                                <h4 className={`text-lg font-medium ${task.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
                                  {task.question}
                                </h4>
                                {task.completed && (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <p className="text-sm text-zinc-400">Correct Answer: {task.answer}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
                    <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-300 mb-2">No tasks found</h3>
                    <p className="text-zinc-400 font-light">Tasks will be automatically generated for "{activeGoal}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Modal for Answer Input */}
        {showAnswerPrompt && currentTask && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-8 w-full max-w-lg space-y-6 animate-fade-in">
              <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Answer the Task
              </h3>
              <p className="text-lg text-zinc-300 text-center font-light">{currentTask.question}</p>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') judgeAnswer(currentTask, currentTask.date, currentTask.taskId);
                }}
                className="w-full p-4 rounded-xl bg-white/5 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-md transition-all duration-300"
                placeholder="Type your answer here..."
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowAnswerPrompt(false)}
                  className="px-6 py-3 rounded-xl font-semibold text-zinc-300 bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => judgeAnswer(currentTask, currentTask.date, currentTask.taskId)}
                  disabled={generating || userAnswer.trim() === ''}
                  className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
                    generating || userAnswer.trim() === '' 
                      ? 'bg-white/10 opacity-50 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg'
                  }`}
                >
                  {generating ? <Spinner /> : 'Submit Answer'}
                </button>
              </div>
            </div>
          </div>
        )}
        
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
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
          @keyframes fade-in-out {
            0% { opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { opacity: 0; }
          }
          .animate-fade-in-out {
            animation: fade-in-out 3s ease-in-out;
          }
        `}</style>
      </div>
    </LenisProvider>
  );
};

export default App;