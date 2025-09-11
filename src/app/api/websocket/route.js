import { NextResponse } from 'next/server';

// WebSocket endpoint info
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'WebSocket server is running',
    endpoints: {
      websocket: process.env.NODE_ENV === 'production' 
        ? 'wss://your-domain.com' 
        : 'ws://localhost:3001',
      events: [
        'question:request',
        'question:generated',
        'contest:join',
        'contest:answer',
        'contest:leaderboard',
        'contest:completed'
      ]
    },
    note: 'WebSocket server runs on a separate port for better performance'
  });
}

export async function POST(request) {
  const body = await request.json();
  
  return NextResponse.json({
    success: true,
    message: 'WebSocket configuration received',
    config: body
  });
}
