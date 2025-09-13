"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Target, Clock, CheckCircle, ArrowRight, Filter, BookOpen, Zap, TrendingUp, Users, Play, Pause, RotateCcw, Star, Trophy, Flame, Rocket } from 'lucide-react';

// Available goals with enhanced data
const availableGoals = [
  { id: 'Learn JavaScript', name: 'JavaScript', icon: '🚀', color: 'from-yellow-400 to-orange-500' },
  { id: 'Learn Python', name: 'Python', icon: '🐍', color: 'from-green-400 to-blue-500' },
  { id: 'Learn React', name: 'React', icon: '⚛️', color: 'from-blue-400 to-cyan-500' },
  { id: 'Learn Data Science', name: 'Data Science', icon: '📊', color: 'from-purple-400 to-pink-500' },
  { id: 'Learn Machine Learning', name: 'ML', icon: '🤖', color: 'from-indigo-400 to-purple-500' }
];

// Base URLs
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=AIzaSyC9ordkhWuD8B7axV5wYoMswPy9ghOJfbY';
const BACKEND_URL = 'http://localhost:8080'; // Replace with your backend URL

// Enhanced Spinner with particles
const Spinner = ({ size = "h-5 w-5" }) => (
  <div className="relative flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${size} border-2 border-white/20 border-t-white rounded-full`}
    />
    <motion.div
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute w-1 h-1 bg-white rounded-full"
    />
  </div>
);

// Pipeline Node Component
const PipelineNode = ({ phase, index, isActive, isCompleted, onClick }) => {
  const goal = availableGoals.find(g => g.id === phase.id) || availableGoals[0];
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.2, type: "spring", stiffness: 300 }}
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      {/* Connection Line */}
      {index > 0 && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: index * 0.3, duration: 0.5 }}
          className="absolute -left-16 top-1/2 w-16 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
        />
      )}
      
      {/* Node */}
      <motion.div
        className={`relative w-20 h-20 rounded-full border-2 transition-all duration-300 ${
          isCompleted 
            ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500/50' 
            : isActive
            ? `bg-gradient-to-r ${goal.color} border-white shadow-lg shadow-current/50`
            : 'bg-white/10 border-white/30 hover:border-white/50'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Pulsing animation for active node */}
        {isActive && (
          <motion.div
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${goal.color} opacity-30`}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        {/* Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          {isCompleted ? <CheckCircle className="w-8 h-8 text-white" /> : phase.icon}
        </div>
        
        {/* Phase number */}
        <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
          {index + 1}
        </div>
      </motion.div>
      
      {/* Label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.2 + 0.3 }}
        className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center"
      >
        <p className="text-sm font-medium text-white whitespace-nowrap">{phase.title}</p>
        <p className="text-xs text-zinc-400">{phase.duration}</p>
      </motion.div>
    </motion.div>
  );
};

// Roadmap Phase Card
const RoadmapPhaseCard = ({ phase, index, isActive }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1, type: "spring" }}
    className={`relative p-6 rounded-xl border transition-all duration-300 ${
      isActive 
        ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/50 shadow-lg' 
        : 'bg-white/5 border-white/10 hover:bg-white/10'
    }`}
  >
    {/* Animated background particles */}
    <div className="absolute inset-0 overflow-hidden rounded-xl">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400 rounded-full"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 3,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            left: `${20 + i * 30}%`,
            top: `${10 + i * 20}%`
          }}
        />
      ))}
    </div>
    
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${availableGoals[index % availableGoals.length].color} flex items-center justify-center font-bold text-white text-sm`}>
          {index + 1}
        </div>
        <h4 className="font-bold text-lg text-white">{phase.title}</h4>
      </div>
      <p className="text-zinc-300 text-sm leading-relaxed mb-4">{phase.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Clock className="w-4 h-4" />
          <span>{phase.duration}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-xs text-yellow-400">{phase.difficulty}/5</span>
        </div>
      </div>
    </div>
  </motion.div>
);

const App = () => {
  const [goals, setGoals] = useState({});
  const [activeGoal, setActiveGoal] = useState('Learn JavaScript');
  const [loading, setLoading] = useState(true);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [userId, setUserId] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [message, setMessage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('beginner');
  const [difficulty, setDifficulty] = useState(1);
  const [xp, setXp] = useState(0);
  
  // Animation states
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [roadmapPhases, setRoadmapPhases] = useState([]);
  const [showPipeline, setShowPipeline] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Message system
  const showMessage = (msg, type = 'success') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(''), 4000);
  };

  // Initialize user
  useEffect(() => {
    const userEmail = localStorage.getItem('email') || "vermanickb75@gmail.com";
    if (userEmail) {
      setUserId(userEmail);
      localStorage.setItem('email', userEmail);
    }
  }, []);

  // Save to server with enhanced payload
  const saveGoalsToServer = async (payload) => {
    try {
      const response = await fetch(`${BACKEND_URL}/goals/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save to server');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Save failed:', error);
      setApiError('Failed to connect to server');
      return null;
    }
  };

  // Enhanced roadmap generation with pipeline visualization
  const generateRoadmap = async () => {
    setGeneratingRoadmap(true);
    setApiError(null);
    setGenerationProgress(0);
    setShowPipeline(true);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => prev < 80 ? prev + 10 : prev);
      }, 200);

      const prompt = `You are an expert learning architect. Create an EPIC and comprehensive learning roadmap for "${activeGoal}" at ${selectedLevel} level.

      Create a detailed roadmap with 6-8 phases that transform the learner from current level to mastery. Each phase should be:
      - Progressively challenging and building upon previous phases
      - Include specific skills, tools, and real-world projects
      - Have clear success metrics and milestones
      - Incorporate hands-on practice and portfolio building

      Return ONLY a JSON object with this exact structure:
      {
        "end_goal": "Clear, inspiring end goal description",
        "roadmap": {
          "phase1": {
            "title": "Phase name",
            "description": "Detailed phase description with specific skills and outcomes",
            "duration": "estimated time (e.g., '2-3 weeks')",
            "difficulty": 2,
            "projects": ["specific project 1", "specific project 2"],
            "skills": ["skill1", "skill2", "skill3"]
          },
          "phase2": { /* similar structure */ },
          // ... continue for 6-8 phases
        },
        "daily_tasks": {
          "2025-09-13": {
            "task1": {
              "description": "Specific actionable task for today",
              "status": "pending",
              "xp_gained": 25
            },
            "task2": {
              "description": "Another specific task",
              "status": "pending", 
              "xp_gained": 30
            }
          }
        },
        "progress_report": {
          "current_status": "Ready to begin this epic learning journey!"
        }
      }`;

      const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to generate roadmap');
      }

      const result = await response.json();
      const roadmapData = JSON.parse(result?.candidates?.[0]?.content?.parts?.[0]?.text);

      if (!roadmapData || !roadmapData.roadmap) {
        throw new Error("Invalid response format");
      }

      // Process phases for visualization
      const phases = Object.entries(roadmapData.roadmap).map(([key, phase], index) => ({
        id: key,
        title: phase.title,
        description: phase.description,
        duration: phase.duration,
        difficulty: phase.difficulty,
        projects: phase.projects,
        skills: phase.skills,
        icon: availableGoals.find(g => g.id === activeGoal)?.icon || '🎯'
      }));

      setRoadmapPhases(phases);
      setGenerationProgress(100);
      clearInterval(progressInterval);

      // Enhanced payload for server
      const payloadToServer = {
        goalKeyword: activeGoal,
        end_goal: roadmapData.end_goal,
        roadmap: roadmapData.roadmap,
        daily_tasks: roadmapData.daily_tasks,
        progress_report: roadmapData.progress_report,
        misc: `Generated on ${new Date().toISOString()} with ${selectedLevel} level`
      };

      const serverResponse = await saveGoalsToServer(payloadToServer);
      if (serverResponse) {
        showMessage('🚀 Epic roadmap generated successfully!', 'success');
        fetchGoals();
      }

    } catch (error) {
      console.error("Roadmap generation failed:", error);
      setApiError('Failed to generate roadmap. Check your connection.');
    } finally {
      setGeneratingRoadmap(false);
      setTimeout(() => setShowPipeline(false), 2000);
    }
  };

  // Fetch goals with enhanced data processing
  const fetchGoals = async () => {
    if (!userId) return;
    setLoading(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/goals/${userId}`);
      let data = {};
      
      if (response.status !== 404) {
        data = await response.json();
      }

      const fetchedGoals = data.goals || {};
      setGoals(fetchedGoals);

      // Process active goal data
      if (fetchedGoals[activeGoal]) {
        const goalData = fetchedGoals[activeGoal];
        
        // Process roadmap into phases
        if (goalData.roadmap) {
          const phases = Object.entries(goalData.roadmap).map(([key, phase], index) => ({
            id: key,
            title: typeof phase === 'string' ? `Phase ${index + 1}` : phase.title || `Phase ${index + 1}`,
            description: typeof phase === 'string' ? phase : phase.description || phase,
            duration: typeof phase === 'object' ? phase.duration || '1-2 weeks' : '1-2 weeks',
            difficulty: typeof phase === 'object' ? phase.difficulty || index + 1 : index + 1,
            projects: typeof phase === 'object' ? phase.projects || [] : [],
            skills: typeof phase === 'object' ? phase.skills || [] : [],
            icon: availableGoals.find(g => g.id === activeGoal)?.icon || '🎯'
          }));
          setRoadmapPhases(phases);
        }

        setDifficulty(goalData.difficulty_level || 1);
        setXp(goalData.xp || 0);
      } else {
        setRoadmapPhases([]);
        setDifficulty(1);
        setXp(0);
      }

    } catch (error) {
      console.error('Fetch failed:', error);
      setApiError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Main effect
  useEffect(() => {
    if (userId) {
      fetchGoals();
    }
  }, [userId, activeGoal]);

  const handleGoalChange = (goalId) => {
    setActiveGoal(goalId);
    setLoading(true);
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Spinner size="h-16 w-16" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen p-4 sm:p-6 lg:p-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 mb-12"
        >
          <motion.h1
            className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            Epic Learning Pipeline
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-zinc-300 mb-8 max-w-3xl mx-auto"
          >
            Generate mind-blowing personalized roadmaps with AI-powered phase progression
          </motion.p>
        </motion.section>

        {/* Goal Selection */}
         
        {/* Messages */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-center backdrop-blur-md"
            >
              <p className="text-red-300 font-medium">{apiError}</p>
            </motion.div>
          )}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 rounded-xl text-center backdrop-blur-md ${
                message.type === 'success' 
                  ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                  : 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
              }`}
            >
              <p className="font-medium">{message.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roadmap Generation Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h3 className="text-3xl font-bold mb-4 flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Target className="w-8 h-8 text-blue-400" />
                </motion.div>
                {availableGoals.find(g => g.id === activeGoal)?.name} Mastery Pipeline
              </h3>
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="text-orange-300 font-bold capitalize">{selectedLevel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-300 font-bold">{xp} XP</span>
                </div>
              </div>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-6 py-3 bg-white/10 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-md font-medium"
              >
                <option value="beginner" className="bg-zinc-900">🌱 Beginner</option>
                <option value="intermediate" className="bg-zinc-900">🚀 Intermediate</option>
                <option value="advanced" className="bg-zinc-900">⚡ Advanced</option>
                <option value="expert" className="bg-zinc-900">🏆 Expert</option>
              </select>
            </div>
            
            <motion.button
              onClick={generateRoadmap}
              disabled={generatingRoadmap}
              className={`px-8 py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 ${
                generatingRoadmap 
                  ? 'bg-white/20 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105'
              }`}
              whileHover={{ scale: generatingRoadmap ? 1 : 1.05 }}
              whileTap={{ scale: generatingRoadmap ? 1 : 0.95 }}
            >
              {generatingRoadmap ? (
                <div className="flex items-center gap-3">
                  <Spinner size="h-6 w-6" />
                  <span>Generating Epic Roadmap...</span>
                  <span className="text-sm">({generationProgress}%)</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Rocket className="w-6 h-6" />
                  <span>Generate Epic Roadmap</span>
                </div>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Pipeline Visualization */}
        <AnimatePresence>
          {showPipeline && generatingRoadmap && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-12 p-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl border border-blue-500/50 shadow-2xl"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                  AI Pipeline Processing
                </h3>
                <motion.div 
                  className="w-full bg-white/20 rounded-full h-3 mb-4"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                >
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${generationProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </motion.div>
                <p className="text-zinc-300">Creating your personalized learning pipeline...</p>
              </div>

              {/* Processing stages */}
              <div className="flex justify-center items-center gap-8 flex-wrap">
                {['Analyzing Goals', 'Structuring Phases', 'Optimizing Path', 'Finalizing'].map((stage, index) => (
                  <motion.div
                    key={stage}
                    initial={{ opacity: 0.3, scale: 0.8 }}
                    animate={{
                      opacity: generationProgress > index * 25 ? 1 : 0.3,
                      scale: generationProgress > index * 25 ? 1 : 0.8
                    }}
                    className="flex items-center gap-2"
                  >
                    {generationProgress > index * 25 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-green-400 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium">{stage}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-dashed rounded-full border-blue-400"
            />
          </div>
        ) : (
          <AnimatePresence>
            {roadmapPhases.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12"
              >
                {/* Pipeline Overview */}
                <div className="relative p-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                  <motion.h3 
                    className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-2"
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                  >
                    <MapPin className="w-8 h-8 text-green-400" />
                    Your Learning Pipeline
                  </motion.h3>
                  
                  <div className="flex  justify-center items-center gap-16 flex-wrap py-8">
                    {roadmapPhases.map((phase, index) => (
                      <PipelineNode
                        key={phase.id}
                        phase={phase}
                        index={index}
                        isActive={activePhaseIndex === index}
                        isCompleted={index < activePhaseIndex}
                        onClick={() => setActivePhaseIndex(index)}
                      />
                    ))}
                  </div>
                </div>

                {/* Detailed Phase Cards */}
                <div className="grid gap-6">
                  <h3 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                    <BookOpen className="w-6 h-6 text-purple-400" />
                    Phase Details
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roadmapPhases.map((phase, index) => (
                      <RoadmapPhaseCard
                        key={phase.id}
                        phase={phase}
                        index={index}
                        isActive={activePhaseIndex === index}
                      />
                    ))}
                  </div>
                </div>

                {/* Enhanced Phase Focus View */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePhaseIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl rounded-2xl border border-blue-500/30 shadow-2xl"
                  >
                    <div className="flex items-center mt-6 gap-4 mb-6">
                      <motion.div
                        className={`w-16 h-16 rounded-full bg-gradient-to-r ${availableGoals.find(g => g.id === activeGoal)?.color || 'from-blue-400 to-purple-400'} flex items-center justify-center text-2xl font-bold text-white shadow-lg`}
                        whileHover={{ scale: 1.1 }}
                      >
                        {activePhaseIndex + 1}
                      </motion.div>
                      <div>
                        <h3 className="text-3xl   font-bold text-white">
                          {roadmapPhases[activePhaseIndex]?.title}
                        </h3>
                        <p className="text-zinc-400 m-10 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {roadmapPhases[activePhaseIndex]?.duration}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <Target className="w-5 h-5 text-green-400" />
                          Description Hello
                        </h4>
                        <p className="text-zinc-300 leading-relaxed mb-6">
                          {roadmapPhases[activePhaseIndex]?.description}
                        </p>

                        {roadmapPhases[activePhaseIndex]?.skills && roadmapPhases[activePhaseIndex].skills.length > 0 && (
                          <div>
                            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                              <Zap className="w-5 h-5 text-yellow-400" />
                              Skills You'll Master
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {roadmapPhases[activePhaseIndex].skills.map((skill, skillIndex) => (
                                <motion.span
                                  key={skill}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: skillIndex * 0.1 }}
                                  className="px-3 py-1 bg-yellow-400/20 text-yellow-300 rounded-full text-sm border border-yellow-400/30"
                                >
                                  {skill}
                                </motion.span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        {roadmapPhases[activePhaseIndex]?.projects && roadmapPhases[activePhaseIndex].projects.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                              <Rocket className="w-5 h-5 text-blue-400" />
                              Projects & Practice
                            </h4>
                            <div className="space-y-3">
                              {roadmapPhases[activePhaseIndex].projects.map((project, projectIndex) => (
                                <motion.div
                                  key={project}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: projectIndex * 0.1 }}
                                  className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                                >
                                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                  <span className="text-zinc-300 text-sm">{project}</span>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center gap-2">
                            <Flame className="w-5 h-5 text-orange-400" />
                            <span className="text-white font-medium">Difficulty</span>
                          </div>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-full ${
                                  i < (roadmapPhases[activePhaseIndex]?.difficulty || 1)
                                    ? 'bg-orange-400'
                                    : 'bg-white/20'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
                      <motion.button
                        onClick={() => setActivePhaseIndex(Math.max(0, activePhaseIndex - 1))}
                        disabled={activePhaseIndex === 0}
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                          activePhaseIndex === 0
                            ? 'bg-white/5 text-zinc-500 cursor-not-allowed'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                        whileHover={activePhaseIndex !== 0 ? { scale: 1.05 } : {}}
                      >
                        Previous Phase
                      </motion.button>

                      <div className="flex items-center gap-2">
                        {roadmapPhases.map((_, index) => (
                          <motion.button
                            key={index}
                            onClick={() => setActivePhaseIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                              index === activePhaseIndex
                                ? 'bg-blue-400 scale-125'
                                : 'bg-white/30 hover:bg-white/50'
                            }`}
                            whileHover={{ scale: 1.2 }}
                          />
                        ))}
                      </div>

                      <motion.button
                        onClick={() => setActivePhaseIndex(Math.min(roadmapPhases.length - 1, activePhaseIndex + 1))}
                        disabled={activePhaseIndex === roadmapPhases.length - 1}
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                          activePhaseIndex === roadmapPhases.length - 1
                            ? 'bg-white/5 text-zinc-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                        }`}
                        whileHover={activePhaseIndex !== roadmapPhases.length - 1 ? { scale: 1.05 } : {}}
                      >
                        Next Phase
                        <ArrowRight className="w-4 h-4 ml-2 inline" />
                      </motion.button>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Daily Tasks Section */}
                {goals[activeGoal]?.daily_tasks && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 bg-gradient-to-br from-green-500/10 to-blue-500/10 backdrop-blur-xl rounded-2xl border border-green-500/30 shadow-2xl"
                  >
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      Today's Learning Tasks
                    </h3>
                    <div className="grid gap-4">
                      {Object.entries(goals[activeGoal].daily_tasks).map(([date, tasks]) => (
                        <div key={date} className="space-y-3">
                          <h4 className="text-lg font-semibold text-zinc-300 border-b border-white/10 pb-2">
                            {new Date(date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </h4>
                          {Object.values(tasks).map((task, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                            >
                              <div className={`w-4 h-4 rounded-full ${
                                task.status === 'completed' ? 'bg-green-400' :
                                task.status === 'in_progress' ? 'bg-yellow-400' : 'bg-zinc-400'
                              }`} />
                              <div className="flex-1">
                                <p className="text-white font-medium">{task.description}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    task.status === 'completed' ? 'bg-green-400/20 text-green-300' :
                                    task.status === 'in_progress' ? 'bg-yellow-400/20 text-yellow-300' :
                                    'bg-zinc-400/20 text-zinc-300'
                                  }`}>
                                    {task.status?.replace('_', ' ') || 'pending'}
                                  </span>
                                  <span className="text-xs text-zinc-400">
                                    +{task.xp_gained || 0} XP
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="p-12 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl max-w-2xl mx-auto">
                  <motion.div
                    className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-8 flex items-center justify-center"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <MapPin className="w-12 h-12 text-white" />
                  </motion.div>
                  <h3 className="text-3xl font-bold text-white mb-4">Ready for Takeoff?</h3>
                  <p className="text-zinc-300 text-lg mb-8 leading-relaxed">
                    Generate an epic personalized roadmap for your {availableGoals.find(g => g.id === activeGoal)?.name} journey. 
                    Our AI will create a structured learning pipeline tailored just for you!
                  </p>
                  <motion.button
                    onClick={generateRoadmap}
                    disabled={generatingRoadmap}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex items-center gap-3">
                      <Rocket className="w-6 h-6" />
                      <span>Launch My Learning Journey</span>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Custom styles */}
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
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default App;