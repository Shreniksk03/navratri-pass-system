import { NextResponse } from 'next/server';
import { getStudents } from '@/lib/googleSheets';

export async function GET() {
  try {
    const result = await getStudents();
    return NextResponse.json(
      {
        success: true,
        students: result.students,
        isMock: result.isMock,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('API /api/students error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
