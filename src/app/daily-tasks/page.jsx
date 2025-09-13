"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import Footer from '@/components/Footer';
import LenisProvider from '@/components/ui/lenisProvider';
import { Calendar, Target, Zap, CheckCircle, Clock, Filter, Plus, BookOpen, Trophy, TrendingUp } from 'lucide-react';

// Base URLs
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=AIzaSyC9ordkhWuD8B7axV5wYoMswPy9ghOJfbY';
const BACKEND_URL = 'https://alchprep-backend12.vercel.app';

// Custom spinner component
const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const App = () => {
    const [goals, setGoals] = useState({});
    const [activeGoal, setActiveGoal] = useState(null); // Now initialized to null
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

    // States for difficulty, XP, and user stats (fetched from backend)
    const [difficulty, setDifficulty] = useState(1);
    const [totalXp, setTotalXp] = useState(0);
    const [userStats, setUserStats] = useState({
        total_questions: 0,
        questions_solved: 0,
        contribution_streak: 0
    });

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

    // Helper to calculate total XP from all tasks and get performance context
    const calculateTotalXPAndPerformance = () => {
        let totalXpFromTasks = 0;
        let completedTasks = 0;
        let totalTasks = 0;
        const pastQuestions = [];

        if (goals[activeGoal] && goals[activeGoal].daily_tasks) {
            for (const date in goals[activeGoal].daily_tasks) {
                const tasks = goals[activeGoal].daily_tasks[date];
                for (const taskId in tasks) {
                    const task = tasks[taskId];
                    pastQuestions.push(task.question || task.description);

                    // Calculate XP from completed tasks
                    if (task.status === 'completed' || task.completed) {
                        totalXpFromTasks += task.xp_gained || 0;
                        completedTasks++;
                    }
                    totalTasks++;
                }
            }
        }

        let performanceContext = '';
        if (totalTasks === 0) {
            performanceContext = 'The user is new and has no past performance data. Create beginner-friendly foundational tasks.';
        } else {
            const completionRate = (completedTasks / totalTasks) * 100;
            if (completionRate > 75) {
                performanceContext = `The user is performing excellently with ${completionRate.toFixed(0)}% completion rate and ${totalXpFromTasks} total XP. Create more challenging, advanced tasks.`;
            } else if (completionRate > 40) {
                performanceContext = `The user is progressing well with ${completionRate.toFixed(0)}% completion rate and ${totalXpFromTasks} total XP. Create moderately challenging tasks with good learning progression.`;
            } else {
                performanceContext = `The user has ${completionRate.toFixed(0)}% completion rate and ${totalXpFromTasks} total XP. Create easier, more engaging tasks to build confidence and momentum.`;
            }
        }

        return { totalXpFromTasks, performanceContext, pastQuestions };
    };

    // Function to save changes to the server (updated format)
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

    // Function to generate new tasks using Gemini API with XP and difficulty consideration
    const generateDailyTasks = async () => {
        if (!activeGoal) {
            console.error("No active goal selected.");
            return;
        }
        setGenerating(true);
        setApiError(null);
        const today = new Date().toISOString().split('T')[0];
        const { totalXpFromTasks, performanceContext, pastQuestions } = calculateTotalXPAndPerformance();

        // Calculate XP reward based on difficulty (higher difficulty = more XP)
        const baseXpReward = Math.max(5, Math.floor(difficulty / 50)); // Minimum 5 XP, scales with difficulty

        const prompt = `You are an AI tutor creating personalized learning tasks for a user studying "${activeGoal}".

User Profile:
- Current Difficulty Level: ${difficulty} (scale: 1-1000, where 1000 = professional level)
- Total XP Earned: ${totalXpFromTasks}
- Performance: ${performanceContext}

Task Requirements:
1. Generate exactly 3 unique daily learning tasks for ${today}
2. Each task should award ${baseXpReward}-${baseXpReward + 10} XP based on complexity
3. Adjust task difficulty based on the user's current difficulty level (${difficulty})
4. DO NOT repeat any of these past questions: ${JSON.stringify(pastQuestions.slice(-20))} // Only check last 20 to avoid huge prompts
5. Tasks should be practical, engaging, and progressive
6. Include a mix of theory and hands-on practice

For difficulty level ${difficulty}:
${difficulty < 100 ? '- Focus on absolute basics and foundational concepts' :
                difficulty < 300 ? '- Cover intermediate concepts with some practical applications' :
                    difficulty < 600 ? '- Include advanced topics and real-world scenarios' :
                        difficulty < 900 ? '- Challenge with complex problems and professional practices' :
                            '- Create expert-level tasks with cutting-edge concepts and industry standards'}

Return as JSON array with this exact structure:
[
  {
    "description": "Clear, actionable task description",
    "question": "Specific question to test understanding",
    "answer": "Correct answer for validation",
    "status": "pending",
    "xp_gained": ${baseXpReward}
  }
]`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    "type": "ARRAY",
                    "items": {
                        "type": "OBJECT",
                        "properties": {
                            "description": { "type": "STRING" },
                            "question": { "type": "STRING" },
                            "answer": { "type": "STRING" },
                            "status": { "type": "STRING" },
                            "xp_gained": { "type": "INTEGER" }
                        },
                        "propertyOrdering": ["description", "question", "answer", "status", "xp_gained"]
                    }
                }
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

        // Prepare payload for backend (matching your expected format)
        const payloadToServer = {
            goalKeyword: activeGoal,
            end_goal: goals[activeGoal]?.end_goal || "",
            daily_tasks: { [today]: newTasks },
            roadmap: goals[activeGoal]?.roadmap || {},
            progress_report: goals[activeGoal]?.progress_report || {},
            xp: totalXpFromTasks,
            difficulty_level: difficulty,
            misc: "Auto-generated personalized tasks"
        };

        const serverResponse = await saveGoalsToServer(payloadToServer);
        if (serverResponse) {
            showMessage('Daily tasks generated and saved!');
            await fetchGoals(); // Refresh data
        }
        setGenerating(false);
    };

    // Function to fetch goals from the backend
    const fetchGoals = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/goals/${userId}`);
            let data = {};
            if (response.status !== 404) {
                data = await response.json();
            }

            // Extract the goals object and user stats
            const fetchedGoals = data.goals || {};
            const fetchedUserStats = data.user_stats || {
                total_questions: 0,
                questions_solved: 0,
                contribution_streak: 0
            };

            // Set the goals and user stats
            setGoals(fetchedGoals);
            setUserStats(fetchedUserStats);

            // If an active goal isn't set, set it to the first goal in the list
            // or to an empty string if there are no goals
            if (!activeGoal) {
                const firstGoal = Object.keys(fetchedGoals)[0];
                if (firstGoal) {
                    setActiveGoal(firstGoal);
                } else {
                    setActiveGoal(""); // Set to empty string for initial task generation
                }
            }
        } catch (error) {
            console.error('Failed to fetch goals:', error);
            setApiError('Failed to connect to the server. Make sure it is running.');
        } finally {
            setLoading(false);
        }
    };

    // Function to judge the user's answer with XP and difficulty updates
    const judgeAnswer = async (task, date, taskId) => {
        setGenerating(true);
        setApiError(null);

        const prompt = `You are a helpful AI tutor judging a student's answer.

        Learning Task: "${task.description}"
        Question: "${task.question}"
        Expected Answer: "${task.answer}"
        Student's Answer: "${userAnswer}"

        Is the student's answer correct or acceptably close? Consider:
        - Exact matches are perfect
        - Conceptually correct answers should be accepted
        - Minor spelling/grammar errors are okay
        - Partial credit for partially correct answers

        Respond with exactly "CORRECT" or "INCORRECT" only.`;

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
            let xpGained = 0;

            // Update the task in goals state
            const newGoals = { ...goals };
            if (!newGoals[activeGoal]) {
                newGoals[activeGoal] = { daily_tasks: {}, difficulty_level: newDifficulty, xp: totalXp };
            }
            if (!newGoals[activeGoal].daily_tasks[date]) {
                newGoals[activeGoal].daily_tasks[date] = {};
            }

            if (judgement === 'CORRECT') {
                // Award XP and increase difficulty for correct answers
                xpGained = task.xp_gained || 10;
                newDifficulty = Math.min(difficulty + 2, 1000);

                // Update task status
                newGoals[activeGoal].daily_tasks[date][taskId] = {
                    ...task,
                    status: 'completed',
                    completed: true
                };

                setDifficulty(newDifficulty);
                setTotalXp(prev => prev + xpGained);

                showMessage(`Correct! +${xpGained} XP! 🎉${newDifficulty === 1000 ? ' You\'re now a professional! 🚀' : ''}`);

                // Update user stats locally
                setUserStats(prev => ({
                    ...prev,
                    questions_solved: (prev.questions_solved || 0) + 1,
                    total_questions: (prev.total_questions || 0) + 1,
                    contribution_streak: (prev.contribution_streak || 0) + 1
                }));
            } else {
                // Keep task as pending for incorrect answers
                newGoals[activeGoal].daily_tasks[date][taskId] = {
                    ...task,
                    status: 'pending',
                    completed: false
                };
                showMessage(`Not quite right. Try again! 💪 The correct answer was: "${task.answer}"`);
            }

            newGoals[activeGoal].difficulty_level = newDifficulty;

            // Calculate new total XP
            let newTotalXp = 0;
            for (const d in newGoals[activeGoal].daily_tasks) {
                for (const tId in newGoals[activeGoal].daily_tasks[d]) {
                    const t = newGoals[activeGoal].daily_tasks[d][tId];
                    if (t.status === 'completed' || t.completed) {
                        newTotalXp += t.xp_gained || 0;
                    }
                }
            }

            // Prepare payload for server update (matching expected format)
            const payloadToServer = {
                goalKeyword: activeGoal,
                end_goal: newGoals[activeGoal].end_goal || "",
                daily_tasks: { [date]: newGoals[activeGoal].daily_tasks[date] },
                roadmap: newGoals[activeGoal].roadmap || {},
                progress_report: newGoals[activeGoal].progress_report || {},
                xp: newTotalXp,
                difficulty_level: newDifficulty,
                misc: "Task completion update"
            };

            // Save to server
            const serverResponse = await saveGoalsToServer(payloadToServer);
            if (serverResponse) {
                setGoals(newGoals);
            }

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

    // Main effect for fetching goals initially
    useEffect(() => {
        if (userId) {
            fetchGoals();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // Effect to update difficulty and XP when the active goal changes
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        if (activeGoal !== null && goals[activeGoal]) {
            const goalData = goals[activeGoal];
            const fetchedDifficulty = goalData.difficulty_level || 1;
            setDifficulty(fetchedDifficulty);

            let calculatedTotalXp = 0;
            if (goalData.daily_tasks) {
                for (const date in goalData.daily_tasks) {
                    for (const taskId in goalData.daily_tasks[date]) {
                        const task = goalData.daily_tasks[date][taskId];
                        if (task.status === 'completed' || task.completed) {
                            calculatedTotalXp += task.xp_gained || 0;
                        }
                    }
                }
            }
            setTotalXp(calculatedTotalXp);

            // Generate tasks for today if none exist for the newly selected goal
            if (!goalData.daily_tasks || !goalData.daily_tasks[today]) {
                generateDailyTasks();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeGoal, goals]);

    const toggleExpand = (date) => {
        setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
    };

    const handleTaskClick = (task, date, taskId) => {
        if (task.status !== 'completed' && !task.completed) {
            setCurrentTask({ ...task, date, taskId });
            setShowAnswerPrompt(true);
        }
    };

    if (!userId || loading) {
        return (
            <div className="min-h-screen bg-zinc-950 text-white font-sans flex items-center justify-center">
                <div className="text-center">
                    <Spinner />
                    <p className="mt-4 text-zinc-400">Loading user data...</p>
                </div>
            </div>
        );
    }

    const goalKeywords = Object.keys(goals);

    return (
        <LenisProvider>
            <div className="min-h-screen bg-zinc-950 text-white font-sans">
                <Header />

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

                        {/* Goal Selector and Stats */}
                        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg p-6 hover:shadow-2xl transition-all duration-300">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white mb-4 md:mb-0">Select Your Goal</h2>
                                <select
                                    value={activeGoal || ""}
                                    onChange={(e) => setActiveGoal(e.target.value)}
                                    className="bg-white/10 text-white border border-white/20 rounded-lg p-3 w-full md:w-1/2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300"
                                >
                                    {goalKeywords.length > 0 ? (
                                        goalKeywords.map(goal => (
                                            <option key={goal} value={goal} className="bg-zinc-900 text-white">
                                                {goal.charAt(0).toUpperCase() + goal.slice(1) || "New Goal"}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">No goals found</option>
                                    )}
                                </select>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-center">
                                <div className="flex-1 space-y-3 mb-6 md:mb-0">
                                    <h2 className="text-3xl font-bold text-white">Goal: {activeGoal ? activeGoal.charAt(0).toUpperCase() + activeGoal.slice(1) : 'Select a Goal'}</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center">
                                            <p className="text-sm text-zinc-400">Total XP</p>
                                            <p className="text-xl text-blue-400 font-bold">{totalXp}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-zinc-400">Difficulty</p>
                                            <p className="text-xl text-purple-400 font-bold">{difficulty}</p>
                                            {difficulty === 1000 && <span className="text-xs px-2 py-1 bg-yellow-800/20 text-yellow-300 border border-yellow-700/50 rounded-full">Pro</span>}
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-zinc-400">Questions Solved</p>
                                            <p className="text-xl text-green-400 font-bold">{userStats.questions_solved}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-zinc-400">Streak</p>
                                            <p className="text-xl text-orange-400 font-bold">{userStats.contribution_streak}</p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={generateDailyTasks}
                                    disabled={generating || !activeGoal}
                                    className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform ${
                                        generating || !activeGoal
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
                        {goals[activeGoal] && goals[activeGoal].daily_tasks ? (
                            <div className="space-y-6">
                                {Object.keys(goals[activeGoal].daily_tasks).sort((a, b) => b.localeCompare(a)).map(date => (
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
                                                    const isCompleted = task.status === 'completed' || task.completed;
                                                    return (
                                                        <div
                                                            key={taskId}
                                                            className={`bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 transition-all duration-300 ${
                                                                isCompleted
                                                                    ? 'opacity-60'
                                                                    : 'hover:border-blue-500/50 hover:bg-white/10 cursor-pointer transform hover:scale-[1.02]'
                                                            }`}
                                                            onClick={() => handleTaskClick(task, date, taskId)}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className={`text-lg font-medium ${isCompleted ? 'line-through text-zinc-500' : 'text-white'}`}>
                                                                    {task.description || task.question}
                                                                </h4>
                                                                <span className="text-sm px-2 py-1 bg-blue-800/20 text-blue-300 border border-blue-700/50 rounded-full">
                                                                    {task.xp_gained || 10} XP
                                                                </span>
                                                            </div>
                                                            {task.question && task.question !== task.description && (
                                                                <p className="text-sm text-zinc-400 mb-3">Q: {task.question}</p>
                                                            )}
                                                            {isCompleted && (
                                                                <div className="flex items-center space-x-2 mt-3">
                                                                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </div>
                                                                    <p className="text-sm text-green-400">Completed! +{task.xp_gained || 10} XP</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                </div>

                {/* Modal for Answer Input */}
                {showAnswerPrompt && currentTask && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-8 w-full max-w-lg space-y-6 animate-fade-in">
                            <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                                Answer the Task
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                                    <p className="text-sm text-zinc-400 mb-2">Task:</p>
                                    <p className="text-white font-medium">{currentTask.description}</p>
                                </div>
                                {currentTask.question && currentTask.question !== currentTask.description && (
                                    <div className="bg-blue-800/10 p-4 rounded-lg border border-blue-700/30">
                                        <p className="text-sm text-blue-300 mb-2">Question:</p>
                                        <p className="text-white font-medium">{currentTask.question}</p>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-400">Reward: </span>
                                    <span className="px-2 py-1 bg-green-800/20 text-green-300 border border-green-700/50 rounded-full font-medium">
                                        +{currentTask.xp_gained || 10} XP
                                    </span>
                                </div>
                            </div>
                            <input
                                type="text"
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !generating && userAnswer.trim()) {
                                        judgeAnswer(currentTask, currentTask.date, currentTask.taskId);
                                    }
                                }}
                                className="w-full p-4 rounded-xl bg-white/5 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-md transition-all duration-300"
                                placeholder="Type your answer here..."
                                autoFocus
                            />
                            <div className="flex justify-end space-x-4">
                                <button
                                    onClick={() => {
                                        setShowAnswerPrompt(false);
                                        setUserAnswer('');
                                        setCurrentTask(null);
                                    }}
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
                                    {generating ? (
                                        <div className="flex items-center space-x-2">
                                            <Spinner />
                                            <span>Judging...</span>
                                        </div>
                                    ) : (
                                        'Submit Answer'
                                    )}
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