import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import GeminiAPIManager from '@/lib/geminiManager';

// Initialize Gemini API Manager
const geminiManager = new GeminiAPIManager();

// Helper function to verify JWT token
function verifyToken(token) {
  try {
    if (!token || !token.startsWith('Bearer ')) {
      throw new Error('Invalid token format');
    }
    
    const actualToken = token.substring(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Helper function to get user from token
async function getUserFromToken(request) {
  const token = request.headers.get('Authorization');
  const decoded = verifyToken(token);
  
  await connectDB();
  const user = await User.findById(decoded.userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
}

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
  "title": "Engaging lesson title",
  "duration": "estimated duration in minutes",
  "keyConcepts": [
    {
      "concept": "Key concept name",
      "explanation": "Detailed explanation",
      "examples": ["example1", "example2"]
    }
  ],
  "lessonOutline": {
    "introduction": "Hook and introduction content",
    "mainContent": "Main teaching content and methodology",
    "conclusion": "Summary and closing activities"
  },
  "activities": [
    {
      "type": "activity type (reading/exercise/video/discussion/project/quiz/practice)",
      "title": "Activity title",
      "description": "Activity description",
      "duration": "duration in minutes",
      "content": "Detailed activity content",
      "materials": ["material1", "material2"],
      "instructions": "Step-by-step instructions"
    }
  ],
  "homework": {
    "assignments": [
      {
        "title": "Assignment title",
        "description": "Assignment description",
        "dueDate": "suggested due date",
        "estimatedTime": "time in minutes"
      }
    ],
    "readingMaterials": [
      {
        "title": "Reading material title",
        "source": "Source/textbook",
        "pages": "page numbers"
      }
    ]
  },
  "resources": {
    "textbooks": [
      {
        "title": "Textbook title",
        "author": "Author name",
        "chapters": "relevant chapters"
      }
    ],
    "onlineResources": [
      {
        "title": "Resource title",
        "url": "example URL",
        "description": "Resource description"
      }
    ],
    "multimedia": [
      {
        "type": "video/audio/image/interactive",
        "title": "Media title",
        "url": "example URL",
        "description": "Media description"
      }
    ],
    "additionalMaterials": ["material1", "material2"]
  },
  "assessment": {
    "formativeAssessment": [
      {
        "type": "quiz/discussion/observation/exit_ticket/peer_review",
        "description": "Assessment description",
        "criteria": ["criteria1", "criteria2"]
      }
    ],
    "summativeAssessment": [
      {
        "type": "test/project/presentation/essay/portfolio",
        "description": "Assessment description",
        "rubric": [
          {
            "criteria": "Assessment criteria",
            "levels": [
              {
                "level": "Excellent/Good/Needs Improvement",
                "description": "Level description",
                "points": "point value"
              }
            ]
          }
        ]
      }
    ]
  },
  "differentiation": {
    "forAdvancedLearners": ["strategy1", "strategy2"],
    "forStruggling": ["strategy1", "strategy2"],
    "forELL": ["strategy1", "strategy2"],
    "forSpecialNeeds": ["strategy1", "strategy2"]
  },
  "standards": [
    {
      "standardType": "Common Core/Next Generation Science Standards/etc",
      "standardCode": "standard code",
      "description": "standard description"
    }
  ],
  "tags": ["tag1", "tag2", "tag3"]
}

Make sure the lesson plan is age-appropriate for ${gradeLevel} and aligns with the teaching objectives. Include interactive and engaging activities that cater to different learning styles.
`;

  try {
    const response = await geminiManager.generateContent(prompt);
    
    // Extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Could not parse AI response');
    }
  } catch (error) {
    console.error('Error generating lesson content:', error);
    throw new Error('Failed to generate lesson content');
  }
}

// GET /api/lessons - Fetch user's lessons
export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const topic = searchParams.get('topic');
    const gradeLevel = searchParams.get('gradeLevel');
    const subject = searchParams.get('subject');
    const difficulty = searchParams.get('difficulty');
    const tags = searchParams.get('tags')?.split(',') || [];
    const limit = parseInt(searchParams.get('limit')) || 20;
    const page = parseInt(searchParams.get('page')) || 1;
    const lessonId = searchParams.get('lessonId');
    
    // If specific lesson requested
    if (lessonId) {
      const lesson = user.lessons.id(lessonId);
      if (!lesson) {
        return NextResponse.json(
          { success: false, error: 'Lesson not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        lesson
      });
    }
    
    // Build criteria for filtering
    const criteria = {};
    if (topic) criteria.topic = topic;
    if (gradeLevel) criteria.gradeLevel = gradeLevel;
    if (subject) criteria.subject = subject;
    if (difficulty) criteria.difficulty = difficulty;
    if (tags.length > 0) criteria.tags = tags;
    
    // Get filtered lessons
    const allLessons = user.getLessons(criteria);
    
    // Implement pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const lessons = allLessons.slice(startIndex, endIndex);
    
    return NextResponse.json({
      success: true,
      lessons,
      pagination: {
        page,
        limit,
        total: allLessons.length,
        pages: Math.ceil(allLessons.length / limit)
      },
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        totalLessons: user.lessons.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}

// POST /api/lessons - Create a new lesson
export async function POST(request) {
  try {
    const user = await getUserFromToken(request);
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
      try {
        const aiGeneratedContent = await generateLessonContent(topic, gradeLevel, teachingObjectives, subject);
        
        lessonData = {
          topic,
          gradeLevel,
          subject,
          teachingObjectives,
          ...aiGeneratedContent,
          difficulty: aiGeneratedContent.difficulty || 'intermediate',
          isPublic: false
        };
      } catch (aiError) {
        console.error('AI generation failed:', aiError);
        return NextResponse.json(
          { success: false, error: 'Failed to generate lesson with AI. Please try again or provide custom lesson data.' },
          { status: 500 }
        );
      }
    } else if (customLessonData) {
      // Use provided custom lesson data
      lessonData = {
        topic,
        gradeLevel,
        subject,
        teachingObjectives,
        ...customLessonData
      };
    } else {
      // Create basic lesson structure
      lessonData = {
        topic,
        gradeLevel,
        subject,
        teachingObjectives,
        title: `${topic} - ${gradeLevel}`,
        duration: 45,
        keyConcepts: [],
        lessonOutline: {
          introduction: '',
          mainContent: '',
          conclusion: ''
        },
        activities: [],
        homework: {
          assignments: [],
          readingMaterials: []
        },
        resources: {
          textbooks: [],
          onlineResources: [],
          multimedia: [],
          additionalMaterials: []
        },
        assessment: {
          formativeAssessment: [],
          summativeAssessment: []
        },
        differentiation: {
          forAdvancedLearners: [],
          forStruggling: [],
          forELL: [],
          forSpecialNeeds: []
        },
        standards: [],
        tags: [topic, subject, gradeLevel],
        difficulty: 'intermediate',
        isPublic: false
      };
    }
    
    // Add lesson to user
    const newLesson = user.addLesson(lessonData);
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: 'Lesson created successfully',
      lesson: newLesson,
      lessonId: newLesson._id
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}

// PUT /api/lessons - Update an existing lesson
export async function PUT(request) {
  try {
    const user = await getUserFromToken(request);
    const body = await request.json();
    
    const { lessonId, updateData } = body;
    
    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: 'Lesson ID is required' },
        { status: 400 }
      );
    }
    
    // Update lesson
    const updatedLesson = user.updateLesson(lessonId, updateData);
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: 'Lesson updated successfully',
      lesson: updatedLesson
    });
    
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('not found') ? 404 : (error.message.includes('token') ? 401 : 500) }
    );
  }
}

// DELETE /api/lessons - Delete a lesson
export async function DELETE(request) {
  try {
    const user = await getUserFromToken(request);
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    
    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: 'Lesson ID is required' },
        { status: 400 }
      );
    }
    
    // Delete lesson
    user.deleteLesson(lessonId);
    await user.save();
    
    return NextResponse.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('not found') ? 404 : (error.message.includes('token') ? 401 : 500) }
    );
  }
}
