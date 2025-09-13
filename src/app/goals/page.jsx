"use client";
import React, { useState, useEffect } from 'react';
import { Target, ArrowRight, ArrowLeft, Sparkles, CheckCircle } from 'lucide-react';

// --- Placeholder Components (as per single-file mandate) ---
const Header = () => (
  <header className="p-4 bg-zinc-900/50 backdrop-blur-md fixed top-0 left-0 right-0 z-50 shadow-lg">
    <nav className="max-w-7xl mx-auto flex justify-between items-center text-white">
      <div className="flex items-center space-x-2">
        <Sparkles className="h-6 w-6 text-blue-400" />
        <span className="text-xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">AlchemyPrep</span>
      </div>
    </nav>
  </header>
);

const Footer = () => (
  <footer className="w-full text-center py-4 text-sm text-zinc-500 bg-zinc-950">
    <p>&copy; 2024 AlchemyPrep. All rights reserved.</p>
  </footer>
);

const LenisProvider = ({ children }) => <div>{children}</div>;

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- Main Goals Page Component ---
const GoalsPage = () => {
  const [goalKeyword, setGoalKeyword] = useState('');
  const [endGoal, setEndGoal] = useState('beginner');
  const [dynamicQuestions, setDynamicQuestions] = useState([]);
  const [dynamicAnswers, setDynamicAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  // --- Firebase State ---
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);

  // Gemini API Endpoint - Note: API Key is handled securely
  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=';

  // --- Firebase Initialization and Auth ---
  useEffect(() => {
    try {
      // Use global variables provided by the Canvas environment
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
      const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

      if (Object.keys(firebaseConfig).length === 0) {
        throw new Error("Firebase configuration is missing.");
      }

      const app = initializeApp(firebaseConfig, 'alchemy-prep-app');
      const authInstance = getAuth(app);
      const dbInstance = getFirestore(app);

      setAuth(authInstance);
      setDb(dbInstance);

      onAuthStateChanged(authInstance, (user) => {
        if (user) {
          setUserId(user.uid);
          console.log("User authenticated:", user.uid);
        } else {
          // Fallback to anonymous sign-in if no token is available
          signInAnonymously(authInstance).then((anonUserCredential) => {
            setUserId(anonUserCredential.user.uid);
            console.log("Signed in anonymously:", anonUserCredential.user.uid);
          });
        }
      });
      
      // Attempt to sign in with the provided custom token
      if (initialAuthToken) {
        signInWithCustomToken(authInstance, initialAuthToken).catch(err => {
          console.error("Custom token sign-in failed, falling back to anonymous:", err);
        });
      }
    } catch (err) {
      console.error("Firebase setup error:", err);
      setError("Failed to initialize the application. Please try again.");
      setIsLoading(false);
    }
  }, []);

  // --- Fetch Dynamic Questions from Gemini API ---
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!userId) {
        return; // Wait for Firebase auth to be ready
      }

      try {
        const questionsPrompt = {
          contents: [{
            parts: [{
              text: `You are a helpful assistant for goal setting. Generate an array of 3 simple, easy-to-understand questions to help a new user define a learning goal. The questions should be motivational and encourage them to think about their motivation and realistic expectations.`
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY",
              items: {
                type: "STRING"
              }
            }
          },
        };
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(questionsPrompt)
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dynamic questions from Gemini API.');
        }

        const data = await response.json();
        const questionsArray = JSON.parse(data.candidates[0].content.parts[0].text);
        setDynamicQuestions(questionsArray);
      } catch (err) {
        console.error("API Error:", err);
        setError("Failed to generate personalized questions. Using defaults.");
        setDynamicQuestions([
          "What skill would you like to learn that excites you the most?",
          "How much time can you spend learning each day (be realistic)?",
          "What would motivate you to keep going when it gets challenging?"
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, [userId]); // Depend on userId to ensure auth is ready

  // --- Firestore Data Subscription (for real-time updates) ---
  useEffect(() => {
    if (!db || !userId) return;

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const goalRef = doc(db, `artifacts/${appId}/users/${userId}/goals/my_goal`);

    const unsubscribe = onSnapshot(goalRef, (snapshot) => {
      if (snapshot.exists()) {
        const goalData = snapshot.data();
        console.log("Goal data updated:", goalData);
        // You could update state here if needed
      }
    }, (err) => {
      console.error("Firestore subscription error:", err);
    });

    return () => unsubscribe();
  }, [db, userId]);

  // --- Form Submission Handler ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (currentStep < dynamicQuestions.length) {
      setCurrentStep(currentStep + 1);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!db || !userId) {
        throw new Error('Database or user not ready.');
      }

      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const goalRef = doc(db, `artifacts/${appId}/users/${userId}/goals/my_goal`);
      
      const miscData = dynamicQuestions.map((question, index) => {
        return { question: question, answer: dynamicAnswers[index] || '' };
      });

      const payload = {
        goalKeyword: goalKeyword,
        end_goal: endGoal,
        misc: miscData,
        createdAt: new Date(),
        userId: userId
      };

      await setDoc(goalRef, payload, { merge: true });
      console.log('Goal successfully created/updated in Firestore.');

      // Redirect after success
      setTimeout(() => {
        // In a real app, this would be a proper router navigation
        window.location.href = '/daily-tasks';
      }, 2000);

    } catch (err) {
      console.error("Firestore write failed:", err);
      setError("Failed to save your goal. Please try again.");
    } finally {
      setIsSubmitting(false);
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

  if (isLoading || !userId) {
    return (
      <LenisProvider>
        <div className="min-h-screen bg-zinc-950 text-white font-sans flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
            <p className="text-zinc-400 font-light">
              {userId ? "Fetching personalized questions..." : "Connecting securely..."}
            </p>
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
        {/* User ID Display for Debugging */}
        {userId && (
          <div className="fixed top-4 right-4 z-50 text-xs text-zinc-500 p-2 rounded-lg bg-zinc-900/50 backdrop-blur-lg border border-zinc-700">
            User ID: {userId}
          </div>
        )}
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-28 pb-20 px-4 sm:px-6 lg:px-8">
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
                      isSubmitting ||
                      (currentStep === 0 && !goalKeyword.trim()) ||
                      (currentStep > 0 && !dynamicAnswers[currentStep - 1]?.trim())
                    }
                    className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform ${
                      (isSubmitting)
                        ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                        : ((currentStep === 0 && !goalKeyword.trim()) || (currentStep > 0 && !dynamicAnswers[currentStep - 1]?.trim()))
                          ? 'bg-white/10 text-zinc-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:scale-105 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {isSubmitting ? (
                      "Saving..."
                    ) : isFinalStep ? (
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
