// Test script for Lesson Creator API
// Run with: node test-lesson-api.js

const API_BASE = 'http://localhost:3000/api';

// Sample JWT token - replace with actual token from user registration
const SAMPLE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGMzZTMwZmM3MjNiNTM5ODgyMzkxMWQiLCJ1c2VybmFtZSI6Impob2FzZG5iYW5lZ2Fkb24iLCJlbWFpbCI6ImpvaGFzZG5AZXhhbXBsZS5jb20iLCJpYXQiOjE3NTc2NjgxMTIsImV4cCI6MTc1ODI3MjkxMiwiYXVkIjoiZ2FtaWZpZWQtbGVhcm5pbmctdXNlcnMiLCJpc3MiOiJnYW1pZmllZC1sZWFybmluZy1wbGF0Zm9ybSJ9.6Xks9TScWcQTLFbKsUfU7kSuy2mIX-UXYmf-PYGVMNI';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SAMPLE_TOKEN}`
};

async function testAPI() {
  console.log('🧪 Testing Lesson Creator API...\n');

  try {
    // Test 1: Get lesson templates
    console.log('1. Testing GET /api/lessons/templates');
    const templatesResponse = await fetch(`${API_BASE}/lessons/templates?subject=mathematics&gradeLevel=middle`, {
      headers: { 'Authorization': `Bearer ${SAMPLE_TOKEN}` }
    });
    const templates = await templatesResponse.json();
    console.log('✅ Templates:', templates.success ? 'Success' : 'Failed');
    console.log('Available subjects:', templates.subjects?.slice(0, 3), '...\n');

    // Test 2: Create a new lesson without AI (basic structure)
    console.log('2. Testing POST /api/lessons (Basic Lesson)');
    const basicLessonData = {
      topic: 'Linear Equations',
      gradeLevel: '8',
      subject: 'mathematics',
      teachingObjectives: [
        'Students will understand linear equations',
        'Students will solve basic algebraic problems'
      ],
      useAI: false
    };

    const createBasicResponse = await fetch(`${API_BASE}/lessons`, {
      method: 'POST',
      headers,
      body: JSON.stringify(basicLessonData)
    });
    const basicLesson = await createBasicResponse.json();
    console.log('✅ Basic Lesson Creation:', basicLesson.success ? 'Success' : 'Failed');
    
    let lessonId = null;
    if (basicLesson.success) {
      lessonId = basicLesson.lessonId;
      console.log('Created lesson ID:', lessonId);
    }
    console.log('');

    // Test 3: Create a lesson with AI assistance
    console.log('3. Testing POST /api/lessons (AI-Generated Lesson)');
    const aiLessonData = {
      topic: 'Photosynthesis',
      gradeLevel: '7',
      subject: 'science',
      teachingObjectives: [
        'Understand the process of photosynthesis',
        'Identify factors affecting photosynthesis',
        'Explain the importance of photosynthesis in ecosystems'
      ],
      useAI: true
    };

    const createAIResponse = await fetch(`${API_BASE}/lessons`, {
      method: 'POST',
      headers,
      body: JSON.stringify(aiLessonData)
    });
    const aiLesson = await createAIResponse.json();
    console.log('✅ AI Lesson Creation:', aiLesson.success ? 'Success' : 'Failed');
    
    if (aiLesson.success) {
      console.log('AI-generated lesson title:', aiLesson.lesson?.title);
      if (!lessonId) lessonId = aiLesson.lessonId;
    } else {
      console.log('AI Error:', aiLesson.error);
    }
    console.log('');

    // Test 4: Get user lessons
    console.log('4. Testing GET /api/lessons');
    const lessonsResponse = await fetch(`${API_BASE}/lessons?limit=5`, {
      headers: { 'Authorization': `Bearer ${SAMPLE_TOKEN}` }
    });
    const lessons = await lessonsResponse.json();
    console.log('✅ Get Lessons:', lessons.success ? 'Success' : 'Failed');
    
    if (lessons.success) {
      console.log('Total lessons:', lessons.user?.totalLessons || 0);
      console.log('Lessons in response:', lessons.lessons?.length || 0);
      
      // Use first lesson ID if we don't have one
      if (!lessonId && lessons.lessons?.length > 0) {
        lessonId = lessons.lessons[0]._id;
      }
    }
    console.log('');

    // Test 5: Update a lesson (if we have one)
    if (lessonId) {
      console.log('5. Testing PUT /api/lessons');
      const updateData = {
        lessonId: lessonId,
        updateData: {
          title: 'Updated Lesson Title',
          duration: 60,
          tags: ['updated', 'test']
        }
      };

      const updateResponse = await fetch(`${API_BASE}/lessons`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData)
      });
      const updateResult = await updateResponse.json();
      console.log('✅ Update Lesson:', updateResult.success ? 'Success' : 'Failed');
      console.log('');
    }

    // Test 6: Export lesson (if we have one)
    if (lessonId) {
      console.log('6. Testing POST /api/lessons/export');
      const exportData = {
        lessonId: lessonId,
        format: 'json'
      };

      const exportResponse = await fetch(`${API_BASE}/lessons/export`, {
        method: 'POST',
        headers,
        body: JSON.stringify(exportData)
      });
      
      if (exportResponse.ok) {
        const contentType = exportResponse.headers.get('content-type');
        console.log('✅ Export Lesson: Success');
        console.log('Content-Type:', contentType);
        console.log('Content-Length:', exportResponse.headers.get('content-length'));
      } else {
        const exportError = await exportResponse.json();
        console.log('❌ Export Lesson: Failed -', exportError.error);
      }
      console.log('');
    }

    // Test 7: Generate custom template
    console.log('7. Testing POST /api/lessons/templates');
    const templateData = {
      subject: 'science',
      gradeLevel: '5',
      topic: 'Solar System',
      duration: 45,
      focusAreas: ['observation', 'research'],
      learningObjectives: ['Identify planets', 'Understand orbits']
    };

    const customTemplateResponse = await fetch(`${API_BASE}/lessons/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // No auth needed for templates
      body: JSON.stringify(templateData)
    });
    const customTemplate = await customTemplateResponse.json();
    console.log('✅ Custom Template:', customTemplate.success ? 'Success' : 'Failed');
    if (customTemplate.success) {
      console.log('Template title:', customTemplate.template?.title);
    }
    console.log('');

    // Test 8: Get specific lesson
    if (lessonId) {
      console.log('8. Testing GET /api/lessons?lessonId=...');
      const specificLessonResponse = await fetch(`${API_BASE}/lessons?lessonId=${lessonId}`, {
        headers: { 'Authorization': `Bearer ${SAMPLE_TOKEN}` }
      });
      const specificLesson = await specificLessonResponse.json();
      console.log('✅ Get Specific Lesson:', specificLesson.success ? 'Success' : 'Failed');
      console.log('');
    }

    console.log('🎉 API Testing Complete!');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

// Usage examples for frontend integration
function getFrontendExamples() {
  console.log('\n📋 Frontend Integration Examples:\n');

  console.log('// Create a lesson with AI assistance');
  console.log(`const createLesson = async (lessonData) => {
  try {
    const response = await fetch('/api/lessons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + userToken
      },
      body: JSON.stringify({
        topic: lessonData.topic,
        gradeLevel: lessonData.gradeLevel,
        subject: lessonData.subject,
        teachingObjectives: lessonData.objectives,
        useAI: true
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Lesson created:', result.lesson.title);
      return result.lesson;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Failed to create lesson:', error);
  }
};`);

  console.log('\n// Get user lessons with filtering');
  console.log(`const getUserLessons = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.subject) params.append('subject', filters.subject);
  if (filters.gradeLevel) params.append('gradeLevel', filters.gradeLevel);
  if (filters.topic) params.append('topic', filters.topic);
  
  const response = await fetch('/api/lessons?' + params.toString(), {
    headers: {
      'Authorization': 'Bearer ' + userToken
    }
  });
  
  return await response.json();
};`);

  console.log('\n// Export lesson as PDF');
  console.log(`const exportLesson = async (lessonId, format = 'pdf') => {
  const response = await fetch('/api/lessons/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + userToken
    },
    body: JSON.stringify({
      lessonId: lessonId,
      format: format
    })
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lesson.' + format;
    a.click();
  }
};`);
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI().then(() => {
    getFrontendExamples();
  });
}

module.exports = {
  testAPI,
  getFrontendExamples
};
