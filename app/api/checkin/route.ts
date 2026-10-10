import { NextRequest, NextResponse } from 'next/server';
import { checkInStudentByQR } from '@/lib/googleSheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrData } = body;

    if (!qrData || typeof qrData !== 'string') {
      return NextResponse.json(
        { success: false, error: 'qrData (string) is required' },
        { status: 400 }
      );
    }

    const result = await checkInStudentByQR(qrData);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          studentName: result.studentName,
          usn: result.usn,
        },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      studentName: result.studentName,
      usn: result.usn,
    });
  } catch (error: any) {
    console.error('API /api/checkin error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Check-in processing error' },
      { status: 500 }
    );
  }
}
