"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
 
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

const Signup = () => {
  const router = useRouter();
  const { theme } = useTheme();
 
  // State for signup form fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [age, setAge] = useState("");
  const [profession, setProfession] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");

  // State for UI and password validation
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChecklistVisible, setIsChecklistVisible] = useState(false);
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    specialChar: false,
  });

  // Check if all required fields are filled and password criteria are met
  const isFormValid = () => {
    return (
      username.trim() &&
      email.trim() &&
      password.trim() &&
      firstName.trim() &&
      age &&
      profession.trim() &&
      primaryGoal.trim() &&
      Object.values(passwordCriteria).every(Boolean)
    );
  };

  // Update page title and password criteria
  useEffect(() => {
    document.title = "ALCHPREP Signup";
  }, []);

  useEffect(() => {
    setPasswordCriteria({
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      specialChar: /[!@#$%^&*]/.test(password),
    });
  }, [password]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
   
    if (!Object.values(passwordCriteria).every(Boolean)) {
      setErrorMsg("Password must meet all the criteria.");
      return;
    }

    const endpoint = "http://localhost:3001/api/signup";

    const payload = {
      username,
      email: email.toLowerCase(),
      password,
      firstName,
      age: Number(age),
      profession,
      primaryGoal,
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(
          data?.error || data?.message || data.errors?.[0]?.msg || "Error"
        );
        return;
      }
      toast.success("Signup successful! You can now login.", {
        position: "top-center",
      });
      setTimeout(() => router.push("/login"), 1500); // Redirect to login page after successful signup
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
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
      <Header />
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div
          className={`backdrop-blur-lg border my-6 p-8 rounded-2xl shadow-2xl max-w-md w-full transition-colors duration-300 ${
            theme === "dark"
              ? "bg-white/10 border-white/20"
              : "bg-black/5 border-black/10"
          }`}
        >
          <h1 className="text-3xl font-semibold text-center mb-6">
            Join ALCHPREP
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Fields */}
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="Jane"
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
                placeholder="28"
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">
                Profession
              </label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                required
                placeholder="Frontend Developer"
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">
                Primary Goal
              </label>
              <input
                type="text"
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                required
                placeholder="Master backend development with Node.js"
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-800 text-black dark:text-white rounded-lg focus:outline-none focus:ring"
              />
            </div>
            {/* Existing Fields */}
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
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                      text="At least 6 characters"
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
              disabled={!isFormValid()}
              className="w-full bg-black dark:bg-white dark:text-black text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
            >
              Sign Up
            </button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Already have an account?{" "}
              <button
                type="button"
                className="text-blue-700 dark:text-blue-400 underline"
                onClick={() => router.push("/login")}
              >
                Log in
              </button>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Signup;