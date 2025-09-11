'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export function useWebSocket() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
    
    const newSocket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: maxReconnectAttempts,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        setConnectionError('Server disconnected');
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
      
      setReconnectAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= maxReconnectAttempts) {
          setConnectionError('Max reconnection attempts reached');
        }
        return newAttempts;
      });
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      setConnectionError('Reconnection failed');
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const emit = useCallback((event, data, callback) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data, callback);
      return true;
    } else {
      console.warn('WebSocket not connected, cannot emit event:', event);
      return false;
    }
  }, []);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      
      // Return cleanup function
      return () => {
        if (socketRef.current) {
          socketRef.current.off(event, callback);
        }
      };
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket,
    isConnected,
    connectionError,
    reconnectAttempts,
    connect,
    disconnect,
    emit,
    on,
    off
  };
}

// Question generation hook
export function useQuestionGeneration() {
  const { emit, on, isConnected } = useWebSocket();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  const generateQuestion = useCallback(async (examType, subject, difficulty = 'medium', questionType = 'multiple-choice') => {
    if (!isConnected) {
      setError('WebSocket not connected');
      return;
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    setIsGenerating(true);
    setError(null);
    setGeneratedQuestion(null);
    setProgress('Connecting to AI...');

    emit('question:generate', {
      examType,
      subject,
      difficulty,
      questionType,
      requestId
    });

    // Set up listeners for this specific request
    const cleanupListeners = [];

    cleanupListeners.push(on('question:generating', (data) => {
      if (data.requestId === requestId) {
        setProgress(data.message);
      }
    }));

    cleanupListeners.push(on('question:generated', (data) => {
      if (data.requestId === requestId) {
        setIsGenerating(false);
        setGeneratedQuestion(data.question);
        setProgress(null);
        
        // Cleanup listeners
        cleanupListeners.forEach(cleanup => cleanup());
      }
    }));

    cleanupListeners.push(on('question:error', (data) => {
      if (data.requestId === requestId) {
        setIsGenerating(false);
        setError(data.error);
        setProgress(null);
        
        // Cleanup listeners
        cleanupListeners.forEach(cleanup => cleanup());
      }
    }));

    // Timeout after 30 seconds
    setTimeout(() => {
      if (isGenerating) {
        setIsGenerating(false);
        setError('Request timeout');
        setProgress(null);
        cleanupListeners.forEach(cleanup => cleanup());
      }
    }, 30000);

  }, [emit, on, isConnected, isGenerating]);

  return {
    generateQuestion,
    isGenerating,
    generatedQuestion,
    error,
    progress,
    isConnected
  };
}

// Contest participation hook
export function useContest(contestId) {
  const { emit, on, isConnected } = useWebSocket();
  const [contestData, setContestData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState(null);
  const [isJoined, setIsJoined] = useState(false);

  const joinContest = useCallback((userId) => {
    if (!isConnected || !contestId) {
      setError('WebSocket not connected or no contest ID');
      return;
    }

    emit('contest:join', { contestId, userId });
  }, [emit, isConnected, contestId]);

  const submitAnswer = useCallback((questionId, answer, timeSpent, userId) => {
    if (!isConnected || !contestId) {
      setError('WebSocket not connected or no contest ID');
      return;
    }

    emit('contest:submit_answer', {
      contestId,
      questionId,
      answer,
      timeSpent,
      userId
    });
  }, [emit, isConnected, contestId]);

  const getLeaderboard = useCallback(() => {
    if (!isConnected || !contestId) {
      return;
    }

    emit('contest:get_leaderboard', { contestId });
  }, [emit, isConnected, contestId]);

  useEffect(() => {
    if (!isConnected) return;

    const cleanupListeners = [];

    cleanupListeners.push(on('contest:joined', (data) => {
      setContestData(data.contest);
      setIsJoined(true);
      setError(null);
    }));

    cleanupListeners.push(on('contest:error', (data) => {
      setError(data.error);
    }));

    cleanupListeners.push(on('contest:answer_submitted', (data) => {
      // Update contest data with new answer
      setContestData(prev => prev ? {
        ...prev,
        userProgress: {
          ...prev.userProgress,
          answersCount: data.answersCount,
          score: data.totalScore,
          completed: data.completed
        }
      } : null);
    }));

    cleanupListeners.push(on('contest:leaderboard', (data) => {
      setLeaderboard(data.leaderboard || []);
    }));

    cleanupListeners.push(on('contest:leaderboard_update', (data) => {
      setLeaderboard(data.leaderboard || []);
    }));

    cleanupListeners.push(on('contest:participant_joined', (data) => {
      // Handle new participant joining
      console.log('New participant joined:', data);
    }));

    cleanupListeners.push(on('contest:participant_completed', (data) => {
      // Handle participant completion
      console.log('Participant completed:', data);
    }));

    return () => {
      cleanupListeners.forEach(cleanup => cleanup());
    };
  }, [isConnected, on]);

  return {
    contestData,
    leaderboard,
    error,
    isJoined,
    joinContest,
    submitAnswer,
    getLeaderboard,
    isConnected
  };
}
