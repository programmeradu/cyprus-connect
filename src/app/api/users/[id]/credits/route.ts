import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';


export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id || id.trim() === '') {
      return NextResponse.json(
        {
          error: 'Valid user ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const userRecord = await db
      .select({
        userId: user.id,
        name: user.name,
        email: user.email,
        totalCredits: user.totalCredits,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);


    if (userRecord.length === 0) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // AI credit balance is stored on the user row (topped up by webhook + free-tier grants)
    const aiCreditsRemaining = userRecord[0].totalCredits ?? 0;


    return NextResponse.json({
      userId: userRecord[0].userId,
      aiCreditsRemaining,
      name: userRecord[0].name,
      email: userRecord[0].email,
    }, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}