import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contest from '@/lib/models/Contest';
import Question from '@/lib/models/Question';

// GET /api/contest - Fetch contests
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const examType = searchParams.get('examType');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit')) || 10;
    const page = parseInt(searchParams.get('page')) || 1;
    
    let query = {};
    if (examType) query.examType = examType;
    if (status) query.status = status;
    
    const skip = (page - 1) * limit;
    
    const contests = await Contest.find(query)
      .select('-participants.answers') // Exclude detailed answers for performance
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .populate('questions.questionId', 'question subject difficulty');
    
    const total = await Contest.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      contests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching contests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contests' },
      { status: 500 }
    );
  }
}

// POST /api/contest - Create new contest
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      title,
      description,
      examType,
      subjects,
      difficulty,
      startTime,
      duration, // in minutes
      questionsPerSubject = 10,
      createdBy = 'system',
      maxParticipants = 1000,
      isPublic = true
    } = body;
    
    if (!title || !examType || !subjects || !startTime || !duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Calculate end time
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60 * 1000);
    
    // Fetch questions for the contest
    const contestQuestions = [];
    let questionOrder = 1;
    
    for (const subject of subjects) {
      let subjectQuestions;
      
      if (difficulty === 'mixed') {
        // Get equal distribution of easy, medium, hard questions
        const questionsPerDifficulty = Math.ceil(questionsPerSubject / 3);
        
        const easyQuestions = await Question.getRandomQuestions(
          examType, subject, 'easy', questionsPerDifficulty
        );
        const mediumQuestions = await Question.getRandomQuestions(
          examType, subject, 'medium', questionsPerDifficulty
        );
        const hardQuestions = await Question.getRandomQuestions(
          examType, subject, 'hard', questionsPerDifficulty
        );
        
        subjectQuestions = [...easyQuestions, ...mediumQuestions, ...hardQuestions]
          .slice(0, questionsPerSubject);
      } else {
        subjectQuestions = await Question.getRandomQuestions(
          examType, subject, difficulty, questionsPerSubject
        );
      }
      
      // Add questions to contest with metadata
      subjectQuestions.forEach(question => {
        contestQuestions.push({
          questionId: question._id,
          order: questionOrder++,
          points: difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1,
          timeLimit: 120 // 2 minutes per question
        });
      });
    }
    
    if (contestQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No questions found for the specified criteria' },
        { status: 400 }
      );
    }
    
    // Create contest
    const contest = new Contest({
      title,
      description,
      examType,
      subjects,
      difficulty,
      questions: contestQuestions,
      startTime: start,
      endTime: end,
      duration,
      maxParticipants,
      isPublic,
      createdBy,
      totalQuestions: contestQuestions.length,
      registrationDeadline: new Date(start.getTime() - 10 * 60 * 1000) // 10 minutes before start
    });
    
    await contest.save();
    
    return NextResponse.json({
      success: true,
      contest: {
        ...contest.toObject(),
        questions: contest.questions.map(q => ({
          order: q.order,
          points: q.points,
          timeLimit: q.timeLimit
        })) // Don't expose question IDs in response
      },
      message: 'Contest created successfully'
    });
    
  } catch (error) {
    console.error('Error creating contest:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create contest' },
      { status: 500 }
    );
  }
}
