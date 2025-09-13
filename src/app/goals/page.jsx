"use client";
import React, { useState, useEffect } from 'react';

const GoalsPage = () => {
    const [goalKeyword, setGoalKeyword] = useState('');
    const [endGoal, setEndGoal] = useState('intermediate'); 
    const [dynamicQuestions, setDynamicQuestions] = useState([]);
    const [dynamicAnswers, setDynamicAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentStep, setCurrentStep] = useState(0); 
    const [tailwindClasses, setTailwindClasses] = useState({
        form: '',
        label: '',
        input: '',
        select: '',
        button: ''
    });

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
                
                // 3. Construct and call Gemini for dynamic questions
                const questionsPrompt = `
                    You are a helpful assistant for goal setting. Based on the following user profile, generate an array of strings with 3-4 concise and actionable questions to help them define a new personal goal. The questions should be specific and relevant to their current profile.
                    User Profession: ${userProfile.profession}
                    User Age: ${userProfile.age}
                    User XP: ${JSON.stringify(userProfile.xp)}
                    Example output:
                    ["What is your main motivation for this goal?", "What specific skills do you want to learn?", "What is a realistic timeline for achieving this goal?"]
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

                // 4. Construct and call Gemini for Tailwind CSS classes
                const cssPrompt = `
                    Generate a JSON object containing Tailwind CSS classes for a modern form. The object should have keys for 'form', 'label', 'input', 'select', and 'button'. Do not include any Markdown formatting like code blocks.
                    Example output:
                    {"form": "bg-white p-8 rounded-lg shadow-md max-w-lg mx-auto", "label": "block text-gray-700 text-sm font-bold mb-2", "input": "shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline", "select": "shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline", "button": "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"}
                `;
                const cssResponse = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: cssPrompt }] }] })
                });
                if (!cssResponse.ok) {
                    throw new Error('Failed to fetch CSS classes from Gemini API.');
                }
                const cssData = await cssResponse.json();
                const cssString = cssData.candidates[0].content.parts[0].text;
                const cleanedCssString = cssString.replace(/```json\n|```/g, '').trim();
                const cssObject = JSON.parse(cleanedCssString);
                setTailwindClasses(cssObject);

            } catch (err) {
                setError(err.message);
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
    misc: miscData // This is the array of strings
};
            
            const response = await fetch(`http://localhost:8080/goals/${email}`, {
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
            alert('Goal saved successfully!');
            
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

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen text-gray-700">Loading your personalized goal form...</div>;
    }

    if (error) {
        return <div className="text-center text-red-500 mt-10">Error: {error}</div>;
    }
    
    const renderFormContent = () => {
        if (currentStep === 0) {
            return (
                <>
                    <div className="mb-4">
                        <label htmlFor="goalKeyword" className={tailwindClasses.label}>Goal Keyword:</label>
                        <input
                            id="goalKeyword"
                            type="text"
                            value={goalKeyword}
                            onChange={(e) => setGoalKeyword(e.target.value)}
                            className={tailwindClasses.input}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="endGoal" className={tailwindClasses.label}>End Goal Level:</label>
                        <select id="endGoal" value={endGoal} onChange={(e) => setEndGoal(e.target.value)} className={tailwindClasses.select}>
                            <option value="intermediate">Intermediate</option>
                            <option value="medicore">Mediocre</option>
                            <option value="professional">Professional</option>
                        </select>
                    </div>
                </>
            );
        } else if (currentStep <= dynamicQuestions.length) {
            const currentQuestionIndex = currentStep - 1;
            const currentQuestion = dynamicQuestions[currentQuestionIndex];
            
            return (
                <div className="mb-4">
                    <label htmlFor={`question-${currentQuestionIndex}`} className={tailwindClasses.label}>{currentQuestion}</label>
                    <input
                        id={`question-${currentQuestionIndex}`}
                        type="text"
                        value={dynamicAnswers[currentQuestionIndex] || ''}
                        onChange={(e) => handleDynamicAnswerChange(currentQuestionIndex, e.target.value)}
                        className={tailwindClasses.input}
                        required
                    />
                </div>
            );
        }
    };
    
    const isFinalStep = currentStep === dynamicQuestions.length;

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <form onSubmit={handleFormSubmit} className={tailwindClasses.form}>
                <h2 className="text-2xl font-semibold text-center mb-6">Create a New Goal</h2>
                {renderFormContent()}
                <button type="submit" className={tailwindClasses.button}>
                    {isFinalStep ? 'Save Goal' : 'Next'}
                </button>
            </form>
        </div>
    );
};

export default GoalsPage;