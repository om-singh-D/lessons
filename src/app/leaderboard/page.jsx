"use client";

import React, { useState, useEffect } from 'react';

// API endpoints
const LEADERBOARD_API_URL = 'http://localhost:8080/leaderboard';
const USER_API_URL = 'http://localhost:8080/user';

// A simple spinner for loading states
const Spinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-400"></div>
  </div>
);

// Helper to get medal styles for the top 3 ranks
const getRankStyle = (rank) => {
  switch (rank) {
    case 1:
      return {
        icon: '🥇',
        borderColor: 'border-yellow-400/50',
        textColor: 'text-yellow-300',
        shadow: 'shadow-yellow-400/20'
      };
    case 2:
      return {
        icon: '🥈',
        borderColor: 'border-slate-400/50',
        textColor: 'text-slate-300',
        shadow: 'shadow-slate-400/20'
      };
    case 3:
      return {
        icon: '🥉',
        borderColor: 'border-amber-600/50',
        textColor: 'text-amber-400',
        shadow: 'shadow-amber-600/20'
      };
    default:
      return {
        icon: `#${rank}`,
        borderColor: 'border-white/10',
        textColor: 'text-zinc-300',
        shadow: 'shadow-lg'
      };
  }
};

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch the base leaderboard (email and total_xp)
        const leaderboardRes = await fetch(LEADERBOARD_API_URL);
        if (!leaderboardRes.ok) {
          throw new Error('Could not connect to the server to fetch leaderboard.');
        }
        const baseLeaderboard = await leaderboardRes.json();

        if (baseLeaderboard.length === 0) {
            setLeaderboardData([]);
            return;
        }

        // 2. Fetch detailed stats for each user on the leaderboard
        const detailedData = await Promise.all(
          baseLeaderboard.map(async (user) => {
            try {
              const userRes = await fetch(`${USER_API_URL}/${user.email}`);
              if (!userRes.ok) {
                // If a single user fails, return default values but don't crash
                return { ...user, total_questions: 0, max_questions_in_a_day: 0 };
              }
              const userDetails = await userRes.json();
              return {
                ...user,
                total_questions: userDetails.total_questions || 0,
                max_questions_in_a_day: userDetails.max_questions_in_a_day || 0,
              };
            } catch (e) {
              return { ...user, total_questions: 0, max_questions_in_a_day: 0 };
            }
          })
        );
        
        setLeaderboardData(detailedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []); // Empty array ensures this runs once on component mount

  const renderContent = () => {
    if (loading) {
      return <Spinner />;
    }

    if (error) {
      return (
        <div className="bg-red-800/20 text-red-300 border border-red-700/50 p-6 rounded-xl text-center font-medium shadow-lg backdrop-blur-md">
          <p className="text-2xl mb-2">Error</p>
          <p>{error}</p>
        </div>
      );
    }
    
    if (leaderboardData.length === 0) {
        return (
            <div className="text-center py-16 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
                <h3 className="text-xl font-semibold text-zinc-300 mb-2">The Leaderboard is Empty</h3>
                <p className="text-zinc-400 font-light">Complete some tasks to get your name on the board!</p>
            </div>
        )
    }

    return (
      <div className="space-y-4">
        {leaderboardData.map((user, index) => {
          const rank = index + 1;
          const { icon, borderColor, textColor, shadow } = getRankStyle(rank);
          return (
            <div
              key={user.email}
              className={`bg-white/5 backdrop-blur-lg rounded-xl border ${borderColor} ${shadow} p-4 sm:p-6 flex items-center gap-4 transition-all duration-300 hover:bg-white/10 hover:scale-[1.02]`}
            >
              {/* Rank */}
              <div className={`text-2xl sm:text-3xl font-black w-12 text-center ${textColor}`}>
                {icon}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <p className="text-lg sm:text-xl font-bold text-white truncate">{user.email}</p>
                <p className="text-sm text-zinc-400">
                  Total XP: <span className="font-semibold text-blue-400">{user.total_xp}</span>
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-x-6 gap-y-1 text-right">
                <div>
                  <p className="text-xs text-zinc-400">Total Solved</p>
                  <p className="text-lg font-bold text-white">{user.total_questions}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Daily Record</p>
                  <p className="text-lg font-bold text-white">{user.max_questions_in_a_day}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans p-4 sm:p-6 lg:p-8">
      {/* Background gradient effect */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <section className="text-center py-8">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent">
            Leaderboard
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto font-light">
            See who's at the top of their game. Keep learning to climb the ranks!
          </p>
        </section>

        {/* Leaderboard Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default LeaderboardPage;