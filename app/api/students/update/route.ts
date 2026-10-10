import { NextRequest, NextResponse } from 'next/server';
import { updateStudentRow } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rowIndex, passGenerated, status, qrData, passUrl } = body;

    if (rowIndex === undefined || typeof rowIndex !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Valid rowIndex (number) is required.' },
        { status: 400 }
      );
    }

    const result = await updateStudentRow(rowIndex, {
      passGenerated,
      status,
      qrData,
      passUrl,
    });

    return NextResponse.json({
      success: true,
      isMock: result.isMock,
      message: result.message || 'Updated successfully',
    });
  } catch (error: any) {
    console.error('API /api/students/update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update student row' },
      { status: 500 }
    );
  }
}
