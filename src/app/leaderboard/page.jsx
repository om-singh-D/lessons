"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import Footer from '@/components/Footer';
import LenisProvider from '@/components/ui/lenisProvider';
import { Trophy, Medal, Crown, Users, TrendingUp, Zap, Target, Star } from 'lucide-react';

// API endpoints
const LEADERBOARD_API_URL = 'http://localhost:8080/leaderboard';
const USER_API_URL = 'http://localhost:8080/user';

// A simple spinner for loading states
const Spinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-400"></div>
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
        bgColor: 'bg-yellow-500/10',
        shadow: 'shadow-yellow-400/20'
      };
    case 2:
      return {
        icon: '🥈',
        borderColor: 'border-slate-400/50',
        textColor: 'text-slate-300',
        bgColor: 'bg-slate-500/10',
        shadow: 'shadow-slate-400/20'
      };
    case 3:
      return {
        icon: '🥉',
        borderColor: 'border-amber-600/50',
        textColor: 'text-amber-400',
        bgColor: 'bg-amber-600/10',
        shadow: 'shadow-amber-600/20'
      };
    default:
      return {
        icon: `#${rank}`,
        borderColor: 'border-white/10',
        textColor: 'text-zinc-300',
        bgColor: 'bg-white/5',
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
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-400"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-16">
          <div className="relative bg-white/5 backdrop-blur-lg rounded-xl border border-red-500/30 shadow-lg p-12">
            <div className="w-16 h-16 bg-red-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-red-300 mb-2">Error Loading Leaderboard</h3>
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      );
    }
    
    if (leaderboardData.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="relative bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-lg p-12">
            <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-zinc-500" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-300 mb-2">The Leaderboard is Empty</h3>
            <p className="text-zinc-400 font-light">Complete some tasks to get your name on the board!</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Top 3 Podium */}
        {leaderboardData.length >= 3 && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-center text-white mb-8 flex items-center justify-center gap-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              Top Champions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {leaderboardData.slice(0, 3).map((user, index) => {
                const rank = index + 1;
                const { icon, borderColor, textColor, bgColor, shadow } = getRankStyle(rank);
                const heights = ['md:h-32', 'md:h-40', 'md:h-24']; // 2nd, 1st, 3rd
                const orders = ['md:order-1', 'md:order-0', 'md:order-2']; // 2nd, 1st, 3rd
                
                return (
                  <div key={user.email} className={`${orders[index]} relative`}>
                    <div className={`relative ${bgColor} backdrop-blur-lg rounded-xl border ${borderColor} ${shadow} p-6 text-center transition-all duration-300 hover:scale-105 ${heights[index]}`}>
                      {rank === 1 && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Crown className="w-8 h-8 text-yellow-400" />
                        </div>
                      )}
                      <div className="text-4xl mb-2">{icon}</div>
                      <p className="text-lg font-bold text-white mb-1">{user.email.split('@')[0]}</p>
                      <p className="text-2xl font-bold text-blue-400 mb-2">{user.total_xp} XP</p>
                      <div className="flex justify-center gap-4 text-xs text-zinc-400">
                        <span>{user.total_questions} solved</span>
                        <span>Max: {user.max_questions_in_a_day}/day</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full Rankings */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Medal className="w-5 h-5 text-silver-400" />
            Full Rankings
          </h3>
          {leaderboardData.map((user, index) => {
            const rank = index + 1;
            const { icon, borderColor, textColor, bgColor, shadow } = getRankStyle(rank);
            return (
              <div
                key={user.email}
                className={`relative ${bgColor} backdrop-blur-lg rounded-xl border ${borderColor} shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                {/* Glassy overlay for subtle effect */}
                <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 hover:opacity-10 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                  }}
                ></div>

                <div className="relative z-10 flex items-center gap-6">
                  {/* Rank */}
                  <div className={`text-2xl sm:text-3xl font-black w-16 text-center ${textColor} flex items-center justify-center`}>
                    {rank <= 3 ? (
                      <span className="text-3xl">{icon}</span>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="text-lg font-bold">{rank}</span>
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <p className="text-xl font-bold text-white mb-1">{user.email.split('@')[0]}</p>
                    <p className="text-sm text-zinc-400">{user.email}</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Total XP</p>
                      <p className="text-lg font-bold text-blue-400">{user.total_xp}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Solved</p>
                      <p className="text-lg font-bold text-green-400">{user.total_questions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400 mb-1">Daily Best</p>
                      <p className="text-lg font-bold text-purple-400">{user.max_questions_in_a_day}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <LenisProvider>
      <div className="min-h-screen bg-zinc-950 text-white font-sans">
        <Header />
        
        {/* Background gradient effect */}
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10">
          {/* Hero Section */}
          <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-yellow-300 via-white to-purple-300 bg-clip-text text-transparent leading-tight">
                🏆 Leaderboard
              </h1>
              <p className="text-lg md:text-xl text-zinc-300 mb-8 max-w-3xl mx-auto font-light">
                See who's at the top of their game. Keep learning, complete challenges, and climb the ranks!
              </p>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-blue-400 font-medium">Total Players</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{leaderboardData.length}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span className="text-green-400 font-medium">Top Score</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {leaderboardData.length > 0 ? leaderboardData[0]?.total_xp || '0' : '0'} XP
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 p-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">Most Active</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {leaderboardData.length > 0 ? Math.max(...leaderboardData.map(u => u.max_questions_in_a_day || 0)) : '0'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Leaderboard Content */}
          <section className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {renderContent()}
            </div>
          </section>
        </div>

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
        `}</style>
      </div>
    </LenisProvider>
  );
};

export default LeaderboardPage;