import { ImageResponse } from 'next/og';
import QRCode from 'qrcode';
import { promises as fs } from 'fs';
import path from 'path';

// IMPORTANT: Do NOT use `export const runtime = 'edge'`. Leave it as default Node.js.

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name') || 'Student';
    const usn = searchParams.get('usn') || 'N/A';
    const year = searchParams.get('year') || '';

    // 1. Safely read the image from the public folder in Node runtime
    const filePath = path.join(process.cwd(), 'public', 'dandiya-art-2.jpg');
    const imageBuffer = await fs.readFile(filePath);
    const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    // 2. Generate QR Code
    const qrDataUrl = await QRCode.toDataURL(`niat-navratri-26-${usn}`, {
      margin: 1,
      width: 160,
    });

    // 3. Return the OG Image
    return new ImageResponse(
      (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#FFF0D4', width: '100%', height: '100%', padding: '40px' }}>
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
            <p style={{ color: '#C2410C', fontSize: '14px', letterSpacing: '2px', margin: 0 }}>⚲ OFFICIAL DIGITAL PASS ⚲</p>
            <h1 style={{ color: '#9A2A2A', fontSize: '36px', margin: '10px 0 5px 0' }}>Navratri Dandiya Celebration</h1>
            <p style={{ color: '#D97706', fontSize: '16px', margin: 0 }}>Grand Campus Cultural Night 2026</p>
          </div>

          {/* Artwork */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageBase64} style={{ width: '360px', height: '450px', objectFit: 'cover', borderRadius: '16px', border: '4px solid #EA580C' }} alt="Pass Artwork" />

          {/* Student Info Container */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '15px 40px', borderRadius: '12px', border: '2px dashed #FDBA74', marginTop: '20px', width: '360px' }}>
            <h2 style={{ color: '#1E293B', fontSize: '28px', margin: '0 0 5px 0' }}>{name}</h2>
            <p style={{ color: '#C2410C', fontSize: '18px', margin: '0 0 5px 0' }}>{year}</p>
            <p style={{ color: '#64748B', fontSize: '16px', margin: 0 }}>USN: {usn}</p>
          </div>

          {/* QR Code */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#FFFFFF', padding: '10px', borderRadius: '12px', border: '3px solid #EA580C', marginTop: '20px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} style={{ width: '140px', height: '140px' }} alt="QR Code" />
            <p style={{ color: '#9A2A2A', fontSize: '10px', marginTop: '5px', letterSpacing: '1px' }}>SCAN AT MAIN GATE</p>
          </div>
        </div>
      ),
      { width: 500, height: 950 }
    );
  } catch (error) {
    console.error("Pass generation error:", error);
    return new Response("Failed to generate pass. Check server logs.", { status: 500 });
  }
}
