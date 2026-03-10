import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pressReleaseId = parseInt(params.id);

    if (isNaN(pressReleaseId)) {
      return NextResponse.json(
        { error: 'Invalid press release ID' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const comments = await pool.query(
      'SELECT id, press_release_id, content, author, created_at, updated_at FROM comments WHERE press_release_id = $1 ORDER BY created_at DESC',
      [pressReleaseId]
    );

    return NextResponse.json(comments.rows);
  } catch (error) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pressReleaseId = parseInt(params.id);

    if (isNaN(pressReleaseId)) {
      return NextResponse.json(
        { error: 'Invalid press release ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content, author } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const result = await pool.query(
      'INSERT INTO comments (press_release_id, content, author) VALUES ($1, $2, $3) RETURNING id, press_release_id, content, author, created_at, updated_at',
      [pressReleaseId, content, author || 'Anonymous']
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
