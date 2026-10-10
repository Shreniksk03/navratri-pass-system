import { google } from 'googleapis';

export interface StudentRow {
  rowIndex: number; // 2-indexed in Google Sheets (Row 1 is headers)
  timestamp: string;
  name: string;
  usn: string;
  year: string;
  hosteller: string;
  block: string;
  whatsappNumber: string;
  qrData: string;
  passUrl: string;
  passGenerated: string;
  status: string; // Column J (Pass_Status)
  checkedIn: string; // Column K (Checked_In: "Yes" or "")
}

let mockStudentsStore: StudentRow[] = [
  {
    rowIndex: 2,
    timestamp: '2026-10-10 10:15:00',
    name: 'Aarav Sharma',
    usn: '1RV21CS001',
    year: '3rd Year',
    hosteller: 'Yes',
    block: 'Block A',
    whatsappNumber: '9876543210',
    qrData: 'niat-navratri-26-1RV21CS001',
    passUrl: '/api/pass?name=Aarav%20Sharma&usn=1RV21CS001&year=3rd%20Year',
    passGenerated: 'Yes',
    status: 'Sent',
    checkedIn: '',
  },
  {
    rowIndex: 3,
    timestamp: '2026-10-10 10:18:22',
    name: 'Ananya Patel',
    usn: '1RV21CS045',
    year: '2nd Year',
    hosteller: 'No',
    block: 'Day Scholar',
    whatsappNumber: '9123456789',
    qrData: 'niat-navratri-26-1RV21CS045',
    passUrl: '/api/pass?name=Ananya%20Patel&usn=1RV21CS045&year=2nd%20Year',
    passGenerated: 'Yes',
    status: 'Sent',
    checkedIn: 'Yes',
  },
  {
    rowIndex: 4,
    timestamp: '2026-10-10 10:25:11',
    name: 'Rohan Verma',
    usn: '1RV21EC089',
    year: '4th Year',
    hosteller: 'Yes',
    block: 'Block C',
    whatsappNumber: '9988776655',
    qrData: 'niat-navratri-26-1RV21EC089',
    passUrl: '/api/pass?name=Rohan%20Verma&usn=1RV21EC089&year=4th%20Year',
    passGenerated: 'Yes',
    status: 'Sent',
    checkedIn: '',
  },
  {
    rowIndex: 5,
    timestamp: '2026-10-10 11:02:40',
    name: 'Diya Kulkarni',
    usn: '1RV21IS022',
    year: '1st Year',
    hosteller: 'Yes',
    block: 'Block B',
    whatsappNumber: '9765432109',
    qrData: '',
    passUrl: '',
    passGenerated: 'No',
    status: 'Pending',
    checkedIn: '',
  },
];

function isGoogleSheetsConfigured(): boolean {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  const sheetId = process.env.GOOGLE_SHEET_ID;

  return !!(
    email &&
    key &&
    sheetId &&
    !email.includes('your-service-account') &&
    !sheetId.includes('your_google_sheet_id')
  );
}

function getGoogleSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function getStudents(): Promise<{ students: StudentRow[]; isMock: boolean }> {
  if (!isGoogleSheetsConfigured()) {
    return { students: mockStudentsStore, isMock: true };
  }

  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A2:K',
    });

    const rows = response.data.values || [];

    const students: StudentRow[] = rows.map((row, index) => {
      const qrData = row[7] || '';
      const passUrl = row[8] || '';
      const passStatus = row[9] || 'Pending';
      const checkedIn = row[10] || '';
      const hasPass = qrData || passUrl || passStatus.toLowerCase() === 'sent';

      return {
        rowIndex: index + 2,
        timestamp: row[0] || '',
        name: row[1] || '',
        usn: row[2] || '',
        year: row[3] || '',
        hosteller: row[4] || '',
        block: row[5] || '',
        whatsappNumber: row[6] || '',
        qrData,
        passUrl,
        passGenerated: hasPass ? 'Yes' : 'No',
        status: passStatus,
        checkedIn,
      };
    });

    return { students, isMock: false };
  } catch (error) {
    console.error('Error fetching data from Google Sheets API:', error);
    return { students: mockStudentsStore, isMock: true };
  }
}

export async function updateStudentRow(
  rowIndex: number,
  updates: {
    passGenerated?: string;
    status?: string;
    qrData?: string;
    passUrl?: string;
    checkedIn?: string;
  }
): Promise<{ success: boolean; isMock: boolean; message?: string }> {
  if (!isGoogleSheetsConfigured()) {
    mockStudentsStore = mockStudentsStore.map((student) => {
      if (student.rowIndex === rowIndex) {
        return {
          ...student,
          ...(updates.passGenerated !== undefined && { passGenerated: updates.passGenerated }),
          ...(updates.status !== undefined && { status: updates.status }),
          ...(updates.qrData !== undefined && { qrData: updates.qrData }),
          ...(updates.passUrl !== undefined && { passUrl: updates.passUrl }),
          ...(updates.checkedIn !== undefined && { checkedIn: updates.checkedIn }),
        };
      }
      return student;
    });

    return {
      success: true,
      isMock: true,
      message: 'Updated mock store locally.',
    };
  }

  try {
    const sheets = getGoogleSheetsClient();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (updates.qrData !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `H${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[updates.qrData]] },
      });
    }

    if (updates.passUrl !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `I${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[updates.passUrl]] },
      });
    }

    if (updates.status !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `J${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[updates.status]] },
      });
    }

    if (updates.checkedIn !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `K${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[updates.checkedIn]] },
      });
    }

    return { success: true, isMock: false };
  } catch (error: any) {
    console.error(`Error updating Google Sheet row ${rowIndex}:`, error);

    mockStudentsStore = mockStudentsStore.map((student) => {
      if (student.rowIndex === rowIndex) {
        return {
          ...student,
          ...(updates.passGenerated !== undefined && { passGenerated: updates.passGenerated }),
          ...(updates.status !== undefined && { status: updates.status }),
          ...(updates.qrData !== undefined && { qrData: updates.qrData }),
          ...(updates.passUrl !== undefined && { passUrl: updates.passUrl }),
          ...(updates.checkedIn !== undefined && { checkedIn: updates.checkedIn }),
        };
      }
      return student;
    });

    return {
      success: true,
      isMock: true,
      message: `Google Sheets update failed: ${error.message}. Saved state locally.`,
    };
  }
}

export async function checkInStudentByQR(scannedData: string): Promise<{
  status: number;
  success: boolean;
  message: string;
  studentName?: string;
  usn?: string;
}> {
  const cleanData = scannedData.trim().toLowerCase();

  const { students } = await getStudents();

  const student = students.find((s) => {
    if (!cleanData) return false;
    const matchQr = s.qrData && s.qrData.trim().toLowerCase() === cleanData;
    const matchUsn = s.usn && s.usn.trim().toLowerCase() === cleanData;
    const matchFormatted1 = cleanData === `niat-navratri-26-${s.usn.trim().toLowerCase()}`;
    const matchFormatted2 = cleanData === `navratri-26-${s.usn.trim().toLowerCase()}`;
    return matchQr || matchUsn || matchFormatted1 || matchFormatted2;
  });

  if (!student) {
    return {
      status: 404,
      success: false,
      message: 'Invalid Pass',
    };
  }

  if (student.checkedIn && student.checkedIn.trim().toLowerCase() === 'yes') {
    return {
      status: 400,
      success: false,
      message: 'Already Checked In',
      studentName: student.name,
      usn: student.usn,
    };
  }

  await updateStudentRow(student.rowIndex, { checkedIn: 'Yes' });

  return {
    status: 200,
    success: true,
    message: 'Access Granted',
    studentName: student.name,
    usn: student.usn,
  };
}
