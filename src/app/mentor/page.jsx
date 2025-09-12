"use client";

import React, { useState, useEffect, useRef } from 'react';

// --- Helper Component for Markdown Rendering ---
const MarkdownResponse = ({ text }) => {
    if (!text) return null;

    const lines = text.split('\n');

    return (
        <div>
            {lines.map((line, index) => {
                // Ignore empty lines that might result from splitting
                if (line.trim() === "") return <div key={index} className="h-4"></div>;

                // Headings
                if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
                if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold mt-6 mb-3 border-b border-zinc-200 pb-2">{line.substring(3)}</h2>;
                if (line.startsWith('# ')) return <h1 key={index} className="text-2xl font-extrabold mt-8 mb-4">{line.substring(2)}</h1>;
                
                // Unordered List Items
                if (line.startsWith('* ') || line.startsWith('- ')) {
                    const content = line.substring(2);
                    const parts = content.split(/(\*\*.*?\*\*)/g).filter(Boolean);
                    return (
                         <li key={index} className="ml-5 list-disc">
                            {parts.map((part, i) => part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part)}
                        </li>
                    );
                }

                // Ordered List Items
                if (line.match(/^\d+\. /)) {
                    const content = line.replace(/^\d+\. /, '');
                    const parts = content.split(/(\*\*.*?\*\*)/g).filter(Boolean);
                    return (
                        <li key={index} className="ml-5 list-decimal">
                            {parts.map((part, i) => part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part)}
                        </li>
                    );
                }

                // Paragraph with bold support
                const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);
                return (
                    <p key={index} className="my-2 leading-relaxed">
                        {parts.map((part, i) => part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part)}
                    </p>
                );
            })}
        </div>
    );
};


// --- Main Page Component ---
const AiMentorPage = () => {
    // Form State
    const [currentStep, setCurrentStep] = useState(1);
    const [goal, setGoal] = useState(''); // 'career', 'learning', 'interview'
    const [careerDetails, setCareerDetails] = useState({ promotion: false, switching: false, negotiation: false });
    const [interviewDetails, setInterviewDetails] = useState({ competency: false, panel: false, situational: false });
    const [deadline, setDeadline] = useState('');
    const [availability, setAvailability] = useState([]);
    const [showFullResponse, setShowFullResponse] = useState(false);
    
    const interviewLabels = { competency: 'Competency-based', panel: 'Panel Interview', situational: 'Situational Scenarios' };
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const [learningSkill, setLearningSkill] = useState('');
    const [specificQuestion, setSpecificQuestion] = useState('');

    // App State
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState("Mentor is preparing your roadmap...");
    const [processingKeywords, setProcessingKeywords] = useState([]);
    const answerEndRef = useRef(null);

    // Scroll to the answer section when a new answer is generated
    useEffect(() => {
        if (currentAnswer || isLoading) {
            answerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentAnswer, isLoading]);

    // Effect for dynamic loading messages
    useEffect(() => {
        let interval;
        if (isLoading) {
            const messages = ["Processing your keywords...", "Analyzing your goal...", "Preparing your roadmap...", "Finalizing the details..."];
            let messageIndex = 0;
            setLoadingMessage(messages[0]);
            interval = setInterval(() => {
                messageIndex = (messageIndex + 1) % messages.length;
                setLoadingMessage(messages[messageIndex]);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const isFormValid = () => {
        if (!goal) return false;
        if (goal === 'learning' && !learningSkill.trim()) return false;
        if (!specificQuestion.trim()) return false;
        return true;
    };
    
    const getKeywordsForProcessing = () => {
        const keywords = [goal];
        if (goal === 'career') {
            Object.entries(careerDetails).filter(([, checked]) => checked).forEach(([key]) => keywords.push(key));
        } else if (goal === 'learning') {
            keywords.push(learningSkill);
        } else if (goal === 'interview') {
            Object.entries(interviewDetails).filter(([, checked]) => checked).forEach(([key]) => keywords.push(interviewLabels[key]));
        }
        return [...new Set(keywords.filter(k => k && k.trim() !== ''))];
    };

    const constructLLMPrompt = () => {
        let prompt = `Goal: `;
        if (goal === 'career') {
            const selectedDetails = Object.entries(careerDetails).filter(([, checked]) => checked).map(([key]) => key).join(', ');
            prompt += `Career Growth. Focus areas: ${selectedDetails || 'general advice'}.`;
        } else if (goal === 'learning') {
            prompt += `Learning a New Skill. Skill: ${learningSkill}.`;
        } else if (goal === 'interview') {
            const selectedDetails = Object.entries(interviewDetails).filter(([, checked]) => checked).map(([key]) => interviewLabels[key]).join(', ');
            prompt += `Interview Preparation. Interview types: ${selectedDetails || 'general preparation'}.`;
        }
        prompt += `\nUser's specific query: "${specificQuestion}"`;
        return prompt;
    };
    
    const constructUserQuestionForHistory = () => {
        let fullQuestion = `My primary goal is related to `;
        if (goal === 'career') {
            const selectedDetails = Object.entries(careerDetails).filter(([, checked]) => checked).map(([key]) => key).join(', ');
            fullQuestion += `Career Growth. Specifically, I'm interested in: ${selectedDetails || 'general advice'}.`;
        } else if (goal === 'learning') {
            fullQuestion += `Learning a New Skill. The skill is: ${learningSkill}.`;
        } else if (goal === 'interview') {
            const selectedDetails = Object.entries(interviewDetails).filter(([, checked]) => checked).map(([key]) => interviewLabels[key]).join(', ');
            fullQuestion += `Interview Preparation. Specifically for these types of interviews: ${selectedDetails || 'general preparation'}.`;
        }
        fullQuestion += `\n\nMy specific question is: "${specificQuestion}"`;
        return fullQuestion;
    };

    const handleSubmitQuestion = async (e) => {
        e.preventDefault();
        if (!isFormValid() || isLoading) return;

        setProcessingKeywords(getKeywordsForProcessing());
        setIsLoading(true);
        setError(null);
        setCurrentAnswer("");

        const llmPrompt = constructLLMPrompt();
        const userQuestionForHistory = constructUserQuestionForHistory();

        try {
            const mentorResponse = await callGeminiMentorAPI(llmPrompt);
            setCurrentAnswer(mentorResponse);
            setHistory(prevHistory => [{ question: userQuestionForHistory, answer: mentorResponse }, ...prevHistory]);
        } catch (err) {
            console.error("Error from Gemini API:", err);
            setError("Sorry, I'm having trouble responding right now. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const callGeminiMentorAPI = async (userQuestion) => {
        const apiKey = "AIzaSyDFhjr_dSRuZpNA5J6bzIdOBnIwKrEcbhw";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const systemInstruction = {
            parts: [{ text: `You are an AI mentor. Your goal is to provide actionable advice and gather necessary information through dynamic questions. 
            
            First, analyze if you need more specific information to provide better guidance. If yes, include a section at the end of your response with:
            
            ## Follow-up Questions
            * question1
            * question2
            
            Structure your main response using simple Markdown:
            1. Use headings (#, ##)
            2. Use bold (**text**)
            3. Use lists (* item or 1. item)
            
            Keep the response focused and include follow-up questions only if they are crucial for providing better guidance.` }]
        };

        const payload = { contents: [{ parts: [{ text: userQuestion }] }], systemInstruction: systemInstruction };
        
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

        const result = await response.json();
        const candidate = result.candidates?.[0];
        return candidate?.content?.parts?.[0]?.text || "I'm not sure how to respond to that. Could you rephrase?";
    };

    // --- RENDER ---
    return (
        <div className="bg-white text-black min-h-screen font-sans">
            <div className="container mx-auto max-w-2xl p-4">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold">AI Mentor Q&amp;A</h1>
                    <p className="text-zinc-600 mt-2">Fill out the form to get guidance on your goals.</p>
                </div>

                <div className="bg-white border border-zinc-200 p-6 sm:p-8 rounded-lg">
                    <StepIndicator currentStep={currentStep} totalSteps={5} />
                    <form onSubmit={handleSubmitQuestion} className="space-y-8">
                        {currentStep === 1 && (
                            <fieldset>
                                <legend className="text-lg font-medium mb-4">What is your primary goal?</legend>
                                <div className="grid sm:grid-cols-3 gap-4">
                                    {['Career Growth', 'Learning a Skill', 'Interview Prep'].map(label => {
                                        const value = label.split(' ')[0].toLowerCase();
                                        return (
                                            <div key={value}>
                                                <input type="radio" name="goal" id={value} value={value} checked={goal === value} 
                                                    onChange={e => {
                                                        setGoal(e.target.value);
                                                        setCurrentStep(2);
                                                    }} 
                                                    className="sr-only peer" 
                                                />
                                                <label htmlFor={value} className="block w-full text-center p-4 border border-zinc-300 rounded-md cursor-pointer peer-checked:bg-black peer-checked:text-white peer-checked:border-black transition-colors duration-200">
                                                    {label}
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </fieldset>
                        )}

                        {currentStep === 2 && (
                            <fieldset>
                                <legend className="text-lg font-medium mb-4">Tell me more about your {goal} goals</legend>
                                {goal === 'career' && (
                                    <div className="space-y-3">
                                        {Object.keys(careerDetails).map(key => (
                                            <Checkbox 
                                                key={key} 
                                                id={key} 
                                                label={key.charAt(0).toUpperCase() + key.slice(1)} 
                                                checked={careerDetails[key]} 
                                                onChange={() => setCareerDetails(prev => ({ ...prev, [key]: !prev[key] }))} 
                                            />
                                        ))}
                                    </div>
                                )}
                                {goal === 'learning' && (
                                    <input 
                                        type="text" 
                                        placeholder="e.g., Graphic Design, a new language, Project Management" 
                                        value={learningSkill} 
                                        onChange={e => setLearningSkill(e.target.value)} 
                                        className="w-full p-3 bg-zinc-100 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black" 
                                    />
                                )}
                                {goal === 'interview' && (
                                    <div className="space-y-3">
                                        {Object.keys(interviewDetails).map(key => (
                                            <Checkbox 
                                                key={key} 
                                                id={key} 
                                                label={interviewLabels[key]} 
                                                checked={interviewDetails[key]} 
                                                onChange={() => setInterviewDetails(prev => ({ ...prev, [key]: !prev[key] }))} 
                                            />
                                        ))}
                                    </div>
                                )}
                                <div className="mt-6 flex justify-between">
                                    <button type="button" onClick={() => setCurrentStep(1)} className="text-zinc-600 hover:text-black">
                                        ← Back
                                    </button>
                                    <button type="button" onClick={() => setCurrentStep(3)} className="bg-black text-white px-4 py-2 rounded-md">
                                        Continue →
                                    </button>
                                </div>
                            </fieldset>
                        )}

                        {currentStep === 3 && (
                            <fieldset>
                                <legend className="text-lg font-medium mb-4">When do you want to achieve this goal?</legend>
                                <input 
                                    type="date" 
                                    value={deadline} 
                                    onChange={e => setDeadline(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full p-3 bg-zinc-100 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                                />
                                <div className="mt-6 flex justify-between">
                                    <button type="button" onClick={() => setCurrentStep(2)} className="text-zinc-600 hover:text-black">
                                        ← Back
                                    </button>
                                    <button type="button" onClick={() => setCurrentStep(4)} className="bg-black text-white px-4 py-2 rounded-md">
                                        Continue →
                                    </button>
                                </div>
                            </fieldset>
                        )}

                        {currentStep === 4 && (
                            <fieldset>
                                <legend className="text-lg font-medium mb-4">Which days are you available to work on this?</legend>
                                <div className="space-y-3">
                                    {daysOfWeek.map(day => (
                                        <Checkbox
                                            key={day}
                                            id={day}
                                            label={day}
                                            checked={availability.includes(day)}
                                            onChange={() => {
                                                setAvailability(prev => 
                                                    prev.includes(day) 
                                                        ? prev.filter(d => d !== day)
                                                        : [...prev, day]
                                                );
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="mt-6 flex justify-between">
                                    <button type="button" onClick={() => setCurrentStep(3)} className="text-zinc-600 hover:text-black">
                                        ← Back
                                    </button>
                                    <button type="button" onClick={() => setCurrentStep(5)} className="bg-black text-white px-4 py-2 rounded-md">
                                        Continue →
                                    </button>
                                </div>
                            </fieldset>
                        )}

                        {currentStep === 5 && (
                            <div>
                                <label htmlFor="question-input" className="block text-lg font-medium mb-4">
                                    What specific guidance do you need?
                                </label>
                                <textarea 
                                    id="question-input" 
                                    value={specificQuestion} 
                                    onChange={(e) => setSpecificQuestion(e.target.value)} 
                                    placeholder="e.g., How can I build a strong portfolio for my new skill?" 
                                    className="w-full p-3 bg-zinc-100 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black resize-none" 
                                    rows="4" 
                                />
                                <div className="mt-6 flex justify-between">
                                    <button type="button" onClick={() => setCurrentStep(4)} className="text-zinc-600 hover:text-black">
                                        ← Back
                                    </button>
                                    <button type="submit" className="bg-black text-white px-6 py-2 rounded-md">
                                        Get Advice
                                    </button>
                                </div>
                            </div>
                        )}
                        
                    </form>
                </div>

                {error && <div className="bg-red-100 text-red-800 border border-red-200 p-4 rounded-lg mt-8 text-center">{error}</div>}
                
                {(isLoading || currentAnswer) && (
                    <div className="mt-10" ref={answerEndRef}>
                        <h2 className="text-2xl font-semibold mb-4 border-b border-zinc-200 pb-2">Mentor's Response</h2>
                        <div className="bg-zinc-50 p-6 rounded-lg border border-zinc-200 min-h-[150px]">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center text-zinc-600">
                                    <p className="text-sm mb-3">{loadingMessage}</p>
                                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                                        {processingKeywords.map((keyword, index) => (
                                            <span key={index} className="bg-zinc-200 text-zinc-800 text-sm font-medium px-2.5 py-0.5 rounded capitalize">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                    <svg className="animate-spin h-6 w-6 text-black mt-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            ) : (
                                <div>
                                    <div className={`${!showFullResponse && "max-h-[300px] overflow-hidden relative"}`}>
                                        <MarkdownResponse text={currentAnswer} />
                                        {!showFullResponse && (
                                            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-50 to-transparent" />
                                        )}
                                    </div>
                                    {currentAnswer && currentAnswer.length > 500 && (
                                        <button
                                            onClick={() => setShowFullResponse(!showFullResponse)}
                                            className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            {showFullResponse ? "Show Less" : "Read More"}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* FAQ Section */}
                <div className="mt-10">
                    <h2 className="text-2xl font-semibold border-b border-zinc-200 pb-2 mb-6">Frequently Asked Questions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-3">
                            <h3 className="font-semibold text-zinc-800 mb-2">Career Growth</h3>
                            {[
                                "How do I negotiate a higher salary?",
                                "What skills should I focus on for promotion?",
                                "Tips for successful career transition?"
                            ].map((question, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setGoal('career');
                                        setSpecificQuestion(question);
                                        setCurrentStep(5);
                                    }}
                                    className="block w-full text-left p-3 text-sm border border-zinc-200 rounded-md hover:bg-zinc-50 hover:border-black transition-colors duration-200"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-semibold text-zinc-800 mb-2">Learning Skills</h3>
                            {[
                                "How to create an effective study schedule?",
                                "Best practices for self-learning?",
                                "How to measure learning progress?"
                            ].map((question, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setGoal('learning');
                                        setSpecificQuestion(question);
                                        setCurrentStep(5);
                                    }}
                                    className="block w-full text-left p-3 text-sm border border-zinc-200 rounded-md hover:bg-zinc-50 hover:border-black transition-colors duration-200"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-3">
                            <h3 className="font-semibold text-zinc-800 mb-2">Interview Prep</h3>
                            {[
                                "Common behavioral interview questions?",
                                "How to handle technical interviews?",
                                "Tips for virtual interviews?"
                            ].map((question, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setGoal('interview');
                                        setSpecificQuestion(question);
                                        setCurrentStep(5);
                                    }}
                                    className="block w-full text-left p-3 text-sm border border-zinc-200 rounded-md hover:bg-zinc-50 hover:border-black transition-colors duration-200"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {history.length > 0 && (
                    <div className="mt-10 space-y-6">
                       <h2 className="text-2xl font-semibold border-b border-zinc-200 pb-2">History</h2>
                       {history.map((item, index) => (
                           <div key={index} className="bg-zinc-50 p-5 rounded-lg border border-zinc-200/80">
                               <p className="font-semibold text-zinc-600 mb-2 whitespace-pre-wrap">Q: {item.question}</p>
                               <div className="text-zinc-800"><MarkdownResponse text={item.answer}/></div>
                           </div>
                       ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const Checkbox = ({ id, label, checked, onChange }) => (
    <div className="flex items-center"><input id={id} type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-zinc-300 bg-zinc-100 text-black focus:ring-black" /><label htmlFor={id} className="ml-3 text-sm text-zinc-700">{label}</label></div>
);

const StepIndicator = ({ currentStep, totalSteps }) => {
    return (
        <div className="flex items-center justify-between w-full mb-8">
            {Array.from({ length: totalSteps }, (_, i) => (
                <div key={i} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        i + 1 === currentStep 
                            ? 'bg-black text-white'
                            : i + 1 < currentStep
                                ? 'bg-green-500 text-white'
                                : 'bg-zinc-200 text-zinc-600'
                    }`}>
                        {i + 1 < currentStep ? '✓' : i + 1}
                    </div>
                    {i < totalSteps - 1 && (
                        <div className={`h-1 w-16 mx-2 ${
                            i + 1 < currentStep ? 'bg-green-500' : 'bg-zinc-200'
                        }`} />
                    )}
                </div>
            ))}
        </div>
    );
};

export default AiMentorPage;

