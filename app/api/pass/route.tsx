import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import QRCode from 'qrcode';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name') || 'Student Pass';
    const usn = searchParams.get('usn') || 'N/A';
    const year = searchParams.get('year') || '';

    // Determine host dynamically from incoming request
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const imageUrl = `${protocol}://${host}/dandiya-art.jpg`;

    // Fetch image buffer and convert to base64
    let imageSrc = imageUrl;
    try {
      const res = await fetch(imageUrl);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        imageSrc = `data:image/jpeg;base64,${base64}`;
      }
    } catch (e) {
      console.error('Failed to pre-fetch image buffer:', e);
    }

    // Generate QR code internally using usn
    const qrDataUrl = await QRCode.toDataURL(`niat-navratri-26-${usn}`, {
      margin: 1,
      width: 130,
      color: {
        dark: '#7C2D12',
        light: '#FFFFFF',
      },
    });

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
            padding: '16px 18px',
            border: '10px solid #C2410C', // Festive red-orange outer border
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
              marginBottom: '4px',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: '11px',
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
                fontSize: '24px',
                fontWeight: 900,
                color: '#9A3412', // Large bold red/orange font
                textAlign: 'center',
                lineHeight: '1.1',
              }}
            >
              Navratri Dandiya Celebration
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: '11px',
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
              marginBottom: '6px',
            }}
          >
            <div style={{ display: 'flex', flex: 1, height: '2px', backgroundColor: '#F97316' }} />
            <div
              style={{
                display: 'flex',
                color: '#EA580C',
                padding: '0 8px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              FESTIVAL VIP PASS
            </div>
            <div style={{ display: 'flex', flex: 1, height: '2px', backgroundColor: '#F97316' }} />
          </div>

          {/* Central Portrait Artwork Container */}
          <div
            style={{
              display: 'flex',
              width: '300px',
              height: '360px',
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
              src={imageSrc}
              alt="Dandiya Celebration Artwork"
              style={{
                width: '300px',
                height: '360px',
                objectFit: 'cover',
                borderRadius: '12px',
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
              marginTop: '6px',
              marginBottom: '6px',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '8px 18px',
              width: '320px',
              border: '2px dashed #FDBA74',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
            }}
          >
            {/* 1. Student Name (Large Font) */}
            <div
              style={{
                display: 'flex',
                fontSize: '22px',
                fontWeight: 900,
                color: '#1E293B',
                textAlign: 'center',
                marginBottom: '1px',
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
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#C2410C',
                  marginBottom: '2px',
                }}
              >
                {year}
              </div>
            ) : null}

            {/* 3. USN: [USN Number] (Smaller Font) below Year */}
            <div
              style={{
                display: 'flex',
                fontSize: '12px',
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
              padding: '6px',
              borderRadius: '14px',
              border: '3px solid #EA580C',
              boxShadow: '0 4px 10px rgba(154, 52, 18, 0.15)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="Pass QR Code"
              style={{
                width: '105px',
                height: '105px',
                borderRadius: '6px',
              }}
            />
            <div
              style={{
                display: 'flex',
                fontSize: '9px',
                fontWeight: 800,
                color: '#9A3412',
                marginTop: '3px',
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
              marginTop: '4px',
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
