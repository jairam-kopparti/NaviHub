import { NextResponse } from 'next/server';
import { sendEventConfirmationEmail, sendEventCancellationEmail } from '../../lib/email'; 

export async function POST(request: Request) {
  try {
    const { userEmail, userName, eventName, type = 'confirmation' } = await request.json();

    if (!userEmail || !userName || !eventName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let success;
    if (type === 'cancellation') {
      const result = await sendEventCancellationEmail(userEmail, userName, eventName);
      success = result.success;
    } else {
      const result = await sendEventConfirmationEmail(userEmail, userName, eventName);
      success = result.success;
    }

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in send-event-email route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
