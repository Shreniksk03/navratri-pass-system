import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || 'Student Pass';
    const usn = searchParams.get('usn') || 'N/A';
    const year = searchParams.get('year') || '';
    let qrParam = searchParams.get('qr');

    let qrDataUrl = qrParam || '';

    // If QR code is not passed as base64 data URL, generate it from USN
    if (!qrDataUrl || !qrDataUrl.startsWith('data:image')) {
      const qrText = qrParam || `navratri-26-${usn}`;
      qrDataUrl = await QRCode.toDataURL(qrText, {
        margin: 1,
        width: 160,
        color: {
          dark: '#7C2D12', // Deep brown/amber QR code
          light: '#FFFFFF',
        },
      });
    }

    // Read local public artwork file and encode as Base64 Data URL to bypass SSRF restrictions
    let dandiyaArtworkDataUrl = '';
    try {
      const jpgPath = path.join(process.cwd(), 'public', 'dandiya-art.jpg');
      const pngPath = path.join(process.cwd(), 'public', 'dandiya-art.png');

      if (fs.existsSync(jpgPath)) {
        const fileBuffer = fs.readFileSync(jpgPath);
        dandiyaArtworkDataUrl = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
      } else if (fs.existsSync(pngPath)) {
        const fileBuffer = fs.readFileSync(pngPath);
        dandiyaArtworkDataUrl = `data:image/png;base64,${fileBuffer.toString('base64')}`;
      }
    } catch (e) {
      console.warn('Unable to load local public dandiya image, falling back to default:', e);
    }

    // Fallback URL if local file is missing
    if (!dandiyaArtworkDataUrl) {
      dandiyaArtworkDataUrl =
        'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80';
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFEDD5', // bg-orange-100
            backgroundImage:
              'radial-gradient(circle at 50% 0%, #FED7AA 0%, #FFEDD5 70%, #FFEDD5 100%)',
            padding: '24px 20px',
            border: '12px solid #C2410C', // Festive red-orange outer border
            boxSizing: 'border-box',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              marginBottom: '6px',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '12px',
                letterSpacing: '3px',
                fontWeight: 800,
                color: '#B45309',
                textTransform: 'uppercase',
                marginBottom: '2px',
              }}
            >
              ★ OFFICIAL DIGITAL PASS ★
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '26px',
                fontWeight: 900,
                color: '#9A3412', // Large bold red/orange font
                textAlign: 'center',
                lineHeight: '1.2',
              }}
            >
              Navratri Dandiya Celebration
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '12px',
                fontWeight: 600,
                color: '#C2410C',
                marginTop: '2px',
              }}
            >
              Grand Campus Cultural Night 2026
            </div>
          </div>

          {/* Decorative Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '80%',
              justifyContent: 'center',
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', flex: 1, height: '2px', backgroundColor: '#F97316' }} />
            <div
              style={{
                display: 'flex',
                color: '#EA580C',
                padding: '0 8px',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              FESTIVAL VIP PASS
            </div>
            <div style={{ display: 'flex', flex: 1, height: '2px', backgroundColor: '#F97316' }} />
          </div>

          {/* Central Artwork Container (Loaded from public/dandiya-art.jpg) */}
          <div
            style={{
              display: 'flex',
              width: '320px',
              height: '230px',
              borderRadius: '16px',
              overflow: 'hidden',
              border: '4px solid #F97316',
              boxShadow: '0 8px 16px rgba(194, 65, 12, 0.2)',
              backgroundColor: '#FFF7ED',
              position: 'relative',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dandiyaArtworkDataUrl}
              alt="Dandiya Celebration Artwork"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {/* Overlay badge */}
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                backgroundColor: '#9A3412',
                color: '#FFFFFF',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1px',
              }}
            >
              VIP ENTRY
            </div>
          </div>

          {/* Student Details Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '12px',
              marginBottom: '8px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '12px 24px',
              width: '340px',
              border: '2px dashed #FDBA74',
              boxShadow: '0 4px 6px rgba(0,0,0,0.04)',
            }}
          >
            {/* 1. Student Name (Large Font) */}
            <div
              style={{
                display: 'flex',
                fontSize: '26px',
                fontWeight: 900,
                color: '#1E293B',
                textAlign: 'center',
                marginBottom: '2px',
                letterSpacing: '-0.5px',
              }}
            >
              {name}
            </div>

            {/* 2. Year (Medium Font) directly below Name */}
            {year ? (
              <div
                style={{
                  display: 'flex',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#C2410C',
                  marginBottom: '4px',
                }}
              >
                {year}
              </div>
            ) : null}

            {/* 3. USN: [USN Number] (Smaller Font) below Year */}
            <div
              style={{
                display: 'flex',
                fontSize: '13px',
                fontWeight: 600,
                color: '#64748B',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
              }}
            >
              USN: {usn}
            </div>
          </div>

          {/* QR Code Container at the Very Bottom */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              padding: '10px',
              borderRadius: '16px',
              border: '3px solid #EA580C',
              boxShadow: '0 4px 12px rgba(154, 52, 18, 0.15)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="Pass QR Code"
              style={{
                width: '130px',
                height: '130px',
                borderRadius: '8px',
              }}
            />
            <div
              style={{
                display: 'flex',
                fontSize: '10px',
                fontWeight: 800,
                color: '#9A3412',
                marginTop: '4px',
                letterSpacing: '1px',
              }}
            >
              SCAN AT MAIN GATE
            </div>
          </div>

          {/* Footer Notice */}
          <div
            style={{
              display: 'flex',
              fontSize: '10px',
              color: '#9A3412',
              fontWeight: 600,
              marginTop: '6px',
            }}
          >
            Non-Transferable • College ID Mandatory
          </div>
        </div>
      ),
      {
        width: 500,
        height: 800,
      }
    );
  } catch (error: any) {
    console.error('Error generating pass image:', error);
    return new Response(`Failed to generate pass image: ${error.message}`, { status: 500 });
  }
}
