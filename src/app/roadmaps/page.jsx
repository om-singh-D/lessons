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

const App = () => {
    const [goals, setGoals] = useState({});
    const [availableGoals, setAvailableGoals] = useState([]);
    const [activeGoal, setActiveGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [userId, setUserId] = useState(null);
    const [expandedDates, setExpandedDates] = useState({});
    const [apiError, setApiError] = useState(null);
    const [message, setMessage] = useState('');

    // States for initial setup
    const [showInitialSetup, setShowInitialSetup] = useState(false);
    const [selectedGoalForSetup, setSelectedGoalForSetup] = useState(null);
    const [selectedLevelForSetup, setSelectedLevelForSetup] = useState('beginner');

    // States for the interactive task (kept for consistency)
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
        const userEmail = localStorage.getItem('email') || "vermanickb75@gmail.com";
        if (userEmail) {
            setUserId(userEmail);
            localStorage.setItem('email', userEmail);
        }
    }, []);

    // Function to save changes to the server using PUT
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
    

    // Function to fetch user's goals
// Function to fetch user's goals
const fetchGoals = async () => {
    if (!userId) return;
    setLoading(true);
    try {
        const response = await fetch(`${BACKEND_URL}/${userId}`);
        let data = { goals: {} };
        
        if (response.status !== 404) {
            data = await response.json();
        }

        if (!data.goals || Object.keys(data.goals).length === 0) {
            setShowInitialSetup(true);
            setAvailableGoals([
                { id: 'AI', name: 'AI & Machine Learning', icon: '🧠' },
                { id: 'React', name: 'React Development', icon: '⚛️' },
                { id: 'CyberSecurity', name: 'Cyber Security', icon: '🔒' }
            ]);
            setLoading(false);
            return;
        }

        const goalsData = data.goals;
        
        // Iterate through each goal and convert the roadmap object to an array
        for (const goalId in goalsData) {
            if (goalsData[goalId].roadmap && !Array.isArray(goalsData[goalId].roadmap)) {
                const roadmapObject = goalsData[goalId].roadmap;
                const roadmapArray = Object.keys(roadmapObject)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map(key => roadmapObject[key].trim()); // Trim whitespace
                goalsData[goalId].roadmap = roadmapArray;
            }
        }
        
        setGoals(goalsData);
        const firstGoal = Object.keys(goalsData)[0];
        setActiveGoal(firstGoal);

        const fetchedDifficulty = goalsData?.[firstGoal]?.difficulty_level || 1;
        const fetchedXp = goalsData?.[firstGoal]?.xp || 0;

        setDifficulty(fetchedDifficulty);
        setXp(fetchedXp);
    } catch (error) {
        console.error('Failed to fetch goals:', error);
        setApiError('Failed to connect to the server. Make sure it is running.');
    } finally {
        setLoading(false);
    }
};

    const handleInitialSetup = async () => {
        if (!selectedGoalForSetup) {
            setApiError('Please select a goal.');
            return;
        }

        setLoading(true);
        const newGoalData = {
            goalKeyword: selectedGoalForSetup,
            end_goal: selectedLevelForSetup,
            roadmap: [],
            difficulty_level: 1,
            xp: 0,
            daily_tasks: {
                // Placeholder for initial daily tasks
            }
        };

        const serverResponse = await saveGoalsToServer(newGoalData);

        if (serverResponse) {
            setGoals({ [selectedGoalForSetup]: serverResponse });
            setActiveGoal(selectedGoalForSetup);
            setDifficulty(1);
            setXp(0);
            setShowInitialSetup(false);
            showMessage('Goal and tasks set up successfully!');
        }
        setLoading(false);
    };

    // Function to generate daily tasks
    const generateDailyTasks = async (goalId) => {
        setGenerating(true);
        try {
            // Placeholder for generating tasks with Gemini API
            const today = new Date().toISOString().split('T')[0];
            const updatedDailyTasks = {
                ...(goals[goalId]?.daily_tasks || {}),
                [today]: {
                    task1: { question: `Task 1 for ${goalId}`, answer: `Answer for task 1`, completed: false },
                    task2: { question: `Task 2 for ${goalId}`, answer: `Answer for task 2`, completed: false },
                }
            };

            const payload = {
                goalKeyword: goalId,
                daily_tasks: updatedDailyTasks
            };

            const serverResponse = await saveGoalsToServer(payload);

            if (serverResponse) {
                setGoals(prev => ({
                    ...prev,
                    [goalId]: {
                        ...prev[goalId],
                        daily_tasks: serverResponse.daily_tasks
                    }
                }));
                showMessage('Daily tasks generated successfully!');
            }
        } catch (error) {
            setApiError('Failed to generate daily tasks');
        } finally {
            setGenerating(false);
        }
    };

    // Function to generate roadmap
    const generateRoadmap = async () => {
        if (!userId || !activeGoal) {
            setApiError('User or goal not set.');
            return;
        }

        setGeneratingRoadmap(true);
        setApiError(null);

        try {
            const prompt = `Generate a comprehensive learning roadmap for ${activeGoal} at ${selectedLevel} level. 
            Provide 8-12 specific, actionable steps that build upon each other. 
            Each step should be a complete sentence describing what to learn or practice.
            Format as a simple array of strings, no numbering or bullets.`;

            const requestBody = {
                contents: [{ parts: [{ text: prompt }] }]
            };

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error('Failed to generate roadmap');
            }

            const data = await response.json();
            const roadmapText = data.candidates[0].content.parts[0].text;
            
            const roadmapSteps = roadmapText
                .split('\n')
                .filter(line => line.trim())
                .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[•\-*]\s*/, '').trim())
                .filter(step => step.length > 0);

            const payload = {
                goalKeyword: activeGoal,
                roadmap: roadmapSteps
            };

            const serverResponse = await saveGoalsToServer(payload);
            
            if (serverResponse) {
                setGoals(prev => ({
                    ...prev,
                    [activeGoal]: {
                        ...prev[activeGoal],
                        roadmap: serverResponse.roadmap
                    }
                }));
                showMessage('Roadmap generated successfully!');
            }
        } catch (error) {
            console.error('Error generating roadmap:', error);
            setApiError('Failed to generate roadmap. Please try again.');
        } finally {
            setGeneratingRoadmap(false);
        }
    };

    // Main effect for fetching goals
    useEffect(() => {
        if (userId) {
            fetchGoals();
        }
    }, [userId]);

    const handleActiveGoalChange = async (goalId) => {
        setActiveGoal(goalId);
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        
        const goalData = goals[goalId];
        
        setDifficulty(goalData?.difficulty_level || 1);
        setXp(goalData?.xp || 0);

        if (!goalData?.daily_tasks?.[today]) {
            await generateDailyTasks(goalId);
        }
        setLoading(false);
    };

    const toggleExpand = (date) => {
        setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
    };

    const handleTaskClick = (task, date, taskId) => {
        if (!task.completed) {
            setCurrentTask({ ...task, date, taskId });
            setShowAnswerPrompt(true);
        }
    };

    const getButtonText = () => {
        const roadmapExists = goals[activeGoal]?.roadmap && Array.isArray(goals[activeGoal].roadmap) && goals[activeGoal].roadmap.length > 0;
        return roadmapExists ? 'Update Roadmap' : 'Generate Roadmap';
    };

    const levels = ["beginner", "intermediate", "advanced", "expert"];

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

                            {loading ? (
                                <div className="flex justify-center items-center min-h-[400px]">
                                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-400"></div>
                                </div>
                            ) : (
                                <>
                                    {showInitialSetup ? (
                                        <div className="relative bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg p-6 mb-8 text-center">
                                            <h3 className="text-2xl font-bold text-white mb-4">Start Your Learning Journey!</h3>
                                            <p className="text-zinc-300 mb-6">Select a goal and your starting difficulty to generate your first roadmap.</p>
                                            
                                            {/* Goal Selection */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                                                {availableGoals.map((goal) => (
                                                    <button
                                                        key={goal.id}
                                                        onClick={() => setSelectedGoalForSetup(goal.id)}
                                                        className={`p-4 rounded-xl border transition-all duration-300 ${
                                                            selectedGoalForSetup === goal.id
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

                                            {/* Difficulty Selection */}
                                            <div className="mb-6">
                                                <select
                                                    value={selectedLevelForSetup}
                                                    onChange={(e) => setSelectedLevelForSetup(e.target.value)}
                                                    className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-md w-full sm:w-auto"
                                                >
                                                    <option value="beginner" className="bg-zinc-900">Beginner</option>
                                                    <option value="intermediate" className="bg-zinc-900">Intermediate</option>
                                                    <option value="advanced" className="bg-zinc-900">Advanced</option>
                                                    <option value="expert" className="bg-zinc-900">Expert</option>
                                                </select>
                                            </div>

                                            <button
                                                onClick={handleInitialSetup}
                                                disabled={!selectedGoalForSetup}
                                                className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
                                                    !selectedGoalForSetup
                                                        ? 'bg-white/10 cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 hover:scale-105 shadow-lg'
                                                }`}
                                            >
                                                Start My Roadmap
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-8">
                                                <h3 className="text-2xl font-bold text-white mb-6 text-center">Choose Your Learning Path</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                                    {Object.keys(goals).map((goalId) => (
                                                        <button
                                                            key={goalId}
                                                            onClick={() => handleActiveGoalChange(goalId)}
                                                            className={`p-4 rounded-xl border transition-all duration-300 ${
                                                                activeGoal === goalId
                                                                    ? 'bg-white/10 border-blue-500/50 shadow-lg scale-105'
                                                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                                            }`}
                                                        >
                                                            <div className="text-center">
                                                                <p className="text-white font-medium text-sm">{goalId}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Roadmap Generation Section */}
                                            {activeGoal && (
                                                <div className="relative bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg p-6 mb-8">
                                                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                                                        <div className="flex-1">
                                                            <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                                                                <MapPin className="w-6 h-6 text-blue-400" />
                                                                {activeGoal} Roadmap
                                                            </h3>
                                                            <p className="text-zinc-300 mb-4">
                                                                Current Difficulty: <span className="text-purple-400 font-bold">{difficulty}</span>
                                                            </p>
                                                            <div className="flex flex-wrap gap-3">
                                                                <select
                                                                    value={selectedLevel}
                                                                    onChange={(e) => setSelectedLevel(e.target.value)}
                                                                    className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-md w-full sm:w-auto"
                                                                >
                                                                    {levels.map(level => (
                                                                        <option key={level} value={level} className="bg-zinc-900">
                                                                            {level.charAt(0).toUpperCase() + level.slice(1)}
                                                                        </option>
                                                                    ))}
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
                                                                    <span>{getButtonText()}</span>
                                                                </div>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Main Content */}
                                            {activeGoal && (
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
                                                                <p className="text-zinc-400 font-light mb-6">Generate a personalized roadmap to start your {activeGoal} journey</p>
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
                                        </>
                                    )}
                                </>
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