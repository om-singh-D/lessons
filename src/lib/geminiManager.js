class GeminiAPIManager {
  constructor() {
    this.apiKeys = this.loadAPIKeys();
    this.currentKeyIndex = 0;
    this.keyUsageStats = new Map();
    this.rateLimitResetTimes = new Map();
    this.blockedKeys = new Set();
    
    // Initialize usage stats for each key
    this.apiKeys.forEach((key, index) => {
      this.keyUsageStats.set(index, {
        requestCount: 0,
        lastRequestTime: null,
        errorCount: 0,
        successCount: 0
      });
      this.rateLimitResetTimes.set(index, null);
    });
    
    console.log(`Gemini API Manager initialized with ${this.apiKeys.length} API keys`);
  }
  
  loadAPIKeys() {
    const keys = [];
    
    // Load primary key
    if (process.env.GEMINI_API_KEY) {
      keys.push(process.env.GEMINI_API_KEY);
    }
    
    // Load additional keys for rotation
    for (let i = 1; i <= 10; i++) {
      const key = process.env[`GEMINI_API_KEY_${i}`];
      if (key && !keys.includes(key)) {
        keys.push(key);
      }
    }
    
    if (keys.length === 0) {
      throw new Error('No Gemini API keys found in environment variables');
    }
    
    return keys;
  }
  
  getCurrentKey() {
    // Check if current key is blocked or rate limited
    if (this.isKeyBlocked(this.currentKeyIndex)) {
      this.rotateToNextAvailableKey();
    }
    
    return {
      key: this.apiKeys[this.currentKeyIndex],
      index: this.currentKeyIndex
    };
  }
  
  isKeyBlocked(keyIndex) {
    if (this.blockedKeys.has(keyIndex)) {
      return true;
    }
    
    const resetTime = this.rateLimitResetTimes.get(keyIndex);
    if (resetTime && Date.now() < resetTime) {
      return true;
    }
    
    // Remove from blocked keys if reset time has passed
    if (resetTime && Date.now() >= resetTime) {
      this.rateLimitResetTimes.set(keyIndex, null);
      this.blockedKeys.delete(keyIndex);
    }
    
    return false;
  }
  
  rotateToNextAvailableKey() {
    const startIndex = this.currentKeyIndex;
    let attempts = 0;
    
    do {
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      attempts++;
      
      // If we've checked all keys and none are available
      if (attempts >= this.apiKeys.length) {
        console.warn('All API keys are rate limited or blocked');
        // Find the key with the earliest reset time
        let earliestResetTime = Infinity;
        let bestKeyIndex = 0;
        
        for (let i = 0; i < this.apiKeys.length; i++) {
          const resetTime = this.rateLimitResetTimes.get(i) || 0;
          if (resetTime < earliestResetTime) {
            earliestResetTime = resetTime;
            bestKeyIndex = i;
          }
        }
        
        this.currentKeyIndex = bestKeyIndex;
        break;
      }
    } while (this.isKeyBlocked(this.currentKeyIndex) && this.currentKeyIndex !== startIndex);
    
    console.log(`Rotated to API key index: ${this.currentKeyIndex}`);
  }
  
  async generateContent(prompt, options = {}) {
    const maxRetries = this.apiKeys.length;
    let lastError = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { key, index } = this.getCurrentKey();
      
      try {
        const response = await this.makeGeminiRequest(key, prompt, options);
        
        // Update success stats
        const stats = this.keyUsageStats.get(index);
        stats.successCount++;
        stats.lastRequestTime = Date.now();
        
        console.log(`Successful request with key index ${index}`);
        return response;
        
      } catch (error) {
        lastError = error;
        await this.handleAPIError(error, index);
        
        // If it's not a rate limit error, try next key immediately
        if (!this.isRateLimitError(error)) {
          this.rotateToNextAvailableKey();
        }
      }
    }
    
    // If all keys failed, throw the last error
    throw this.createAPIError(lastError);
  }
  
  async makeGeminiRequest(apiKey, prompt, options = {}) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        topK: options.topK || 40,
        topP: options.topP || 0.95,
        maxOutputTokens: options.maxOutputTokens || 1024,
        ...options.generationConfig
      },
      safetySettings: options.safetySettings || [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(`Gemini API error: ${response.status}`);
      error.response = { status: response.status, data: errorData };
      throw error;
    }
    
    const data = await response.json();
    
    if (!data || !data.candidates || data.candidates.length === 0) {
      throw new Error('No content generated by Gemini API');
    }
    
    return {
      text: data.candidates[0].content.parts[0].text,
      safetyRatings: data.candidates[0].safetyRatings,
      finishReason: data.candidates[0].finishReason,
      fullResponse: data
    };
  }
  
  async handleAPIError(error, keyIndex) {
    const stats = this.keyUsageStats.get(keyIndex);
    stats.errorCount++;
    stats.lastRequestTime = Date.now();
    
    if (this.isRateLimitError(error)) {
      console.warn(`Rate limit hit for key index ${keyIndex}:`, error.response?.data || error.message);
      
      // Block this key for a period
      const resetTime = this.calculateResetTime(error);
      this.rateLimitResetTimes.set(keyIndex, resetTime);
      this.blockedKeys.add(keyIndex);
      
      // Rotate to next key
      this.rotateToNextAvailableKey();
      
    } else if (this.isPermanentError(error)) {
      console.error(`Permanent error for key index ${keyIndex}:`, error.response?.data || error.message);
      // Block this key permanently (until server restart)
      this.blockedKeys.add(keyIndex);
      this.rotateToNextAvailableKey();
      
    } else {
      console.error(`API error for key index ${keyIndex}:`, error.response?.data || error.message);
    }
  }
  
  isRateLimitError(error) {
    if (!error.response) return false;
    
    const status = error.response.status;
    const errorMessage = error.response.data?.error?.message?.toLowerCase() || '';
    
    return status === 429 || 
           status === 403 && (errorMessage.includes('quota') || errorMessage.includes('rate limit')) ||
           errorMessage.includes('resource has been exhausted');
  }
  
  isPermanentError(error) {
    if (!error.response) return false;
    
    const status = error.response.status;
    const errorMessage = error.response.data?.error?.message?.toLowerCase() || '';
    
    return status === 401 || // Unauthorized
           status === 403 && !errorMessage.includes('quota') && !errorMessage.includes('rate limit') ||
           status === 400 && errorMessage.includes('api key');
  }
  
  calculateResetTime(error) {
    // Default to 60 seconds
    let resetSeconds = 60;
    
    // Try to extract reset time from headers
    if (error.response?.headers) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter) {
        resetSeconds = parseInt(retryAfter, 10) || 60;
      }
    }
    
    // Add some jitter to avoid thundering herd
    const jitter = Math.random() * 10;
    return Date.now() + (resetSeconds + jitter) * 1000;
  }
  
  createAPIError(originalError) {
    const error = new Error('Gemini API request failed');
    error.code = 'GEMINI_API_ERROR';
    error.originalError = originalError;
    
    if (this.isRateLimitError(originalError)) {
      error.code = 'GEMINI_RATE_LIMIT';
      error.retryAfter = 60;
    }
    
    return error;
  }
  
  // Generate questions for specific exams/topics
  async generateQuestion(examType, subject, difficulty = 'medium', questionType = 'multiple-choice') {
    const prompt = this.buildQuestionPrompt(examType, subject, difficulty, questionType);
    
    try {
      const response = await this.generateContent(prompt, {
        temperature: 0.8,
        maxOutputTokens: 1500
      });
      
      return this.parseQuestionResponse(response.text);
    } catch (error) {
      console.error('Failed to generate question:', error);
      throw error;
    }
  }
  
  buildQuestionPrompt(examType, subject, difficulty, questionType) {
    return `Generate a ${difficulty} difficulty ${questionType} question for ${examType} exam in ${subject}.

Requirements:
- The question should be appropriate for ${examType} level
- Include 4 multiple choice options (A, B, C, D) if it's multiple-choice
- Provide the correct answer
- Include a brief explanation for the correct answer
- Make it realistic and challenging for ${difficulty} level

Format the response as JSON:
{
  "question": "Question text here",
  "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
  "correctAnswer": "A",
  "explanation": "Explanation text here",
  "subject": "${subject}",
  "difficulty": "${difficulty}",
  "examType": "${examType}",
  "questionType": "${questionType}"
}`;
  }
  
  parseQuestionResponse(responseText) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, try to parse manually
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Failed to parse question response:', error);
      throw new Error('Failed to parse Gemini response');
    }
  }
  
  // Get usage statistics
  getUsageStats() {
    const stats = {};
    this.keyUsageStats.forEach((stat, index) => {
      stats[`key_${index}`] = {
        ...stat,
        isBlocked: this.blockedKeys.has(index),
        resetTime: this.rateLimitResetTimes.get(index)
      };
    });
    return stats;
  }
  
  // Get health status
  getHealthStatus() {
    const availableKeys = this.apiKeys.length - this.blockedKeys.size;
    const totalRequests = Array.from(this.keyUsageStats.values())
      .reduce((sum, stat) => sum + stat.successCount + stat.errorCount, 0);
    
    return {
      status: availableKeys > 0 ? 'healthy' : 'degraded',
      totalKeys: this.apiKeys.length,
      availableKeys,
      blockedKeys: this.blockedKeys.size,
      currentKeyIndex: this.currentKeyIndex,
      totalRequests
    };
  }
}

// Create a singleton instance
let geminiManager;

export function getGeminiManager() {
  if (!geminiManager) {
    geminiManager = new GeminiAPIManager();
  }
  return geminiManager;
}

export default GeminiAPIManager;
