"use client";
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import Footer from '@/components/Footer';
import LenisProvider from '@/components/ui/lenisProvider';
import { Target, Users, Calendar, BookOpen, CheckCircle, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

const GoalsPage = () => {
    const [goalKeyword, setGoalKeyword] = useState('');
    const [endGoal, setEndGoal] = useState('beginner'); 
    const [dynamicQuestions, setDynamicQuestions] = useState([]);
    const [dynamicAnswers, setDynamicAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentStep, setCurrentStep] = useState(0); 

    // Gemini API Endpoint
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=AIzaSyC9ordkhWuD8B7axV5wYoMswPy9ghOJfbY';

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                const token = localStorage.getItem('token');
                const email = localStorage.getItem('email');
                if (!token || !email) {
                    throw new Error('User not authenticated. Please log in.');
                }

                // Fetch user profile
                const userProfileResponse = await fetch('http://localhost:3000/api/user/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!userProfileResponse.ok) {
                    throw new Error('Failed to fetch user profile.');
                }
                const userProfile = await userProfileResponse.json();
                
                // Generate beginner-friendly questions based on user profile
                const questionsPrompt = `
                    You are a helpful assistant for goal setting for beginners. Based on the following user profile, generate an array of 3 simple, easy-to-understand questions to help them define a new learning goal. The questions should be beginner-friendly and encourage them to think about their motivation and realistic expectations.
                    
                    User Profession: ${userProfile.profession}
                    User Age: ${userProfile.age}
                    
                    Please generate questions that are:
                    - Simple and clear for beginners
                    - Motivational and encouraging 
                    - Help identify realistic goals
                    - Focus on learning and growth
                    
                    Example output:
                    ["What skill would you like to learn that excites you the most?", "How much time can you realistically spend learning each day?", "What would motivate you to keep going when it gets challenging?"]
                `;
                const questionsResponse = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: questionsPrompt }] }] })
                });
                if (!questionsResponse.ok) {
                    throw new Error('Failed to fetch dynamic questions from Gemini API.');
                }
                const questionsData = await questionsResponse.json();
                const questionsString = questionsData.candidates[0].content.parts[0].text;
                const cleanedQuestionsString = questionsString.replace(/```json\n|```/g, '').trim(); 
                const questionsArray = JSON.parse(cleanedQuestionsString);
                setDynamicQuestions(questionsArray);

            } catch (err) {
                setError(err.message);
                // Set default beginner-friendly questions if API fails
                setDynamicQuestions([
                    "What skill would you like to learn that excites you the most?",
                    "How much time can you spend learning each day (be realistic)?",
                    "What would motivate you to keep going when it gets challenging?"
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAllData();
    }, []);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        if (currentStep < dynamicQuestions.length) {
            setCurrentStep(currentStep + 1);
            return;
        }

        try {
            const email = localStorage.getItem('email');
            const token = localStorage.getItem('token');
            if (!email || !token) {
                throw new Error('User email or token not found in local storage.');
            }

            const miscData = dynamicQuestions.map((question, index) => {
                return `${question}: ${dynamicAnswers[index] || ''}`;
            });

            const payload = {
                goalKeyword: goalKeyword,
                end_goal: endGoal,
                misc: miscData 
            };
            
            const response = await fetch(`https://alchprep-backend12.vercel.app/goals/${email}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Goal successfully created/updated:', result);
            
            // Show success message and redirect
            setTimeout(() => {
                window.location.href = '/daily-tasks';
            }, 2000);
            
        } catch (err) {
            setError(err.message);
        }
    };
    
    const handleDynamicAnswerChange = (index, value) => {
        setDynamicAnswers(prevAnswers => ({
            ...prevAnswers,
            [index]: value
        }));
    };

    const handlePreviousStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (isLoading) {
        return (
            <LenisProvider>
                <div className="min-h-screen bg-zinc-950 text-white font-sans flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
                        <p className="text-zinc-400 font-light">Setting up your personalized goal form...</p>
                    </div>
                </div>
            </LenisProvider>
        );
    }

    if (error) {
        return (
            <LenisProvider>
                <div className="min-h-screen bg-zinc-950 text-white font-sans flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <div className="bg-red-800/20 text-red-300 border border-red-700/50 p-6 rounded-xl">
                            <h3 className="font-semibold mb-2">Oops! Something went wrong</h3>
                            <p className="text-sm">{error}</p>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </LenisProvider>
        );
    }
    
    const renderFormContent = () => {
        if (currentStep === 0) {
            return (
                <div className="space-y-6">
                    <div className="text-center mb-8">
                        <Target className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                            What Would You Like to Learn?
                        </h2>
                        <p className="text-zinc-400 font-light">
                            Let's start with the basics - what skill excites you most?
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="goalKeyword" className="block text-white text-lg font-semibold mb-3">
                                Your Learning Goal
                            </label>
                            <input
                                id="goalKeyword"
                                type="text"
                                value={goalKeyword}
                                onChange={(e) => setGoalKeyword(e.target.value)}
                                className="w-full p-4 rounded-xl bg-white/5 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-md transition-all duration-300 text-lg"
                                placeholder="e.g., JavaScript, Python, Guitar, Spanish..."
                                required
                            />
                            <p className="text-sm text-zinc-400 mt-2 font-light">
                                💡 Popular choices: Programming languages, musical instruments, foreign languages
                            </p>
                        </div>

                        <div>
                            <label htmlFor="endGoal" className="block text-white text-lg font-semibold mb-3">
                                How Far Do You Want to Go?
                            </label>
                            <select 
                                id="endGoal" 
                                value={endGoal} 
                                onChange={(e) => setEndGoal(e.target.value)} 
                                className="w-full p-4 rounded-xl bg-white/5 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-md transition-all duration-300 text-lg cursor-pointer"
                            >
                                <option value="beginner" className="bg-zinc-900">🌱 Beginner - Just getting started</option>
                                <option value="intermediate" className="bg-zinc-900">🚀 Intermediate - Build solid skills</option>
                                <option value="professional" className="bg-zinc-900">🏆 Professional - Master the craft</option>
                            </select>
                            <p className="text-sm text-zinc-400 mt-2 font-light">
                                Don't worry, you can always adjust this later!
                            </p>
                        </div>
                    </div>
                </div>
            );
        } else if (currentStep <= dynamicQuestions.length) {
            const currentQuestionIndex = currentStep - 1;
            const currentQuestion = dynamicQuestions[currentQuestionIndex];
            
            return (
                <div className="space-y-6">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl font-bold text-blue-400">{currentStep}</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-white">
                            Almost There!
                        </h2>
                        <p className="text-zinc-400 font-light">
                            Help us personalize your learning experience
                        </p>
                    </div>

                    <div>
                        <label htmlFor={`question-${currentQuestionIndex}`} className="block text-white text-lg font-semibold mb-4">
                            {currentQuestion}
                        </label>
                        <textarea
                            id={`question-${currentQuestionIndex}`}
                            value={dynamicAnswers[currentQuestionIndex] || ''}
                            onChange={(e) => handleDynamicAnswerChange(currentQuestionIndex, e.target.value)}
                            className="w-full p-4 rounded-xl bg-white/5 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-md transition-all duration-300 text-lg resize-none"
                            rows="4"
                            placeholder="Share your thoughts here..."
                            required
                        />
                        <p className="text-sm text-zinc-400 mt-2 font-light">
                            Be honest - this helps us create better learning tasks for you!
                        </p>
                    </div>

                    {/* Progress indicator */}
                    <div className="mt-8">
                        <div className="flex justify-between text-sm text-zinc-400 mb-2">
                            <span>Progress</span>
                            <span>{currentStep} of {dynamicQuestions.length}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(currentStep / dynamicQuestions.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            );
        }
    };
    
    const isFinalStep = currentStep === dynamicQuestions.length;

    return (
        <LenisProvider>
            <div className="min-h-screen bg-zinc-950 text-white font-sans">
                <Header/>
                
                {/* Background gradient effect */}
                <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
                    <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                </div>

                {/* Hero Section */}
                <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-300 via-white to-purple-300 bg-clip-text text-transparent leading-tight">
                            Set Your Learning Goal
                        </h1>
                        <p className="text-lg md:text-xl text-zinc-300 mb-8 max-w-3xl mx-auto font-light">
                            Start your learning journey with a personalized goal that matches your pace and interests.
                        </p>
                    </div>
                </section>

                {/* Main Form Section */}
                <section className="relative z-10 px-4 sm:px-6 lg:px-8 pb-20">
                    <div className="max-w-2xl mx-auto">
                        {/* Success Message */}
                        {currentStep > dynamicQuestions.length && (
                            <div className="bg-green-800/20 text-green-300 border border-green-700/50 p-6 rounded-xl text-center mb-8 backdrop-blur-md">
                                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                                <h3 className="text-xl font-bold mb-2">Goal Created Successfully! 🎉</h3>
                                <p className="font-light">Redirecting you to your daily tasks...</p>
                            </div>
                        )}

                        {/* Form Container */}
                        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 shadow-2xl p-8">
                            <form onSubmit={handleFormSubmit} className="space-y-8">
                                {renderFormContent()}
                                
                                {/* Action Buttons */}
                                <div className="flex justify-between items-center pt-6 border-t border-white/10">
                                    {currentStep > 0 && (
                                        <button
                                            type="button"
                                            onClick={handlePreviousStep}
                                            className="flex items-center px-6 py-3 text-zinc-300 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 backdrop-blur-md"
                                        >
                                            <ArrowLeft className="w-4 h-4 mr-2" />
                                            Previous
                                        </button>
                                    )}
                                    
                                    {currentStep === 0 && (
                                        <div></div> // Empty div for spacing
                                    )}
                                    
                                    <button 
                                        type="submit" 
                                        disabled={
                                            (currentStep === 0 && !goalKeyword.trim()) ||
                                            (currentStep > 0 && currentStep <= dynamicQuestions.length && 
                                             !dynamicAnswers[currentStep - 1]?.trim())
                                        }
                                        className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
                                            (currentStep === 0 && !goalKeyword.trim()) ||
                                            (currentStep > 0 && currentStep <= dynamicQuestions.length && 
                                             !dynamicAnswers[currentStep - 1]?.trim())
                                                ? 'bg-white/10 text-zinc-500 cursor-not-allowed' 
                                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:scale-105 shadow-lg hover:shadow-xl'
                                        }`}
                                    >
                                        {isFinalStep ? (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" />
                                                Create My Goal
                                            </>
                                        ) : (
                                            <>
                                                Next Step
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Helper Text */}
                        <div className="text-center mt-8">
                            <p className="text-zinc-400 text-sm font-light">
                                🔒 Your information is secure and will only be used to personalize your learning experience
                            </p>
                        </div>
                    </div>
                </section>

                <Footer/>
                
                {/* Animation Styles */}
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

export default GoalsPage;