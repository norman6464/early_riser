import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

type ErrorResponse = { code: string; message: string };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const pressReleaseId = parseInt(id, 10);

  if (!Number.isInteger(pressReleaseId) || pressReleaseId <= 0) {
    return NextResponse.json(
      { code: 'INVALID_ID', message: 'Invalid ID' } satisfies ErrorResponse,
      { status: 400 }
    );
  }

  let data: unknown;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json(
      { code: 'INVALID_JSON', message: 'Invalid JSON' } satisfies ErrorResponse,
      { status: 400 }
    );
  }

  const bodyField = (data as Record<string, unknown> | null)?.body;
  if (typeof bodyField !== 'string' || bodyField.length === 0) {
    return NextResponse.json(
      { code: 'MISSING_REQUIRED_FIELDS', message: 'Body is required' } satisfies ErrorResponse,
      { status: 400 }
    );
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      'INSERT INTO comments (press_release_id, body) VALUES ($1, $2) RETURNING id, press_release_id, body, created_at, updated_at',
      [pressReleaseId, bodyField]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error' } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}
