'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Camera,
  ShieldCheck,
  QrCode,
  Search,
} from 'lucide-react';

type ScannerStatus = 'idle' | 'verifying' | 'success' | 'error';

export default function ScannerPage() {
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [studentUsn, setStudentUsn] = useState<string>('');
  const [scannedCode, setScannedCode] = useState<string>('');
  const [manualInput, setManualInput] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const isInitializingRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);

  // Safely stop scanner instance and clear DOM container
  const stopCamera = async () => {
    if (html5QrcodeRef.current) {
      const instance = html5QrcodeRef.current;
      if (instance.isScanning) {
        try {
          await instance.stop();
        } catch (e) {
          console.warn('Warning during camera stop:', e);
        }
      }
      try {
        instance.clear();
      } catch (e) {
        console.warn('Warning clearing scanner DOM:', e);
      }
      html5QrcodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Safely start camera scanner with concurrency lock (isInitializingRef)
  const startCamera = async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    try {
      await stopCamera();

      // Check if target container exists in DOM
      const element = document.getElementById('qr-reader');
      if (!element) return;

      const html5Qrcode = new Html5Qrcode('qr-reader');
      html5QrcodeRef.current = html5Qrcode;

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };

      const onScanSuccess = (decodedText: string) => {
        if (!isProcessingRef.current) {
          isProcessingRef.current = true;
          handleQrCodeScanned(decodedText);
        }
      };

      try {
        await html5Qrcode.start(
          { facingMode: 'environment' },
          config,
          onScanSuccess,
          () => {}
        );
        setIsCameraActive(true);
      } catch (err) {
        console.warn('Environmental camera start failed, trying default camera:', err);
        await html5Qrcode.start(
          { facingMode: 'user' },
          config,
          onScanSuccess,
          () => {}
        );
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Camera startup failed:', err);
      setIsCameraActive(false);
    } finally {
      isInitializingRef.current = false;
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Process Scanned QR
  const handleQrCodeScanned = async (qrText: string) => {
    setScannedCode(qrText);
    setStatus('verifying');
    await stopCamera();

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: qrText }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStudentName(data.studentName || 'Student');
        setStudentUsn(data.usn || '');
        setStatus('success');
      } else {
        setErrorMessage(data.error || 'Check-in failed');
        setStudentName(data.studentName || '');
        setStudentUsn(data.usn || '');
        setStatus('error');
      }
    } catch (err) {
      setErrorMessage('Network error communicating with check-in API');
      setStatus('error');
    }
  };

  // Reset to scan next student
  const handleReset = async () => {
    setStatus('idle');
    setStudentName('');
    setStudentUsn('');
    setErrorMessage('');
    setScannedCode('');
    setManualInput('');
    isProcessingRef.current = false;
    await startCamera();
  };

  // Manual Check-in Submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      isProcessingRef.current = true;
      handleQrCodeScanned(manualInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Top Festive Gradient Bar */}
      <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-600" />

      {/* Header Navigation */}
      <header className="px-4 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4 text-orange-400" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-400" />
            <h1 className="font-bold text-sm tracking-tight text-white">Gate Scanner</h1>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
            LIVE VERIFIER
          </span>
        </div>
      </header>

      {/* Main Scanner Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md w-full mx-auto space-y-6">
        {/* State 1: IDLE / SCANNING (Camera Active) */}
        {status === 'idle' && (
          <div className="w-full flex flex-col items-center space-y-5">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-white flex items-center justify-center gap-2">
                <Camera className="w-5 h-5 text-orange-400 animate-pulse" />
                Scan Student Pass
              </h2>
              <p className="text-xs text-slate-400">
                Align the QR code on the digital pass within the frame below
              </p>
            </div>

            {/* Video Feed Viewport */}
            <div className="relative w-full max-w-xs aspect-square rounded-2xl overflow-hidden border-4 border-orange-500/60 shadow-2xl bg-slate-900 flex items-center justify-center">
              <div id="qr-reader" className="w-full h-full" />

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 space-y-3">
                  <Camera className="w-10 h-10 text-slate-500" />
                  <p className="text-xs text-slate-300">
                    Camera access required or initializing...
                  </p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-orange-600/30 transition"
                  >
                    Enable Camera
                  </button>
                </div>
              )}
            </div>

            {/* Manual Entry Form */}
            <form onSubmit={handleManualSubmit} className="w-full max-w-xs space-y-2 pt-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Or enter USN manually..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-20 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        )}

        {/* State 2: VERIFYING STATE (Loading Circle) */}
        {status === 'verifying' && (
          <div className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center text-center space-y-5 shadow-2xl animate-pulse">
            <div className="p-4 bg-orange-500/10 rounded-full border border-orange-500/20">
              <RefreshCw className="w-14 h-14 text-orange-500 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Verifying Pass...</h3>
              <p className="text-xs font-mono text-slate-400 break-all">{scannedCode}</p>
            </div>
            <p className="text-[11px] text-slate-500">Checking Google Sheet records & check-in status...</p>
          </div>
        )}

        {/* State 3: SUCCESS STATE (Green Tick) */}
        {status === 'success' && (
          <div className="w-full max-w-xs bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 shadow-2xl shadow-emerald-950/60 transition transform translate-y-0 scale-100">
            {/* Massive Animated Green Tick Mark */}
            <div className="p-4 bg-emerald-500/20 rounded-full border-4 border-emerald-500/40 animate-bounce">
              <CheckCircle2 className="w-20 h-20 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                ✓ Check-In Confirmed
              </div>
              <h2 className="text-2xl font-black text-white leading-tight">
                Access Granted
              </h2>
              <div className="text-lg font-bold text-emerald-300">
                {studentName}
              </div>
              {studentUsn && (
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                  USN: {studentUsn}
                </p>
              )}
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              Scan Next Pass
            </button>
          </div>
        )}

        {/* State 4: ERROR STATE (Red Cross) */}
        {status === 'error' && (
          <div className="w-full max-w-xs bg-slate-900 border-2 border-rose-500/60 rounded-3xl p-8 flex flex-col items-center text-center space-y-6 shadow-2xl shadow-rose-950/60">
            {/* Massive Red Cross Mark */}
            <div className="p-4 bg-rose-500/20 rounded-full border-4 border-rose-500/40">
              <XCircle className="w-20 h-20 text-rose-500" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-extrabold uppercase tracking-wider">
                ✕ Access Denied
              </div>
              <h2 className="text-xl font-extrabold text-rose-400">
                {errorMessage}
              </h2>

              {studentName && (
                <div className="text-sm font-semibold text-slate-200 mt-1">
                  Student: {studentName}
                </div>
              )}

              <p className="text-xs text-slate-400 pt-1">
                {errorMessage === 'Already Checked In'
                  ? 'This pass has already been scanned at the gate earlier.'
                  : 'This QR code was not found in the official registrations.'}
              </p>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-orange-400" />
              Scan Next Pass
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-slate-500 text-xs border-t border-slate-900">
        Navratri Gate Verification System • College Cultural Night 2026
      </footer>
    </div>
  );
}
