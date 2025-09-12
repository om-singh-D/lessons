// API Usage Example - Lesson Creator
// This file demonstrates how to interact with the Lesson Creator API

const API_BASE_URL = 'http://localhost:3000/api';

class LessonCreatorAPI {
  constructor(authToken) {
    this.authToken = authToken;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };
  }

  // Get all user lessons with optional filtering
  async getLessons(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add filters to query parameters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      const response = await fetch(`${API_BASE_URL}/lessons?${params.toString()}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching lessons:', error);
      return { success: false, error: error.message };
    }
  }

  // Create a new lesson
  async createLesson(lessonData) {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(lessonData)
      });

      return await response.json();
    } catch (error) {
      console.error('Error creating lesson:', error);
      return { success: false, error: error.message };
    }
  }

  // Update an existing lesson
  async updateLesson(lessonId, updateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons`, {
        method: 'PUT',
        headers: this.headers,
        body: JSON.stringify({
          lessonId,
          updateData
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error updating lesson:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete a lesson
  async deleteLesson(lessonId) {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons?lessonId=${lessonId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      return await response.json();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      return { success: false, error: error.message };
    }
  }

  // Export a lesson in specified format
  async exportLesson(lessonId, format = 'pdf') {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons/export`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          lessonId,
          format
        })
      });

      if (response.ok) {
        return {
          success: true,
          blob: await response.blob(),
          filename: this.getFilenameFromHeaders(response.headers, format)
        };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      console.error('Error exporting lesson:', error);
      return { success: false, error: error.message };
    }
  }

  // Get lesson templates
  async getTemplates(subject = null, gradeLevel = null, topic = null, useAI = false) {
    try {
      const params = new URLSearchParams();
      if (subject) params.append('subject', subject);
      if (gradeLevel) params.append('gradeLevel', gradeLevel);
      if (topic) params.append('topic', topic);
      if (useAI) params.append('useAI', 'true');

      const response = await fetch(`${API_BASE_URL}/lessons/templates?${params.toString()}`, {
        method: 'GET'
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching templates:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate custom template
  async generateCustomTemplate(templateData) {
    try {
      const response = await fetch(`${API_BASE_URL}/lessons/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });

      return await response.json();
    } catch (error) {
      console.error('Error generating custom template:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper method to extract filename from response headers
  getFilenameFromHeaders(headers, format) {
    const contentDisposition = headers.get('content-disposition');
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/);
      if (match) return match[1];
    }
    return `lesson.${format}`;
  }
}

// Example usage scenarios
class LessonCreatorExamples {
  constructor(api) {
    this.api = api;
  }

  // Example 1: Create a basic lesson without AI
  async createBasicMathLesson() {
    console.log('📚 Creating Basic Math Lesson...');
    
    const lessonData = {
      topic: 'Quadratic Equations',
      gradeLevel: '9',
      subject: 'mathematics',
      teachingObjectives: [
        'Students will understand the standard form of quadratic equations',
        'Students will learn to solve quadratic equations using factoring',
        'Students will apply quadratic equations to real-world problems'
      ],
      useAI: false,
      customLessonData: {
        title: 'Introduction to Quadratic Equations',
        duration: 50,
        difficulty: 'intermediate',
        tags: ['algebra', 'equations', 'factoring'],
        lessonOutline: {
          introduction: 'Review linear equations and introduce quadratic form',
          mainContent: 'Teach standard form, graphing, and factoring methods',
          conclusion: 'Practice problems and real-world applications'
        }
      }
    };

    const result = await this.api.createLesson(lessonData);
    
    if (result.success) {
      console.log('✅ Basic lesson created successfully!');
      console.log('Lesson ID:', result.lessonId);
      return result.lesson;
    } else {
      console.log('❌ Failed to create basic lesson:', result.error);
      return null;
    }
  }

  // Example 2: Create an AI-generated science lesson
  async createAIScienceLesson() {
    console.log('🤖 Creating AI-Generated Science Lesson...');
    
    const lessonData = {
      topic: 'Climate Change and Greenhouse Effect',
      gradeLevel: '8',
      subject: 'science',
      teachingObjectives: [
        'Students will understand the greenhouse effect mechanism',
        'Students will identify causes and effects of climate change',
        'Students will evaluate solutions for climate change mitigation'
      ],
      useAI: true
    };

    const result = await this.api.createLesson(lessonData);
    
    if (result.success) {
      console.log('✅ AI lesson created successfully!');
      console.log('Lesson Title:', result.lesson.title);
      console.log('Key Concepts:', result.lesson.keyConcepts?.length || 0);
      console.log('Activities:', result.lesson.activities?.length || 0);
      return result.lesson;
    } else {
      console.log('❌ Failed to create AI lesson:', result.error);
      return null;
    }
  }

  // Example 3: Search and filter lessons
  async searchLessons() {
    console.log('🔍 Searching User Lessons...');
    
    // Get all lessons
    const allLessons = await this.api.getLessons();
    console.log('Total lessons:', allLessons.user?.totalLessons || 0);
    
    // Filter by subject
    const mathLessons = await this.api.getLessons({ subject: 'mathematics' });
    console.log('Math lessons:', mathLessons.lessons?.length || 0);
    
    // Filter by grade level
    const highSchoolLessons = await this.api.getLessons({ gradeLevel: '9' });
    console.log('Grade 9 lessons:', highSchoolLessons.lessons?.length || 0);
    
    return allLessons;
  }

  // Example 4: Update a lesson with new content
  async updateLessonContent(lessonId) {
    console.log('📝 Updating Lesson Content...');
    
    const updateData = {
      title: 'Advanced Quadratic Equations - Updated',
      duration: 60,
      activities: [
        {
          type: 'discussion',
          title: 'Real-world Applications Discussion',
          description: 'Discuss where quadratic equations appear in real life',
          duration: 15,
          content: 'Explore projectile motion, area optimization, and business applications',
          materials: ['Whiteboard', 'Real-world examples'],
          instructions: 'Facilitate group discussion and encourage student examples'
        }
      ],
      tags: ['algebra', 'equations', 'factoring', 'applications', 'updated']
    };

    const result = await this.api.updateLesson(lessonId, updateData);
    
    if (result.success) {
      console.log('✅ Lesson updated successfully!');
      console.log('New title:', result.lesson.title);
      return result.lesson;
    } else {
      console.log('❌ Failed to update lesson:', result.error);
      return null;
    }
  }

  // Example 5: Export lesson in different formats
  async exportLessonInFormats(lessonId) {
    console.log('📤 Exporting Lesson in Multiple Formats...');
    
    const formats = ['json', 'pdf', 'lms'];
    const results = {};
    
    for (const format of formats) {
      const result = await this.api.exportLesson(lessonId, format);
      
      if (result.success) {
        console.log(`✅ ${format.toUpperCase()} export successful`);
        results[format] = result;
        
        // In a real application, you would download the file
        // For demo purposes, we'll just log the size
        console.log(`   File size: ${result.blob.size} bytes`);
      } else {
        console.log(`❌ ${format.toUpperCase()} export failed:`, result.error);
      }
    }
    
    return results;
  }

  // Example 6: Get lesson templates and generate custom template
  async exploreTemplates() {
    console.log('📋 Exploring Lesson Templates...');
    
    // Get general templates
    const templates = await this.api.getTemplates();
    console.log('Available subjects:', templates.subjects?.length || 0);
    console.log('Grade level mappings:', Object.keys(templates.gradeLevels || {}));
    
    // Get specific templates for middle school math
    const mathTemplates = await this.api.getTemplates('mathematics', 'middle');
    console.log('Math templates for middle school:', Object.keys(mathTemplates.templates?.mathematics?.middle || {}));
    
    // Generate AI suggestions for a topic
    const aiSuggestions = await this.api.getTemplates('science', 'elementary', 'Water Cycle', true);
    if (aiSuggestions.suggestions) {
      console.log('AI-generated activities:', aiSuggestions.suggestions.activities?.length || 0);
    }
    
    // Generate custom template
    const customTemplate = await this.api.generateCustomTemplate({
      subject: 'language_arts',
      gradeLevel: '6',
      topic: 'Creative Writing',
      duration: 45,
      focusAreas: ['imagination', 'narrative structure'],
      learningObjectives: ['Write engaging stories', 'Use descriptive language']
    });
    
    if (customTemplate.success) {
      console.log('✅ Custom template generated:', customTemplate.template?.title);
    }
    
    return { templates, customTemplate };
  }

  // Example 7: Complete workflow - Create, Update, Export
  async completeWorkflow() {
    console.log('🔄 Running Complete Lesson Creator Workflow...\n');
    
    try {
      // Step 1: Create a lesson
      const lesson = await this.createBasicMathLesson();
      if (!lesson) return;
      
      const lessonId = lesson._id;
      console.log('');
      
      // Step 2: Update the lesson
      await this.updateLessonContent(lessonId);
      console.log('');
      
      // Step 3: Export the lesson
      await this.exportLessonInFormats(lessonId);
      console.log('');
      
      // Step 4: Search lessons
      await this.searchLessons();
      console.log('');
      
      // Step 5: Explore templates
      await this.exploreTemplates();
      console.log('');
      
      console.log('🎉 Complete workflow finished successfully!');
      
    } catch (error) {
      console.error('❌ Workflow error:', error);
    }
  }
}

// Demo function to run examples
async function runLessonCreatorDemo() {
  console.log('🚀 Lesson Creator API Demo\n');
  console.log('=' .repeat(50));
  
  // Use the sample token from the user registration response
  const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGMzZTMwZmM3MjNiNTM5ODgyMzkxMWQiLCJ1c2VybmFtZSI6Impob2FzZG5iYW5lZ2Fkb24iLCJlbWFpbCI6ImpvaGFzZG5AZXhhbXBsZS5jb20iLCJpYXQiOjE3NTc2NjgxMTIsImV4cCI6MTc1ODI3MjkxMiwiYXVkIjoiZ2FtaWZpZWQtbGVhcm5pbmctdXNlcnMiLCJpc3MiOiJnYW1pZmllZC1sZWFybmluZy1wbGF0Zm9ybSJ9.6Xks9TScWcQTLFbKsUfU7kSuy2mIX-UXYmf-PYGVMNI';
  
  const api = new LessonCreatorAPI(sampleToken);
  const examples = new LessonCreatorExamples(api);
  
  // Run the complete workflow
  await examples.completeWorkflow();
}

// Frontend integration helper functions
const FrontendHelpers = {
  // Download blob as file
  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Format lesson data for display
  formatLessonForDisplay(lesson) {
    return {
      id: lesson._id,
      title: lesson.title,
      subject: lesson.subject,
      gradeLevel: lesson.gradeLevel,
      topic: lesson.topic,
      duration: `${lesson.duration} minutes`,
      objectives: lesson.teachingObjectives?.length || 0,
      activities: lesson.activities?.length || 0,
      lastUpdated: new Date(lesson.updatedAt).toLocaleDateString(),
      tags: lesson.tags?.join(', ') || 'No tags'
    };
  },

  // Validate lesson data before submission
  validateLessonData(lessonData) {
    const required = ['topic', 'gradeLevel', 'subject', 'teachingObjectives'];
    const missing = required.filter(field => !lessonData[field]);
    
    if (missing.length > 0) {
      return {
        valid: false,
        message: `Missing required fields: ${missing.join(', ')}`
      };
    }
    
    if (!Array.isArray(lessonData.teachingObjectives) || lessonData.teachingObjectives.length === 0) {
      return {
        valid: false,
        message: 'At least one teaching objective is required'
      };
    }
    
    return { valid: true };
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LessonCreatorAPI,
    LessonCreatorExamples,
    FrontendHelpers,
    runLessonCreatorDemo
  };
}

// Run demo if executed directly
if (typeof window === 'undefined' && require.main === module) {
  runLessonCreatorDemo().catch(console.error);
}
