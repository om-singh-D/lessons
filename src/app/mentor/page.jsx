"use client";
import React, { useState, useEffect } from 'react';

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
          const userRes = await fetch(`http://localhost:8080/user/${userEmail}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (!userRes.ok) throw new Error('Failed to fetch user data');
          const user = await userRes.json();
          setUserData(user);

          // Fetch user goals
          const goalsRes = await fetch(`http://localhost:8080/goals/${userEmail}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (!goalsRes.ok) throw new Error('Failed to fetch goals data');
          const goals = await goalsRes.json();
          setUserGoals(goals);

          // Fetch leaderboard data (assuming a dedicated endpoint)
          const leaderboardRes = await fetch('http://localhost:8080/leaderboard', {
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
    if (!goalsData?.goals?.AI?.daily_tasks) return [];
    const tasks = [];
    const dailyTasksByDate = goalsData.goals.AI.daily_tasks;
    for (const date in dailyTasksByDate) {
      if (Object.hasOwnProperty.call(dailyTasksByDate, date)) {
        const tasksForDate = dailyTasksByDate[date];
        for (const taskId in tasksForDate) {
          if (Object.hasOwnProperty.call(tasksForDate, taskId)) {
            tasks.push({
              id: `${date}-${taskId}`,
              date: date,
              name: tasksForDate[taskId].question,
              completed: tasksForDate[taskId].completed,
              topic: tasksForDate[taskId].difficulty_level ? 'AI' : 'AI' // Assuming topic is 'AI' for all tasks
            });
          }
        }
      }
    }
    return tasks;
  };

  const getMotivationalMessage = () => {
    // FIX: Use the new helper function
    const allDailyTasks = getAllDailyTasks(userGoals);
    if (allDailyTasks.length === 0) {
      return "Start your first task today and level up!";
    }
    const completedTasks = allDailyTasks.filter(task => task.completed).length;
    const totalTasks = allDailyTasks.length;
    if (completedTasks === totalTasks) {
      return "🎉 Great job! You completed all your tasks. Keep up the momentum!";
    }
    const pastTasks = allDailyTasks.filter(task => new Date(task.date) < new Date()).filter(task => !task.completed);
    if (pastTasks.length > 0) {
      return `Hey there! You have ${pastTasks.length} past tasks to complete. Let's finish them and clear your backlog. You got this!`;
    }
    return "You're doing great! Keep pushing forward on your daily tasks.";
  };

  const getPersonalizedSuggestions = () => {
    // FIX: Get unsolved tasks by filtering the new array
    const allDailyTasks = getAllDailyTasks(userGoals);
    const unsolvedTasks = allDailyTasks.filter(task => !task.completed);
    if (unsolvedTasks.length === 0) {
      return "No specific weak points found. Keep practicing!";
    }
    
    // Using the topics from your provided data (or assuming them)
    const weakPoints = unsolvedTasks.map(task => {
        // You would need a mapping from question to topic
        if (task.name.includes('computer see things')) return 'Computer Vision';
        if (task.name.includes('new idea from this century')) return 'History of AI';
        if (task.name.includes('supervised and unsupervised')) return 'Supervised/Unsupervised Learning';
        return 'General AI Concepts';
    });
    
    const uniqueTopics = [...new Set(weakPoints)];
    return `You've left some questions unsolved on these topics: ${uniqueTopics.join(', ')}. Focus on these areas to improve!`;
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="p-4 text-center">Loading your personalized dashboard...</div>;
    }
    if (error) {
      return <div className="p-4 text-center text-red-500">Error: {error}</div>;
    }
    if (!userData || !userGoals) {
      return <div className="p-4 text-center">No data found. Please log in or check API endpoints.</div>;
    }
    
    const allDailyTasks = getAllDailyTasks(userGoals);

    return (
      <div className="p-8 space-y-8 bg-gray-100 min-h-screen">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-blue-600">Welcome, {userEmail}!</h1>
          {/* Your user data doesn't have a name or level, so using placeholders */}
          <p className="text-lg text-gray-700 mt-2">Total XP: {userData.xp["2025-09-12"] + userData.xp["2025-09-13"]} ✨</p>
        </header>

        {/* Motivational Section */}
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-blue-500">Your Daily Mentor </h2>
          <p className="text-lg text-gray-800">{getMotivationalMessage()}</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Daily Tasks */}
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-blue-500">Daily Tasks</h2>
            <ul className="space-y-2">
              {allDailyTasks.map(task => (
                <li key={task.id} className={`p-3 rounded-lg flex items-center justify-between ${task.completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <span className={task.completed ? 'line-through text-gray-500' : ''}>{task.name}</span>
                  {task.completed && <span>✅</span>}
                </li>
              ))}
            </ul>
          </section>

          {/* Weak Points and Suggestions */}
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-blue-500">Personalized Roadmap</h2>
            <p className="text-lg text-gray-800">{getPersonalizedSuggestions()}</p>
            <a href="/roadmap" className="mt-4 inline-block text-blue-500 font-bold hover:underline">View Full Roadmap ➡️</a>
          </section>

          {/* Leaderboard */}
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-blue-500">Leaderboard</h2>
            <ul className="space-y-2">
              {leaderboardData.sort((a, b) => b.total_xp - a.total_xp).map((user, index) => (
                <li key={user.email} className={`flex justify-between items-center p-3 rounded-lg ${index === 0 ? 'bg-yellow-200' : 'bg-gray-100'}`}>
                  <span>{index + 1}. {user.email}</span>
                  <span className="font-bold">XP {user.total_xp}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          background-color: #f4f4f9;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
      `}</style>
      <div className="container">
        {renderContent()}
      </div>
    </>
  );
};

export default Page;