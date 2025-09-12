"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes"; // ✅ next-themes
 
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { Header } from "@/components/header";

const PasswordCriteriaItem = ({ isMet, text }) => (
  <li
    className={`flex items-center gap-2 transition-colors duration-300 ${
      isMet ? "text-green-500" : "text-gray-400"
    }`}
  >
    {isMet ? (
      <CheckCircle className="w-4 h-4 flex-shrink-0" />
    ) : (
      <XCircle className="w-4 h-4 flex-shrink-0" />
    )}
    <span>{text}</span>
  </li>
);

const Login = () => {
  const router = useRouter();
  const { theme } = useTheme(); // ✅ get current theme
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  // New signup fields
  const [firstName, setFirstName] = useState("");
  const [age, setAge] = useState("");
  const [profession, setProfession] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecklistVisible, setIsChecklistVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    specialChar: false,
  });

  const isFormValid = () => {
    if (isLogin) return identifier.trim() && password.trim();
    return (
      username.trim() &&
      identifier.trim() &&
      firstName.trim() &&
      age.trim() &&
      profession.trim() &&
      primaryGoal.trim() &&
      password.trim() &&
      Object.values(passwordCriteria).every(Boolean)
    );
  };

  useEffect(() => {
    document.title = isLogin ? "ALCHPREP Login" : "ALCHPREP Signup";
  }, [isLogin]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) router.push("/dashboard");
  }, [router]);

  useEffect(() => {
    setPasswordCriteria({
      length: password.length >= 8, // Changed from 6 to 8
      uppercase: /[A-Z]/.test(password),
      specialChar: /[!@#$%^&*]/.test(password),
    });
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);
    
    if (!isLogin && !Object.values(passwordCriteria).every(Boolean)) {
      setErrorMsg("Password must meet all the criteria.");
      setIsLoading(false);
      return;
    }

    const endpoint = isLogin
      ? "/api/auth/login"
      : "/api/auth/signup";

    const payload = isLogin
      ? { identifier: identifier.toLowerCase(), password }
      : { 
          username, 
          email: identifier.toLowerCase(), 
          firstName,
          age: parseInt(age),
          profession,
          primaryGoal,
          password 
        };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies for JWT
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(
          data?.error || data?.message || data.errors?.[0]?.msg || "Error occurred"
        );
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        // For login, the JWT is set as httpOnly cookie automatically
        localStorage.setItem("username", data.user?.username || "");
        localStorage.setItem("email", data.user?.email || "");
        toast.success("Login successful!", { position: "top-center" });
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        // For signup, the JWT is also set as httpOnly cookie automatically
        localStorage.setItem("username", data.user?.username || "");
        localStorage.setItem("email", data.user?.email || "");
        toast.success("Signup successful! Redirecting to dashboard...", {
          position: "top-center",
        });
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    } catch (error) {
      console.error("Auth error:", error);
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section
      className={`w-full min-h-screen transition-colors duration-300 ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 to-black text-white"
          : "bg-gradient-to-br from-gray-100 to-white text-black"
      }`}
    >
      <ToastContainer />
      <Header/>
      <div className="flex flex-col items-center mt-20 justify-center min-h-[80vh] px-4">
        <div
          className={`backdrop-blur-lg border my-6 p-8 rounded-2xl shadow-2xl max-w-md w-full transition-colors duration-300 ${
            theme === "dark"
              ? "bg-white/10 border-white/20"
              : "bg-black/5 border-black/10"
          }`}
        >
          <h1 className="text-3xl font-semibold text-center mb-6">
            {isLogin ? "ALCHPREP Login" : "Join ALCHPREP"}
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      /^[a-zA-Z0-9_]*$/.test(e.target.value) &&
                      setUsername(e.target.value)
                    }
                    required
                    placeholder="john_doe"
                    className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="John"
                    className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">
                    Age
                  </label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    min="13"
                    max="120"
                    placeholder="25"
                    className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">
                    Profession
                  </label>
                  <select
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring"
                  >
                    <option value="">Select your profession</option>
                    <option value="Student">Student</option>
                    <option value="Developer">Developer</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Engineer">Engineer</option>
                    <option value="Designer">Designer</option>
                    <option value="Manager">Manager</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">
                    Primary Goal
                  </label>
                  <select
                    value={primaryGoal}
                    onChange={(e) => setPrimaryGoal(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring"
                  >
                    <option value="">Select your primary goal</option>
                    <option value="Learn new skills">Learn new skills</option>
                    <option value="Career advancement">Career advancement</option>
                    <option value="Exam preparation">Exam preparation</option>
                    <option value="Personal growth">Personal growth</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">
                {isLogin ? "Email or Username" : "Email"}
              </label>
              <input
                type={isLogin ? "text" : "email"}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder="JohnDoe@gmail.com"
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsChecklistVisible(true)}
                  required
                  placeholder="Password"
                  className="w-full px-4 py-2 pr-10 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div
                className={`transition-all duration-500 overflow-hidden ${
                  isChecklistVisible
                    ? "max-h-40 mt-2 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
                  <ul className="space-y-2">
                    <PasswordCriteriaItem
                      isMet={passwordCriteria.length}
                      text="At least 8 characters"
                    />
                    <PasswordCriteriaItem
                      isMet={passwordCriteria.uppercase}
                      text="One uppercase letter (A-Z)"
                    />
                    <PasswordCriteriaItem
                      isMet={passwordCriteria.specialChar}
                      text="One special character (!@#$%^&*)"
                    />
                  </ul>
                </div>
              </div>
            </div>
            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
            <button
              type="submit"
              disabled={!isFormValid() || isLoading}
              className="w-full bg-black dark:bg-white dark:text-black text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span className="ml-2">{isLogin ? "Signing In..." : "Signing Up..."}</span>
                </div>
              ) : (
                isLogin ? "Sign In" : "Sign Up"
              )}
            </button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                className="text-blue-700 dark:text-blue-400 underline"
                onClick={() => {
                  setIsLogin(!isLogin);
                  // Clear all form fields when switching
                  setIdentifier("");
                  setPassword("");
                  setUsername("");
                  setFirstName("");
                  setAge("");
                  setProfession("");
                  setPrimaryGoal("");
                  setErrorMsg("");
                }}
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Login;
