import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Question from '@/lib/models/Question';
import { getGeminiManager } from '@/lib/geminiManager';

// GET /api/questions - Fetch questions with filters
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const examType = searchParams.get('examType');
    const subject = searchParams.get('subject');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit')) || 10;
    const page = parseInt(searchParams.get('page')) || 1;
    const random = searchParams.get('random') === 'true';
    
    let query = {};
    if (examType) query.examType = examType;
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    
    let questions;
    
    if (random) {
      // Get random questions
      questions = await Question.aggregate([
        { $match: query },
        { $sample: { size: limit } }
      ]);
    } else {
      // Get paginated questions
      const skip = (page - 1) * limit;
      questions = await Question.find(query)
        .sort({ usageCount: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }
    
    // Update usage count for retrieved questions
    if (questions.length > 0) {
      const questionIds = questions.map(q => q._id);
      await Question.updateMany(
        { _id: { $in: questionIds } },
        { 
          $inc: { usageCount: 1 },
          $set: { lastUsed: new Date() }
        }
      );
    }
    
    const total = await Question.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

// POST /api/questions - Generate new question using Gemini AI
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { examType, subject, difficulty = 'medium', questionType = 'multiple-choice', count = 1 } = body;
    
    if (!examType || !subject) {
      return NextResponse.json(
        { success: false, error: 'examType and subject are required' },
        { status: 400 }
      );
    }
    
    const geminiManager = getGeminiManager();
    const generatedQuestions = [];
    
    for (let i = 0; i < count; i++) {
      try {
        // Generate question using Gemini AI
        const questionData = await geminiManager.generateQuestion(
          examType,
          subject,
          difficulty,
          questionType
        );
        
        // Create and save question to database
        const question = new Question({
          ...questionData,
          geminiKeyIndex: geminiManager.currentKeyIndex,
          aiGenerated: true,
          verified: false, // Will need manual verification
          tags: [examType, subject, difficulty]
        });
        
        await question.save();
        generatedQuestions.push(question);
        
      } catch (error) {
        console.error(`Error generating question ${i + 1}:`, error);
        
        // Handle specific Gemini API errors
        if (error.code === 'GEMINI_RATE_LIMIT') {
          return NextResponse.json(
            { 
              success: false, 
              error: 'Rate limit reached. Please try again later.',
              retryAfter: error.retryAfter || 60,
              generated: generatedQuestions
            },
            { status: 429 }
          );
        }
        
        // Continue with other questions if one fails
        continue;
      }
    }
    
    if (generatedQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate any questions' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      questions: generatedQuestions,
      generated: generatedQuestions.length,
      requested: count,
      geminiStats: geminiManager.getUsageStats()
    });
    
  } catch (error) {
    console.error('Error generating questions:', error);
    
    if (error.message.includes('No Gemini API keys found')) {
      return NextResponse.json(
        { success: false, error: 'Gemini API not configured. Please add API keys.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}

// PUT /api/questions/[id] - Update question (verify, report issues, etc.)
export async function PUT(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');
    
    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required' },
        { status: 400 }
      );
    }
    
    const question = await Question.findById(questionId);
    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }
    
    // Handle different types of updates
    if (body.action === 'verify') {
      question.verified = true;
    } else if (body.action === 'report') {
      const { type, description, reportedBy } = body;
      question.reportedIssues.push({
        type,
        description,
        reportedBy,
        reportedAt: new Date()
      });
    } else {
      // General update
      Object.keys(body).forEach(key => {
        if (key !== 'action' && question.schema.paths[key]) {
          question[key] = body[key];
        }
      });
    }
    
    await question.save();
    
    return NextResponse.json({
      success: true,
      question
    });
    
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[id] - Delete question
export async function DELETE(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');
    
    if (!questionId) {
      return NextResponse.json(
        { success: false, error: 'Question ID is required' },
        { status: 400 }
      );
    }
    
    const question = await Question.findByIdAndDelete(questionId);
    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
