import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contest from '@/lib/models/Contest';

// POST /api/contest/[id]/register - Register for contest
export async function POST(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const body = await request.json();
    const { userId, username, email } = body;
    
    if (!userId || !username || !email) {
      return NextResponse.json(
        { success: false, error: 'userId, username, and email are required' },
        { status: 400 }
      );
    }
    
    const contest = await Contest.findById(id);
    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }
    
    // Check if contest is public
    if (!contest.isPublic) {
      return NextResponse.json(
        { success: false, error: 'Contest is private' },
        { status: 403 }
      );
    }
    
    // Check if registration is still open
    const now = new Date();
    if (contest.registrationDeadline && now > contest.registrationDeadline) {
      return NextResponse.json(
        { success: false, error: 'Registration deadline has passed' },
        { status: 400 }
      );
    }
    
    if (now >= contest.startTime) {
      return NextResponse.json(
        { success: false, error: 'Contest has already started' },
        { status: 400 }
      );
    }
    
    // Check if user is already registered
    const existingParticipant = contest.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      return NextResponse.json(
        { success: false, error: 'User already registered for this contest' },
        { status: 400 }
      );
    }
    
    // Check if contest is full
    if (contest.participants.length >= contest.maxParticipants) {
      return NextResponse.json(
        { success: false, error: 'Contest is full' },
        { status: 400 }
      );
    }
    
    // Register user
    contest.participants.push({
      userId,
      username,
      email,
      joinedAt: new Date(),
      answers: [],
      score: 0,
      totalTimeSpent: 0,
      completed: false
    });
    
    await contest.save();
    
    return NextResponse.json({
      success: true,
      message: 'Successfully registered for contest',
      contest: {
        id: contest._id,
        title: contest.title,
        startTime: contest.startTime,
        endTime: contest.endTime,
        totalQuestions: contest.totalQuestions,
        participantsCount: contest.participants.length
      }
    });
    
  } catch (error) {
    console.error('Error registering for contest:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register for contest' },
      { status: 500 }
    );
  }
}

// DELETE /api/contest/[id]/register - Unregister from contest
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }
    
    const contest = await Contest.findById(id);
    if (!contest) {
      return NextResponse.json(
        { success: false, error: 'Contest not found' },
        { status: 404 }
      );
    }
    
    // Check if contest has started
    if (new Date() >= contest.startTime) {
      return NextResponse.json(
        { success: false, error: 'Cannot unregister after contest has started' },
        { status: 400 }
      );
    }
    
    // Find and remove participant
    const participantIndex = contest.participants.findIndex(p => p.userId === userId);
    if (participantIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'User not registered for this contest' },
        { status: 404 }
      );
    }
    
    contest.participants.splice(participantIndex, 1);
    await contest.save();
    
    return NextResponse.json({
      success: true,
      message: 'Successfully unregistered from contest'
    });
    
  } catch (error) {
    console.error('Error unregistering from contest:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unregister from contest' },
      { status: 500 }
    );
  }
}
