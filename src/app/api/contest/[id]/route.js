import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contest from '@/lib/models/Contest';

// GET /api/contest/[id] - Get specific contest details
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const includeQuestions = searchParams.get('includeQuestions') === 'true';
    const userId = searchParams.get('userId');
    
    let selectFields = '-participants.answers';
    if (!includeQuestions) {
      selectFields += ' -questions.questionId';
    }
    
    const contest = await Contest.findById(id)
      .select(selectFields)
      .populate(includeQuestions ? 'questions.questionId' : '');
    
    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }
    
    // If userId is provided, include user's participation status
    let userParticipation = null;
    if (userId) {
      const participant = contest.participants.find(p => p.userId === userId);
      if (participant) {
        userParticipation = {
          isRegistered: true,
          isCompleted: participant.completed,
          score: participant.score,
          rank: participant.rank,
          answersCount: participant.answers.length
        };
      } else {
        userParticipation = { isRegistered: false };
      }
    }
    
    const response = {
      success: true,
      contest: contest.toObject(),
      userParticipation
    };
    
    // Remove sensitive data if contest hasn't started yet
    const now = new Date();
    if (now < contest.startTime && !includeQuestions) {
      delete response.contest.questions;
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching contest:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contest' },
      { status: 500 }
    );
  }
}

// PUT /api/contest/[id] - Update contest (admin only)
export async function PUT(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const body = await request.json();
    
    const contest = await Contest.findById(id);
    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }
    
    // Only allow updates if contest hasn't started
    if (new Date() >= contest.startTime) {
      return NextResponse.json(
        { success: false, error: 'Cannot update contest that has already started' },
        { status: 400 }
      );
    }
    
    // Update allowed fields
    const allowedFields = ['title', 'description', 'startTime', 'duration', 'maxParticipants', 'isPublic'];
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        contest[field] = body[field];
      }
    });
    
    // Recalculate end time if start time or duration changed
    if (body.startTime || body.duration) {
      const start = new Date(contest.startTime);
      contest.endTime = new Date(start.getTime() + contest.duration * 60 * 1000);
    }
    
    await contest.save();
    
    return NextResponse.json({
      success: true,
      contest,
      message: 'Contest updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating contest:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update contest' },
      { status: 500 }
    );
  }
}

// DELETE /api/contest/[id] - Delete contest (admin only)
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    
    const contest = await Contest.findById(id);
    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }
    
    // Only allow deletion if contest hasn't started or has no participants
    if (new Date() >= contest.startTime && contest.participants.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete contest that has started with participants' },
        { status: 400 }
      );
    }
    
    await Contest.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Contest deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting contest:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete contest' },
      { status: 500 }
    );
  }
}
