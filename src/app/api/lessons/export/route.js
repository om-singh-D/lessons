import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

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

// Generate PDF content (text representation for now)
function generatePDFContent(lesson) {
  let content = '';
  
  content += `LESSON PLAN: ${lesson.title}\n`;
  content += `${'='.repeat(50)}\n\n`;
  
  content += `Topic: ${lesson.topic}\n`;
  content += `Grade Level: ${lesson.gradeLevel}\n`;
  content += `Subject: ${lesson.subject}\n`;
  content += `Duration: ${lesson.duration} minutes\n`;
  content += `Difficulty: ${lesson.difficulty}\n\n`;
  
  content += `TEACHING OBJECTIVES:\n`;
  lesson.teachingObjectives.forEach((obj, index) => {
    content += `${index + 1}. ${obj}\n`;
  });
  content += '\n';
  
  if (lesson.keyConcepts && lesson.keyConcepts.length > 0) {
    content += `KEY CONCEPTS:\n`;
    lesson.keyConcepts.forEach((concept, index) => {
      content += `${index + 1}. ${concept.concept}\n`;
      content += `   ${concept.explanation}\n`;
      if (concept.examples && concept.examples.length > 0) {
        content += `   Examples: ${concept.examples.join(', ')}\n`;
      }
      content += '\n';
    });
  }
  
  content += `LESSON OUTLINE:\n`;
  content += `Introduction: ${lesson.lessonOutline.introduction}\n\n`;
  content += `Main Content: ${lesson.lessonOutline.mainContent}\n\n`;
  content += `Conclusion: ${lesson.lessonOutline.conclusion}\n\n`;
  
  if (lesson.activities && lesson.activities.length > 0) {
    content += `ACTIVITIES:\n`;
    lesson.activities.forEach((activity, index) => {
      content += `${index + 1}. ${activity.title} (${activity.type}) - ${activity.duration} min\n`;
      content += `   ${activity.description}\n`;
      content += `   Content: ${activity.content}\n`;
      if (activity.materials && activity.materials.length > 0) {
        content += `   Materials: ${activity.materials.join(', ')}\n`;
      }
      if (activity.instructions) {
        content += `   Instructions: ${activity.instructions}\n`;
      }
      content += '\n';
    });
  }
  
  if (lesson.homework && (lesson.homework.assignments.length > 0 || lesson.homework.readingMaterials.length > 0)) {
    content += `HOMEWORK:\n`;
    if (lesson.homework.assignments.length > 0) {
      content += `Assignments:\n`;
      lesson.homework.assignments.forEach((assignment, index) => {
        content += `${index + 1}. ${assignment.title}\n`;
        content += `   ${assignment.description}\n`;
        if (assignment.dueDate) content += `   Due: ${assignment.dueDate}\n`;
        if (assignment.estimatedTime) content += `   Estimated Time: ${assignment.estimatedTime} minutes\n`;
        content += '\n';
      });
    }
    
    if (lesson.homework.readingMaterials.length > 0) {
      content += `Reading Materials:\n`;
      lesson.homework.readingMaterials.forEach((material, index) => {
        content += `${index + 1}. ${material.title}`;
        if (material.source) content += ` (${material.source})`;
        if (material.pages) content += ` - Pages: ${material.pages}`;
        content += '\n';
      });
      content += '\n';
    }
  }
  
  if (lesson.resources) {
    content += `RESOURCES:\n`;
    
    if (lesson.resources.textbooks && lesson.resources.textbooks.length > 0) {
      content += `Textbooks:\n`;
      lesson.resources.textbooks.forEach((book, index) => {
        content += `${index + 1}. ${book.title}`;
        if (book.author) content += ` by ${book.author}`;
        if (book.chapters) content += ` - Chapters: ${book.chapters}`;
        content += '\n';
      });
      content += '\n';
    }
    
    if (lesson.resources.onlineResources && lesson.resources.onlineResources.length > 0) {
      content += `Online Resources:\n`;
      lesson.resources.onlineResources.forEach((resource, index) => {
        content += `${index + 1}. ${resource.title}\n`;
        if (resource.url) content += `   URL: ${resource.url}\n`;
        if (resource.description) content += `   ${resource.description}\n`;
        content += '\n';
      });
    }
  }
  
  if (lesson.assessment) {
    content += `ASSESSMENT:\n`;
    
    if (lesson.assessment.formativeAssessment && lesson.assessment.formativeAssessment.length > 0) {
      content += `Formative Assessment:\n`;
      lesson.assessment.formativeAssessment.forEach((assessment, index) => {
        content += `${index + 1}. ${assessment.type}: ${assessment.description}\n`;
        if (assessment.criteria && assessment.criteria.length > 0) {
          content += `   Criteria: ${assessment.criteria.join(', ')}\n`;
        }
        content += '\n';
      });
    }
    
    if (lesson.assessment.summativeAssessment && lesson.assessment.summativeAssessment.length > 0) {
      content += `Summative Assessment:\n`;
      lesson.assessment.summativeAssessment.forEach((assessment, index) => {
        content += `${index + 1}. ${assessment.type}: ${assessment.description}\n`;
        content += '\n';
      });
    }
  }
  
  if (lesson.differentiation) {
    content += `DIFFERENTIATION:\n`;
    if (lesson.differentiation.forAdvancedLearners && lesson.differentiation.forAdvancedLearners.length > 0) {
      content += `For Advanced Learners: ${lesson.differentiation.forAdvancedLearners.join(', ')}\n`;
    }
    if (lesson.differentiation.forStruggling && lesson.differentiation.forStruggling.length > 0) {
      content += `For Struggling Students: ${lesson.differentiation.forStruggling.join(', ')}\n`;
    }
    if (lesson.differentiation.forELL && lesson.differentiation.forELL.length > 0) {
      content += `For English Language Learners: ${lesson.differentiation.forELL.join(', ')}\n`;
    }
    if (lesson.differentiation.forSpecialNeeds && lesson.differentiation.forSpecialNeeds.length > 0) {
      content += `For Special Needs: ${lesson.differentiation.forSpecialNeeds.join(', ')}\n`;
    }
    content += '\n';
  }
  
  if (lesson.standards && lesson.standards.length > 0) {
    content += `STANDARDS:\n`;
    lesson.standards.forEach((standard, index) => {
      content += `${index + 1}. ${standard.standardType}: ${standard.standardCode}\n`;
      if (standard.description) content += `   ${standard.description}\n`;
      content += '\n';
    });
  }
  
  if (lesson.tags && lesson.tags.length > 0) {
    content += `TAGS: ${lesson.tags.join(', ')}\n\n`;
  }
  
  content += `Created: ${new Date(lesson.createdAt).toLocaleDateString()}\n`;
  content += `Last Updated: ${new Date(lesson.updatedAt).toLocaleDateString()}\n`;
  content += `Version: ${lesson.version}\n`;
  
  return content;
}

// Generate Google Docs compatible content
function generateGoogleDocsContent(lesson) {
  // For now, we'll return the same text content
  // In a real implementation, you might use Google Docs API
  return generatePDFContent(lesson);
}

// Generate LMS-compatible format (SCORM-like structure)
function generateLMSContent(lesson) {
  const lmsStructure = {
    metadata: {
      title: lesson.title,
      description: `${lesson.topic} lesson for ${lesson.gradeLevel}`,
      keywords: lesson.tags || [],
      duration: lesson.duration,
      difficulty: lesson.difficulty,
      subject: lesson.subject,
      gradeLevel: lesson.gradeLevel
    },
    objectives: lesson.teachingObjectives,
    content: {
      introduction: lesson.lessonOutline.introduction,
      mainContent: lesson.lessonOutline.mainContent,
      conclusion: lesson.lessonOutline.conclusion
    },
    activities: lesson.activities || [],
    assessment: lesson.assessment || {},
    resources: lesson.resources || {},
    differentiation: lesson.differentiation || {}
  };
  
  return JSON.stringify(lmsStructure, null, 2);
}

// POST /api/lessons/export - Export lesson in different formats
export async function POST(request) {
  try {
    const user = await getUserFromToken(request);
    const body = await request.json();
    
    const { lessonId, format } = body;
    
    if (!lessonId) {
      return NextResponse.json(
        { success: false, error: 'Lesson ID is required' },
        { status: 400 }
      );
    }
    
    if (!format || !['pdf', 'google-docs', 'lms', 'json'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Supported formats: pdf, google-docs, lms, json' },
        { status: 400 }
      );
    }
    
    // Find the lesson
    const lesson = user.lessons.id(lessonId);
    if (!lesson) {
      return NextResponse.json(
        { success: false, error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    let content;
    let mimeType;
    let filename;
    
    switch (format) {
      case 'pdf':
        content = generatePDFContent(lesson);
        mimeType = 'text/plain'; // In a real app, you'd generate actual PDF
        filename = `${lesson.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        break;
        
      case 'google-docs':
        content = generateGoogleDocsContent(lesson);
        mimeType = 'text/plain';
        filename = `${lesson.title.replace(/[^a-zA-Z0-9]/g, '_')}_google_docs.txt`;
        break;
        
      case 'lms':
        content = generateLMSContent(lesson);
        mimeType = 'application/json';
        filename = `${lesson.title.replace(/[^a-zA-Z0-9]/g, '_')}_lms.json`;
        break;
        
      case 'json':
        content = JSON.stringify(lesson, null, 2);
        mimeType = 'application/json';
        filename = `${lesson.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported format' },
          { status: 400 }
        );
    }
    
    // Return the content with appropriate headers for download
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(content).toString()
      }
    });
    
  } catch (error) {
    console.error('Error exporting lesson:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}
