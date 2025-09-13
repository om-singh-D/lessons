"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import Footer from '@/components/Footer';
import LenisProvider from '@/components/ui/lenisProvider';
import { Calendar, Target, Zap, CheckCircle, Clock, Filter, Plus, BookOpen, Trophy, TrendingUp, UserCircle, Briefcase } from 'lucide-react';

// Base URLs
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=AIzaSyC9ordkhWuD8B7axV5wYoMswPy9ghOJfbY';
const BACKEND_URL = 'http://localhost:8080';

// Custom spinner component
const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const App = () => {
    const [goals, setGoals] = useState({});
    const [activeGoal, setActiveGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [userId, setUserId] = useState(null);
    const [expandedDates, setExpandedDates] = useState({});
    const [apiError, setApiError] = useState(null);
    const [message, setMessage] = useState('');
    const [userStats, setUserStats] = useState({});
    const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
    const [newGoalKeyword, setNewGoalKeyword] = useState('');
    const [newEndGoal, setNewEndGoal] = useState('');
    const [showAnswerPrompt, setShowAnswerPrompt] = useState(false);
    const [userAnswer, setUserAnswer] = useState('');
    const [currentTask, setCurrentTask] = useState(null);
    const [totalXp, setTotalXp] = useState(0);

    const showMessage = (msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(''), 3000);
    };

    useEffect(() => {
        const userEmail = localStorage.getItem('email') || "vermanickb75@gmail.com";
        if (userEmail) {
            setUserId(userEmail);
            localStorage.setItem('email', userEmail);
        }
    }, []);

    const getPerformanceAndPastQuestions = () => {
        let completedTasks = 0;
        let totalTasks = 0;
        const pastQuestions = [];
        if (goals[activeGoal] && goals[activeGoal].daily_tasks) {
            for (const date in goals[activeGoal].daily_tasks) {
                const tasks = goals[activeGoal].daily_tasks[date];
                for (const taskId in tasks) {
                    const task = tasks[taskId];
                    pastQuestions.push(task.description || task.question);
                    if (task.status === "completed" || task.completed) completedTasks++;
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

    const saveGoalsToServer = async (payload) => {
        try {
            const response = await fetch(`${BACKEND_URL}/goals/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error('Failed to save goals to the server.');
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to save goals:', error);
            setApiError('Failed to connect to the server. Make sure it is running.');
            return null;
        }
    };

    const saveUserStatsToServer = async (payload) => {
        try {
            const response = await fetch(`${BACKEND_URL}/user/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error('Failed to save user stats to the server.');
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to save user stats:', error);
            setApiError('Failed to connect to the server. Make sure it is running.');
            return null;
        }
    };

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

            const fetchedGoals = data.goals || {};
            setGoals(fetchedGoals);

            // Fetch and set the first goal as active if it exists
            const firstGoalKeyword = Object.keys(fetchedGoals)[0];
            if (firstGoalKeyword) {
                setActiveGoal(firstGoalKeyword);
                const fetchedGoal = fetchedGoals[firstGoalKeyword];
                if (!fetchedGoal.daily_tasks?.[today]) {
                    await generateDailyTasks(firstGoalKeyword);
                }
            }
        } catch (error) {
            console.error('Failed to fetch goals:', error);
            setApiError('Failed to connect to the server. Make sure it is running.');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserData = async () => {
        if (!userId) return;
        try {
            const response = await fetch(`${BACKEND_URL}/user/${userId}`);
            if (response.status !== 404) {
                const data = await response.json();
                setUserStats(data);
                setTotalXp(Object.values(data.xp || {}).reduce((sum, points) => sum + points, 0));
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            setApiError('Failed to connect to the server. Make sure it is running.');
        }
    };

    const generateDailyTasks = async (goalKeyword) => {
        setGenerating(true);
        setApiError(null);
        const today = new Date().toISOString().split('T')[0];
        const { performanceContext, pastQuestions } = getPerformanceAndPastQuestions();
        const difficulty = goals[goalKeyword]?.difficulty_level || 1;

        const prompt = `Generate 3-4 simple daily tasks for goal "${goalKeyword}". Return JSON: [{ "description": "...", "answer": "...", "status": "pending", "xp_gained": 0 }]`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json"
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

        // Convert to the sticky format used in first code
        const newTasks = {};
        generatedTasks.forEach((task, index) => {
            newTasks[`task${index + 1}`] = {
                description: task.description,
                answer: task.answer,
                status: "pending",
                xp_gained: 0
            };
        });

        const payloadToServer = {
            goalKeyword: goalKeyword,
            daily_tasks: { [today]: newTasks },
        };

        const serverResponse = await saveGoalsToServer(payloadToServer);
        if (serverResponse) {
            showMessage('Daily tasks generated and saved!');
            fetchGoals();
            fetchUserData();
        }
        setGenerating(false);
    };

    // Updated judgeAnswer function with sticky logic from first code
    const judgeAnswer = async (task, date, taskId) => {
        setGenerating(true);
        setApiError(null);
        const prompt = `Task: "${task.description || task.question}", Correct: "${task.answer}", User: "${userAnswer}". Respond "CORRECT" or "INCORRECT".`;

        const payload = { 
            contents: [{ parts: [{ text: prompt }] }], 
            generationConfig: { responseMimeType: "text/plain" } 
        };

        try {
            const res = await fetch(API_URL, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            });
            const result = await res.json();
            const judgement = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase();

            let newGoals = { ...goals };
            let xpGain = 0;
            
            if (judgement === "CORRECT") {
                xpGain = 25;
                showMessage(`Correct! +${xpGain} XP`);

                // Update task with sticky completion status
                newGoals[activeGoal].daily_tasks[date][taskId] = {
                    description: task.description || task.question,
                    answer: task.answer,
                    status: "completed",
                    xp_gained: xpGain
                };

                // Save the updated task to server with sticky format
                await saveGoalsToServer({
                    goalKeyword: activeGoal,
                    daily_tasks: {
                        [date]: {
                            [taskId]: newGoals[activeGoal].daily_tasks[date][taskId]
                        }
                    }
                });
            } else {
                showMessage("Incorrect, try again!");
            }
            
            setGoals(newGoals);
            fetchUserData();
        } catch (err) {
            console.error(err);
            setApiError("Failed to judge answer.");
        } finally {
            setGenerating(false);
            setShowAnswerPrompt(false);
            setUserAnswer('');
            setCurrentTask(null);
        }
    };

    const createNewGoal = async () => {
        if (!newGoalKeyword || !newEndGoal) {
            alert("Please provide a goal keyword and end goal.");
            return;
        }

        const payload = {
            goalKeyword: newGoalKeyword,
            end_goal: newEndGoal
        };

        const serverResponse = await saveGoalsToServer(payload);
        if (serverResponse) {
            showMessage(`Goal "${newGoalKeyword}" created successfully!`);
            setShowCreateGoalModal(false);
            setNewGoalKeyword('');
            setNewEndGoal('');
            fetchGoals(); // Re-fetch all goals to update the UI
        }
    };

    useEffect(() => {
        if (userId) {
            fetchGoals();
            fetchUserData();
        }
    }, [userId]);

    const toggleExpand = (date) => {
        setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
    };

    const handleLogout = () => {
        localStorage.removeItem('email');
        window.location.reload();
    };

    // Updated handleTaskClick to work with sticky format
    const handleTaskClick = (task, date, taskId) => {
        if (!(task.status === "completed" || task.completed)) {
            setCurrentTask({ ...task, date, taskId });
            setShowAnswerPrompt(true);
        }
    };

    const handleGoalSelect = (goalKeyword) => {
        setActiveGoal(goalKeyword);
    };

    if (!userId) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white font-sans flex items-center justify-center">
                <div className="text-center">
                    <p className="mt-4 text-zinc-400">Please provide a user ID to start tracking goals.</p>
                </div>
            </div>
        );
    }

    return (
        <LenisProvider>
            <div className="min-h-screen bg-zinc-950 text-white font-sans">
                <Header />
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
                            <div className="flex justify-center items-center gap-4">
                                <button
                                    onClick={() => setShowCreateGoalModal(true)}
                                    className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
                                >
                                    <Plus size={18} /> New Goal
                                </button>
                                <button
                                    onClick={() => {
                                        alert(`User Stats:\nTotal XP: ${totalXp}\nTotal Questions: ${userStats.total_questions}\nMax Questions in a Day: ${userStats.max_questions_in_a_day}`);
                                    }}
                                    className="px-6 py-3 rounded-xl font-semibold text-zinc-300 bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-md flex items-center gap-2"
                                >
                                    <TrendingUp size={18} /> Show Stats
                                </button>
                            </div>
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

                        {/* Goal Selector */}
                        {Object.keys(goals).length > 1 && (
                            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg p-4 flex flex-wrap gap-2">
                                <span className="text-zinc-400 font-medium self-center mr-2">Switch Goal:</span>
                                {Object.keys(goals).map(goalKeyword => (
                                    <button
                                        key={goalKeyword}
                                        onClick={() => handleGoalSelect(goalKeyword)}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                                            activeGoal === goalKeyword
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-white/10 text-zinc-300 hover:bg-white/20'
                                        }`}
                                    >
                                        {goalKeyword}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Current Goal Stats and Task Generation */}
                        {activeGoal && goals[activeGoal] && (
                            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg p-6 hover:shadow-2xl transition-all duration-300">
                                <div className="flex flex-col md:flex-row justify-between items-center">
                                    <div className="flex-1 space-y-3 mb-6 md:mb-0">
                                        <h2 className="text-3xl font-bold text-white">Goal: {activeGoal}</h2>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <p className="text-lg text-zinc-300 flex items-center gap-2">
                                                <Trophy size={20} className="text-blue-400" />
                                                Goal XP: <span className="text-blue-400 font-bold">{goals[activeGoal].xp || 0}</span>
                                            </p>
                                            <p className="text-lg text-zinc-300 flex items-center gap-2">
                                                <Filter size={20} className="text-purple-400" />
                                                Difficulty: <span className="text-purple-400 font-bold">{goals[activeGoal].difficulty_level || 1}</span>
                                                {goals[activeGoal].difficulty_level === 1000 && <span className="ml-2 px-2 py-1 bg-yellow-800/20 text-yellow-300 border border-yellow-700/50 rounded-full text-sm">Professional</span>}
                                            </p>
                                        </div>
                                        <p className="text-md text-zinc-300 flex items-center gap-2">
                                            <Target size={20} className="text-green-400" />
                                            End Goal: <span className="text-zinc-200 font-medium">{goals[activeGoal].end_goal || 'Not set'}</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => generateDailyTasks(activeGoal)}
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
                        )}
                        
                        {/* Tasks List - Updated to work with sticky format */}
                        {loading ? (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 animate-pulse"></div>
                                <p className="text-zinc-400 font-light text-lg">Loading your daily tasks...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {activeGoal && goals[activeGoal] && goals[activeGoal].daily_tasks && Object.keys(goals[activeGoal].daily_tasks).length > 0 ? (
                                    Object.keys(goals[activeGoal].daily_tasks).sort((a, b) => b.localeCompare(a)).map(date => (
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
                                                        const isCompleted = task.status === "completed" || task.completed;
                                                        return (
                                                            <div
                                                                key={taskId}
                                                                className={`bg-white/5 backdrop-blur-md p-4 rounded-xl flex flex-col items-start space-y-3 border border-white/10 transition-all duration-300 ${
                                                                    isCompleted
                                                                        ? 'opacity-60'
                                                                        : 'hover:border-blue-500/50 hover:bg-white/10 cursor-pointer transform hover:scale-[1.02]'
                                                                }`}
                                                                onClick={() => handleTaskClick(task, date, taskId)}
                                                            >
                                                                <h4 className={`text-lg font-medium ${isCompleted ? 'line-through text-zinc-500' : 'text-white'}`}>
                                                                    {task.description || task.question}
                                                                </h4>
                                                                {isCompleted && (
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                            </svg>
                                                                        </div>
                                                                        <p className="text-sm text-zinc-400">Answer: {task.answer}</p>
                                                                        {task.xp_gained > 0 && <span className="ml-auto text-purple-400 font-semibold">+{task.xp_gained} XP</span>}
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
                                        <h3 className="text-xl font-semibold text-zinc-300 mb-2">No goals found</h3>
                                        <p className="text-zinc-400 font-light">Click "New Goal" to get started.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal for Create Goal */}
                {showCreateGoalModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-8 w-full max-w-lg space-y-6 animate-fade-in">
                            <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-green-300 to-teal-300 bg-clip-text text-transparent">
                                Create a New Goal
                            </h3>
                            <input
                                type="text"
                                value={newGoalKeyword}
                                onChange={(e) => setNewGoalKeyword(e.target.value)}
                                className="w-full p-4 rounded-xl bg-white/5 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 backdrop-blur-md transition-all duration-300"
                                placeholder="Enter Goal Keyword (e.g., 'Learn JavaScript')"
                            />
                            <input
                                type="text"
                                value={newEndGoal}
                                onChange={(e) => setNewEndGoal(e.target.value)}
                                className="w-full p-4 rounded-xl bg-white/5 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 backdrop-blur-md transition-all duration-300"
                                placeholder="Enter End Goal (e.g., 'Build a full-stack app')"
                            />
                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={() => setShowCreateGoalModal(false)}
                                    className="px-6 py-3 rounded-xl font-semibold text-zinc-300 bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createNewGoal}
                                    disabled={!newGoalKeyword || !newEndGoal}
                                    className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
                                        !newGoalKeyword || !newEndGoal
                                            ? 'bg-white/10 opacity-50 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 shadow-lg'
                                    }`}
                                >
                                    Create Goal
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Modal for Answer Input */}
                {showAnswerPrompt && currentTask && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-8 w-full max-w-lg space-y-6 animate-fade-in">
                            <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                                Answer the Task
                            </h3>
                            <p className="text-lg text-zinc-300 text-center font-light">{currentTask.description || currentTask.question}</p>
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
                
                <Footer />
                
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