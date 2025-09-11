'use client';

import React, { useState, useEffect } from 'react';
import { useQuestionGeneration, useContest } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wifi, WifiOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function WebSocketDemo() {
  const {
    generateQuestion,
    isGenerating,
    generatedQuestion,
    error: questionError,
    progress,
    isConnected
  } = useQuestionGeneration();

  const [formData, setFormData] = useState({
    examType: '',
    subject: '',
    difficulty: 'medium',
    questionType: 'multiple-choice'
  });

  const handleGenerateQuestion = () => {
    if (!formData.examType || !formData.subject) {
      alert('Please fill in exam type and subject');
      return;
    }
    
    generateQuestion(
      formData.examType,
      formData.subject,
      formData.difficulty,
      formData.questionType
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Connection Status */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-5 w-5 text-green-500" />
                  WebSocket Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-red-500" />
                  WebSocket Disconnected
                </>
              )}
            </CardTitle>
            <CardDescription>
              Real-time communication status with the server
            </CardDescription>
          </CardHeader>
        </Card>

        {/* API Status Notice */}
        <Card className="border-amber-600 bg-amber-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Gemini API Setup Required
            </CardTitle>
            <CardDescription className="text-amber-200">
              The demo will show mock data until Gemini API is properly configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>To enable real AI question generation:</p>
              <ol className="list-decimal list-inside space-y-1 text-amber-100">
                <li>Go to <a href="https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=626965897853" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Google Cloud Console</a></li>
                <li>Click "Enable" to enable the Generative Language API</li>
                <li>Or get a new API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-blue-400 hover:text-blue-300 underline">Google AI Studio</a></li>
                <li>Update your .env.local file with the new API key</li>
                <li>Restart the WebSocket server</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Question Generation Section */}
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader>
            <CardTitle>AI Question Generation</CardTitle>
            <CardDescription>
              Generate questions using Gemini AI with real-time feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                  Exam Type
                </label>
                <Input
                  placeholder="e.g., SAT, JEE, NEET"
                  value={formData.examType}
                  onChange={(e) => setFormData(prev => ({ ...prev, examType: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                  Subject
                </label>
                <Input
                  placeholder="e.g., Mathematics, Physics"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                  Difficulty
                </label>
                <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                  Question Type
                </label>
                <Select value={formData.questionType} onValueChange={(value) => setFormData(prev => ({ ...prev, questionType: value }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                    <SelectItem value="true-false">True/False</SelectItem>
                    <SelectItem value="short-answer">Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleGenerateQuestion}
                disabled={!isConnected || isGenerating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Question'
                )}
              </Button>
              
              {progress && (
                <div className="flex items-center gap-2 text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">{progress}</span>
                </div>
              )}
            </div>
            
            {questionError && (
              <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                <span>{questionError}</span>
              </div>
            )}
            
            {generatedQuestion && (
              <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-400">Question Generated Successfully</span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="border-blue-500 text-blue-400">
                      {generatedQuestion.examType}
                    </Badge>
                    <Badge variant="outline" className="border-purple-500 text-purple-400">
                      {generatedQuestion.subject}
                    </Badge>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                      {generatedQuestion.difficulty}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-white mb-2">Question:</h4>
                    <p className="text-zinc-300">{generatedQuestion.question}</p>
                  </div>
                  
                  {generatedQuestion.options && (
                    <div>
                      <h4 className="font-medium text-white mb-2">Options:</h4>
                      <div className="space-y-1">
                        {generatedQuestion.options.map((option, index) => (
                          <div key={index} className="text-zinc-300 text-sm">
                            {option}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium text-white mb-2">Correct Answer:</h4>
                    <p className="text-green-400 font-medium">{generatedQuestion.correctAnswer}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-white mb-2">Explanation:</h4>
                    <p className="text-zinc-300 text-sm">{generatedQuestion.explanation}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contest Demo Section */}
        <ContestDemo />
      </div>
    </div>
  );
}

function ContestDemo() {
  const [contestId, setContestId] = useState('');
  const [userId, setUserId] = useState('user_demo_123');
  
  const {
    contestData,
    leaderboard,
    error: contestError,
    isJoined,
    joinContest,
    getLeaderboard,
    isConnected
  } = useContest(contestId);

  const handleJoinContest = () => {
    if (!contestId) {
      alert('Please enter a contest ID');
      return;
    }
    joinContest(userId);
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/50">
      <CardHeader>
        <CardTitle>Contest Participation Demo</CardTitle>
        <CardDescription>
          Join contests and see real-time leaderboard updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">
              Contest ID
            </label>
            <Input
              placeholder="Enter contest ID"
              value={contestId}
              onChange={(e) => setContestId(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">
              User ID
            </label>
            <Input
              placeholder="Your user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>
        
        <div className="flex gap-4">
          <Button 
            onClick={handleJoinContest}
            disabled={!isConnected || !contestId}
            className="bg-green-600 hover:bg-green-700"
          >
            Join Contest
          </Button>
          
          <Button 
            onClick={getLeaderboard}
            disabled={!isConnected || !contestId}
            variant="outline"
            className="border-zinc-700"
          >
            Get Leaderboard
          </Button>
        </div>
        
        {contestError && (
          <div className="flex items-center gap-2 text-red-400 bg-red-900/20 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span>{contestError}</span>
          </div>
        )}
        
        {isJoined && contestData && (
          <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-400">Joined Contest Successfully</span>
            </div>
            
            <div className="space-y-2">
              <p><span className="text-zinc-400">Title:</span> {contestData.title}</p>
              <p><span className="text-zinc-400">Status:</span> {contestData.status}</p>
              <p><span className="text-zinc-400">Total Questions:</span> {contestData.totalQuestions}</p>
              <p><span className="text-zinc-400">Your Progress:</span> {contestData.userProgress?.answersCount || 0}/{contestData.totalQuestions}</p>
              <p><span className="text-zinc-400">Your Score:</span> {contestData.userProgress?.score || 0}</p>
            </div>
          </div>
        )}
        
        {leaderboard.length > 0 && (
          <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <h4 className="font-medium text-white mb-3">Leaderboard</h4>
            <div className="space-y-2">
              {leaderboard.map((participant, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-zinc-900/50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400">#{participant.rank}</span>
                    <span className="text-white">{participant.username}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-medium">{participant.score} points</div>
                    <div className="text-xs text-zinc-400">{Math.floor(participant.totalTimeSpent / 60)}:{(participant.totalTimeSpent % 60).toString().padStart(2, '0')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
