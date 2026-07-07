import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { emissionsHistory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

const VALID_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const limit = searchParams.get('limit');

    // Single record by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(emissionsHistory)
        .where(eq(emissionsHistory.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'Record not found',
          code: "NOT_FOUND" 
        }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with optional limit
    let query = db.select()
      .from(emissionsHistory)
      .orderBy(desc(emissionsHistory.createdAt));

    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum) as any;
      }
    }

    const results = await query;
    return NextResponse.json(results, { status: 200 });

  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, value, emissions } = body;

    // Validate required fields
    if (!month) {
      return NextResponse.json({ 
        error: "Month is required",
        code: "MISSING_MONTH" 
      }, { status: 400 });
    }

    if (value === undefined || value === null) {
      return NextResponse.json({ 
        error: "Value is required",
        code: "MISSING_VALUE" 
      }, { status: 400 });
    }

    if (emissions === undefined || emissions === null) {
      return NextResponse.json({ 
        error: "Emissions is required",
        code: "MISSING_EMISSIONS" 
      }, { status: 400 });
    }

    // Validate month format
    if (!VALID_MONTHS.includes(month)) {
      return NextResponse.json({ 
        error: "Month must be a 3-letter abbreviation (Jan, Feb, Mar, etc.)",
        code: "INVALID_MONTH_FORMAT" 
      }, { status: 400 });
    }

    // Validate value is a positive number
    const valueNum = parseFloat(value);
    if (isNaN(valueNum) || valueNum <= 0) {
      return NextResponse.json({ 
        error: "Value must be a positive number",
        code: "INVALID_VALUE" 
      }, { status: 400 });
    }

    // Validate emissions is a positive number
    const emissionsNum = parseFloat(emissions);
    if (isNaN(emissionsNum) || emissionsNum <= 0) {
      return NextResponse.json({ 
        error: "Emissions must be a positive number",
        code: "INVALID_EMISSIONS" 
      }, { status: 400 });
    }

    // Create record with auto-generated timestamp
    const newRecord = await db.insert(emissionsHistory)
      .values({
        month,
        value: valueNum,
        emissions: emissionsNum,
        createdAt: new Date()
      })
      .returning();

    return NextResponse.json(newRecord[0], { status: 201 });

  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID is provided
    if (!id) {
      return NextResponse.json({ 
        error: "ID is required",
        code: "MISSING_ID" 
      }, { status: 400 });
    }

    // Validate ID is valid integer
    if (isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(emissionsHistory)
      .where(eq(emissionsHistory.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Record not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    const body = await request.json();
    const updates: any = {};

    // Validate and prepare month if provided
    if (body.month !== undefined) {
      if (!VALID_MONTHS.includes(body.month)) {
        return NextResponse.json({ 
          error: "Month must be a 3-letter abbreviation (Jan, Feb, Mar, etc.)",
          code: "INVALID_MONTH_FORMAT" 
        }, { status: 400 });
      }
      updates.month = body.month;
    }

    // Validate and prepare value if provided
    if (body.value !== undefined) {
      const valueNum = parseFloat(body.value);
      if (isNaN(valueNum) || valueNum <= 0) {
        return NextResponse.json({ 
          error: "Value must be a positive number",
          code: "INVALID_VALUE" 
        }, { status: 400 });
      }
      updates.value = valueNum;
    }

    // Validate and prepare emissions if provided
    if (body.emissions !== undefined) {
      const emissionsNum = parseFloat(body.emissions);
      if (isNaN(emissionsNum) || emissionsNum <= 0) {
        return NextResponse.json({ 
          error: "Emissions must be a positive number",
          code: "INVALID_EMISSIONS" 
        }, { status: 400 });
      }
      updates.emissions = emissionsNum;
    }

    // If no valid updates provided, return error
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ 
        error: "No valid fields to update",
        code: "NO_UPDATES" 
      }, { status: 400 });
    }

    // Perform update
    const updated = await db.update(emissionsHistory)
      .set(updates)
      .where(eq(emissionsHistory.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Validate ID is provided
    if (!id) {
      return NextResponse.json({ 
        error: "ID is required",
        code: "MISSING_ID" 
      }, { status: 400 });
    }

    // Validate ID is valid integer
    if (isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists before deleting
    const existing = await db.select()
      .from(emissionsHistory)
      .where(eq(emissionsHistory.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'Record not found',
        code: "NOT_FOUND" 
      }, { status: 404 });
    }

    // Perform deletion
    const deleted = await db.delete(emissionsHistory)
      .where(eq(emissionsHistory.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'Record deleted successfully',
      record: deleted[0]
    }, { status: 200 });

  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}