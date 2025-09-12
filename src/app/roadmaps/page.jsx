"use client";

import React, { useState, useEffect } from 'react';

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

  // Function to generate new tasks using Gemini API
  const generateDailyTasks = async () => {
    setGenerating(true);
    setApiError(null);
    const today = new Date().toISOString().split('T')[0];
    const { performanceContext, pastQuestions } = getPerformanceAndPastQuestions();
    
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
      const response = await fetch(`${BACKEND_URL}/${userId}/${activeGoal}`);
      let data = {};
      if (response.status !== 404) {
        data = await response.json();
      }
      
      const fetchedDifficulty = data[activeGoal]?.difficulty_level || 1;
      const fetchedXp = data[activeGoal]?.xp || 0;
      setDifficulty(fetchedDifficulty);
      setXp(fetchedXp);
      setGoals(data);
      
      if (!data[activeGoal]?.daily_tasks?.[today]) {
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
        showMessage('That’s not quite right. Keep going! 💪');
      }

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

  // Function to generate and save the roadmap
  const generateRoadmap = async () => {
    setGeneratingRoadmap(true);
    setApiError(null);
    setShowRoadmapPrompt(false);

    const prompt = `You are an expert AI tutor. Generate a comprehensive learning roadmap for a person with a goal in "${activeGoal}" at a "${selectedLevel}" level. The roadmap should be a Markdown-formatted list of simple, actionable points. Each point must be a single sentence and must not exceed 40 characters. Do not include any introductory or concluding text.`;
    
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "text/plain"
      }
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      const generatedRoadmap = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      const payloadToServer = {
        goalKeyword: activeGoal,
        roadmap: generatedRoadmap,
      };
      await saveGoalsToServer(payloadToServer);
      showMessage('Roadmap generated and saved!');
      fetchGoals(); // Re-fetch to update the UI
    } catch (error) {
      console.error("Roadmap generation failed:", error);
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
  }, [userId, activeGoal]);

  const toggleExpand = (date) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const handleLogout = () => {
    localStorage.removeItem('email');
    window.location.reload(); // Simple reload to "log out"
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
    const roadmapExists = goals[activeGoal]?.roadmap && goals[activeGoal].roadmap.length > 0;
    return roadmapExists ? 'Update Roadmap' : 'Generate Roadmap';
  };

  const levels = ["beginner", "intermediate", "above avg", "professional"];

  if (!userId) {
    return null; // Or a loading spinner while redirecting
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8 md:p-12 flex flex-col items-center">
      <div className="w-full max-w-3xl font-sans space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between pb-6 border-b border-gray-800">
          <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600 mb-4 md:mb-0">
            Daily Goal Tracker
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
        
        {/* Status Message */}
        {apiError && <div className="bg-red-700 text-white p-4 rounded-lg text-center font-medium shadow-lg animate-fade-in">{apiError}</div>}
        {message && <div className="bg-green-600 text-white p-4 rounded-lg text-center font-medium shadow-lg animate-fade-in-out">{message}</div>}

        {/* Goal Stats and Task Generation */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 p-6 rounded-xl shadow-2xl border border-gray-800">
          <div className="flex-1 space-y-2 mb-4 md:mb-0">
            <h2 className="text-2xl font-bold text-gray-200">Goal: {activeGoal}</h2>
            <p className="text-md text-gray-400">Current XP: <span className="text-indigo-400 font-bold">{xp}</span></p>
            <p className="text-md text-gray-400">Difficulty: <span className="text-indigo-400 font-bold">{difficulty}</span>{difficulty === 1000 && " (Professional)"}</p>
          </div>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <button
              onClick={handleRoadmapClick}
              disabled={generatingRoadmap}
              className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform ${
                generatingRoadmap ? 'bg-gray-700 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:scale-105 shadow-md'
              }`}
            >
              {getButtonText()}
            </button>
            <button
              onClick={() => generateDailyTasks()}
              disabled={generating}
              className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform ${
                generating ? 'bg-gray-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-md'
              }`}
            >
              {generating ? (
                <div className="flex items-center space-x-2"><Spinner /><span>Generating...</span></div>
              ) : (
                'Generate New Tasks'
              )}
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center">
            <button
                onClick={() => setShowRoadmapView(!showRoadmapView)}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform bg-purple-600 hover:bg-purple-700 hover:scale-105 shadow-md"
            >
                {showRoadmapView ? 'Show Daily Tasks' : 'Show Roadmap'}
            </button>
        </div>
        
        {/* Conditional Sections */}
        {showRoadmapView ? (
          /* Roadmap Section - Rendered as Markdown */
          goals[activeGoal]?.roadmap && goals[activeGoal].roadmap.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-6 shadow-2xl border border-gray-800">
              <h3 className="text-xl font-bold text-gray-200 mb-4">Learning Roadmap</h3>
              <div className="prose prose-invert max-w-none mt-4">
                <pre className="p-4 rounded-lg bg-gray-800 text-gray-300 overflow-x-auto whitespace-pre-wrap">{goals[activeGoal].roadmap}</pre>
              </div>
            </div>
          )
        ) : (
          /* Tasks List */
          loading ? (
            <div className="text-center py-10 text-gray-500 font-light">Loading goals...</div>
          ) : (
            <div className="space-y-6">
              {goals && goals[activeGoal] && goals[activeGoal].daily_tasks && Object.keys(goals[activeGoal].daily_tasks).length > 0 ? (
                Object.keys(goals[activeGoal].daily_tasks).sort((a,b) => b.localeCompare(a)).map(date => (
                  <div key={date} className="bg-gray-900 rounded-xl p-6 shadow-2xl border border-gray-800">
                    <button
                      className="w-full flex justify-between items-center text-left"
                      onClick={() => toggleExpand(date)}
                    >
                      <h3 className="text-xl font-bold text-gray-200">Tasks for {date}</h3>
                      <svg
                        className={`w-6 h-6 transform transition-transform duration-300 text-gray-500 ${expandedDates[date] ? 'rotate-180' : ''}`}
                        fill="currentColor" viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className={`transition-all duration-500 ease-in-out ${expandedDates[date] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                      <div className="mt-4 border-t border-gray-800 pt-4 space-y-4">
                        {Object.keys(goals[activeGoal].daily_tasks[date]).map(taskId => {
                          const task = goals[activeGoal].daily_tasks[date][taskId];
                          return (
                            <div
                              key={taskId}
                              className={`bg-gray-800 p-4 rounded-lg flex flex-col items-start space-y-2 border border-gray-700 transition-all duration-200 ${task.completed ? 'opacity-50' : 'hover:border-indigo-600 cursor-pointer'}`}
                              onClick={() => handleTaskClick(task, date, taskId)}
                            >
                              <h4 className={`text-lg font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>{task.question}</h4>
                              {task.completed && (
                                <p className={`mt-1 text-sm text-gray-400`}>Correct Answer: {task.answer}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-10 font-light">
                  <p>No tasks found for the goal "{activeGoal}".</p>
                  <p>Tasks will be automatically generated for you.</p>
                </div>
              )}
            </div>
          )
        )}
      </div>
      
      {/* Modal for Answer Input */}
      {showAnswerPrompt && currentTask && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-8 shadow-2xl w-full max-w-lg space-y-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-white text-center">Answer the task</h3>
            <p className="text-lg text-gray-300 text-center">{currentTask.question}</p>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') judgeAnswer(currentTask, currentTask.date, currentTask.taskId);
              }}
              className="w-full p-3 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              placeholder="Type your answer here..."
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowAnswerPrompt(false)}
                className="px-6 py-3 rounded-lg font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => judgeAnswer(currentTask, currentTask.date, currentTask.taskId)}
                disabled={generating || userAnswer.trim() === ''}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
                  generating || userAnswer.trim() === '' ? 'bg-indigo-700 opacity-50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {generating ? <Spinner /> : 'Submit Answer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Roadmap Generation */}
      {showRoadmapPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-8 shadow-2xl w-full max-w-lg space-y-6 animate-fade-in">
            <h3 className="text-2xl font-bold text-white text-center">
              {goals[activeGoal]?.roadmap ? 'Update Existing Roadmap' : 'Generate New Roadmap'}
            </h3>
            <p className="text-lg text-gray-300 text-center">Select your desired level for the roadmap:</p>
            <div className="grid grid-cols-2 gap-4">
              {levels.map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    selectedLevel === level
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowRoadmapPrompt(false)}
                className="px-6 py-3 rounded-lg font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateRoadmap}
                disabled={generatingRoadmap}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-300 ${
                  generatingRoadmap ? 'bg-indigo-700 opacity-50 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {getButtonText()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
