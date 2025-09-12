import { NextResponse } from 'next/server';
import GeminiAPIManager from '@/lib/geminiManager';

// Initialize Gemini API Manager
const geminiManager = new GeminiAPIManager();

// Sample lesson data for testing
const sampleLessons = [
  {
    id: 'sample-1',
    topic: 'Photosynthesis',
    gradeLevel: 'middle',
    subject: 'science',
    duration: 45,
    difficulty: 'medium',
    teachingObjectives: [
      'Understand the process of photosynthesis',
      'Identify the components needed for photosynthesis',
      'Explain the importance of photosynthesis in ecosystems'
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-2',
    topic: 'Fractions',
    gradeLevel: 'elementary',
    subject: 'mathematics',
    duration: 30,
    difficulty: 'easy',
    teachingObjectives: [
      'Understand what fractions represent',
      'Compare simple fractions',
      'Add and subtract fractions with same denominators'
    ],
    createdAt: new Date().toISOString()
  }
];

// Helper function to generate lesson content using Gemini AI
async function generateLessonContent(topic, gradeLevel, teachingObjectives, subject) {
  const prompt = `
Create a comprehensive lesson plan with the following specifications:

Topic: ${topic}
Grade Level: ${gradeLevel}
Subject: ${subject}
Teaching Objectives: ${teachingObjectives.join(', ')}

Please provide a detailed lesson plan in JSON format with the following structure:
{
  "title": "lesson title",
  "duration": 45,
  "overview": "brief lesson overview",
  "activities": [
    {
      "type": "discussion|exercise|reading|video|project|quiz|practice",
      "title": "activity title",
      "description": "activity description",
      "duration": "duration in minutes",
      "content": "detailed activity content",
      "materials": ["material1", "material2"],
      "instructions": "step-by-step instructions"
    }
  ],
  "assessment": {
    "type": "test/project/presentation/essay/portfolio",
    "description": "assessment description",
    "criteria": ["criterion1", "criterion2"]
  },
  "resources": ["resource1", "resource2"],
  "differentiation": {
    "advanced": "suggestions for advanced learners",
    "struggling": "suggestions for struggling learners",
    "english_learners": "suggestions for English language learners"
  },
  "homework": "homework assignment",
  "standards": ["standard1", "standard2"],
  "vocabulary": ["term1", "term2"],
  "extensions": ["extension1", "extension2"]
}

Make sure the content is age-appropriate and pedagogically sound.`;

  try {
    const response = await geminiManager.generateContent(prompt);
    
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error generating lesson content:', error);
    return null;
  }
}

// GET /api/lessons/test - Fetch sample lessons (NO AUTH REQUIRED)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const topic = searchParams.get('topic');
    const gradeLevel = searchParams.get('gradeLevel');
    const subject = searchParams.get('subject');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit')) || 20;
    const page = parseInt(searchParams.get('page')) || 1;
    
    let filteredLessons = [...sampleLessons];
    
    // Apply filters
    if (topic) {
      filteredLessons = filteredLessons.filter(lesson => 
        lesson.topic.toLowerCase().includes(topic.toLowerCase())
      );
    }
    
    if (gradeLevel) {
      filteredLessons = filteredLessons.filter(lesson => 
        lesson.gradeLevel === gradeLevel
      );
    }
    
    if (subject) {
      filteredLessons = filteredLessons.filter(lesson => 
        lesson.subject === subject
      );
    }
    
    if (difficulty) {
      filteredLessons = filteredLessons.filter(lesson => 
        lesson.difficulty === difficulty
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLessons = filteredLessons.slice(startIndex, endIndex);
    
    return NextResponse.json({
      success: true,
      lessons: paginatedLessons,
      total: filteredLessons.length,
      page,
      limit,
      totalPages: Math.ceil(filteredLessons.length / limit)
    });
    
  } catch (error) {
    console.error('Error fetching test lessons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

// POST /api/lessons/test - Create a test lesson (NO AUTH REQUIRED)
export async function POST(request) {
  try {
    const body = await request.json();
    
    const {
      topic,
      gradeLevel,
      subject,
      teachingObjectives,
      useAI,
      customLessonData
    } = body;
    
    // Validate required fields
    if (!topic || !gradeLevel || !subject || !teachingObjectives) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: topic, gradeLevel, subject, teachingObjectives' },
        { status: 400 }
      );
    }
    
    let lessonData;
    
    if (useAI && !customLessonData) {
      // Generate lesson using AI
      console.log('Generating lesson with AI...');
      lessonData = await generateLessonContent(topic, gradeLevel, teachingObjectives, subject);
      
      if (!lessonData) {
        return NextResponse.json(
          { success: false, error: 'Failed to generate lesson content with AI' },
          { status: 500 }
        );
      }
    } else if (customLessonData) {
      // Use provided custom lesson data
      lessonData = customLessonData;
    } else {
      // Create a basic lesson structure
      lessonData = {
        title: `${topic} - ${gradeLevel} ${subject} lesson`,
        duration: 45,
        overview: `A lesson about ${topic} for ${gradeLevel} ${subject} students.`,
        activities: [
          {
            type: 'discussion',
            title: 'Introduction',
            description: 'Introduce the topic',
            duration: 10,
            content: `Introduce students to ${topic}`,
            materials: ['Whiteboard', 'Markers'],
            instructions: 'Begin with engaging questions about the topic'
          }
        ],
        assessment: {
          type: 'test',
          description: 'Quick assessment of understanding',
          criteria: ['Understanding', 'Application']
        },
        resources: [],
        differentiation: {
          advanced: 'Provide additional challenges',
          struggling: 'Offer extra support and scaffolding',
          english_learners: 'Use visual aids and simplified language'
        }
      };
    }
    
    // Create lesson object
    const newLesson = {
      id: `test-${Date.now()}`,
      topic,
      gradeLevel,
      subject,
      teachingObjectives,
      difficulty: body.difficulty || 'medium',
      lessonPlan: lessonData,
      createdAt: new Date().toISOString(),
      isTestLesson: true
    };
    
    return NextResponse.json({
      success: true,
      message: 'Test lesson created successfully',
      lesson: newLesson
    });
    
  } catch (error) {
    console.error('Error creating test lesson:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}
