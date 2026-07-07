import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq, gt, count as drizzleCount, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    // Validate user ID
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'Valid user ID is required',
          code: 'INVALID_USER_ID' 
        },
        { status: 400 }
      );
    }

    // Get the user's data
    const userData = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json(
        { 
          error: 'User not found',
          code: 'USER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    const currentUser = userData[0];

    // If user has 0 credits, return rank as null
    if (currentUser.totalCredits === 0) {
      // Get total number of users
      const totalUsersResult = await db.select({ 
        count: drizzleCount() 
      }).from(user);
      
      const totalUsers = totalUsersResult[0].count;

      return NextResponse.json({
        userId: currentUser.id,
        rank: null,
        totalCredits: currentUser.totalCredits,
        name: currentUser.name,
        email: currentUser.email,
        totalUsers
      }, { status: 200 });
    }

    // Count users with MORE credits than this user
    const higherRankedUsers = await db.select({ 
      count: drizzleCount() 
    })
      .from(user)
      .where(gt(user.totalCredits, currentUser.totalCredits));

    // Calculate rank: number of users with higher credits + 1
    const rank = higherRankedUsers[0].count + 1;

    // Get total number of users
    const totalUsersResult = await db.select({ 
      count: drizzleCount() 
    }).from(user);
    
    const totalUsers = totalUsersResult[0].count;

    return NextResponse.json({
      userId: currentUser.id,
      rank,
      totalCredits: currentUser.totalCredits,
      name: currentUser.name,
      email: currentUser.email,
      totalUsers
    }, { status: 200 });

  } catch (error) {
    console.error('GET user rank error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error as Error).message 
      },
      { status: 500 }
    );
  }
}