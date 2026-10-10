'use client';

import React, { useEffect, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import Link from 'next/link';
import {
  Sparkles,
  Ticket,
  Send,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  ExternalLink,
  Eye,
  X,
  AlertCircle,
  Check,
  QrCode,
  Download,
  Users,
  Building2,
  GraduationCap,
  Camera,
} from 'lucide-react';

interface Student {
  rowIndex: number;
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
  checkedIn: string; // Column K (Checked_In)
}

export default function AdminDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMock, setIsMock] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);
  const [previewPassUrl, setPreviewPassUrl] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ type, text });
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      if (data.success) {
        setStudents(data.students || []);
        setIsMock(!!data.isMock);
      } else {
        showToast(data.error || 'Failed to fetch student data', 'error');
      }
    } catch (err: any) {
      showToast('Network error while loading sheet data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const constructPassUrl = async (name: string, usn: string, year: string): Promise<{ url: string; qrText: string }> => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const qrText = `navratri-26-${usn}`;
    let base64Qr = '';
    try {
      base64Qr = await QRCode.toDataURL(qrText, { margin: 1, width: 160 });
    } catch (e) {
      console.error('QR code generation error:', e);
    }

    const encodedName = encodeURIComponent(name);
    const encodedUsn = encodeURIComponent(usn);
    const encodedYear = encodeURIComponent(year || '');
    const encodedQr = encodeURIComponent(base64Qr);

    const url = `${origin}/api/pass?name=${encodedName}&usn=${encodedUsn}&year=${encodedYear}&qr=${encodedQr}`;
    return { url, qrText };
  };

  const handleGeneratePass = async (student: Student) => {
    const key = `gen-${student.rowIndex}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const { url, qrText } = await constructPassUrl(student.name, student.usn, student.year);

      const res = await fetch('/api/students/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIndex: student.rowIndex,
          qrData: qrText,
          passUrl: url,
          passGenerated: 'Yes',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStudents((prev) =>
          prev.map((s) =>
            s.rowIndex === student.rowIndex
              ? { ...s, qrData: qrText, passUrl: url, passGenerated: 'Yes' }
              : s
          )
        );

        setPreviewStudent(student);
        setPreviewPassUrl(url);

        showToast(`Pass generated successfully for ${student.name}!`, 'success');
      } else {
        showToast(data.error || 'Failed to update pass generation state', 'error');
      }
    } catch (err) {
      showToast('Error connecting to server', 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSendWhatsApp = async (student: Student) => {
    const { url } = await constructPassUrl(student.name, student.usn, student.year);
    const targetPassUrl = student.passUrl || url;

    let cleanPhone = student.whatsappNumber.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    } else if (cleanPhone.startsWith('0')) {
      cleanPhone = `91${cleanPhone.slice(1)}`;
    }

    const message = `Hi ${student.name}, here is your Navratri pass! Please download it and show it at the gate: ${targetPassUrl}`;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank');
    showToast(`Opened WhatsApp chat for ${student.name}`, 'info');
  };

  const handleMarkAsSent = async (student: Student) => {
    const key = `sent-${student.rowIndex}`;
    setActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await fetch('/api/students/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIndex: student.rowIndex,
          status: 'Sent',
          passGenerated: 'Yes',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStudents((prev) =>
          prev.map((s) =>
            s.rowIndex === student.rowIndex
              ? { ...s, status: 'Sent', passGenerated: 'Yes' }
              : s
          )
        );
        showToast(`Marked Column J as SENT for ${student.name}`, 'success');
      } else {
        showToast(data.error || 'Failed to update status in Google Sheet', 'error');
      }
    } catch (err) {
      showToast('Error updating status', 'error');
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleOpenPreview = async (student: Student) => {
    if (student.passUrl) {
      setPreviewStudent(student);
      setPreviewPassUrl(student.passUrl);
    } else {
      const { url } = await constructPassUrl(student.name, student.usn, student.year);
      setPreviewStudent(student);
      setPreviewPassUrl(url);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.usn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.year.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.block.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.whatsappNumber.includes(searchQuery);

      if (statusFilter === 'pending') {
        return matchesSearch && (s.status.toLowerCase() === 'pending' || !s.status);
      }
      if (statusFilter === 'sent') {
        return matchesSearch && s.status.toLowerCase() === 'sent';
      }
      if (statusFilter === 'checkedin') {
        return matchesSearch && s.checkedIn.toLowerCase() === 'yes';
      }
      if (statusFilter === 'generated') {
        return matchesSearch && (s.passGenerated.toLowerCase() === 'yes' || !!s.passUrl);
      }
      return matchesSearch;
    });
  }, [students, searchQuery, statusFilter]);

  const totalCount = students.length;
  const generatedCount = students.filter(
    (s) => s.passGenerated.toLowerCase() === 'yes' || !!s.passUrl
  ).length;
  const sentCount = students.filter((s) => s.status.toLowerCase() === 'sent').length;
  const checkedInCount = students.filter((s) => s.checkedIn.toLowerCase() === 'yes').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Top Festive Bar */}
      <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-600" />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg shadow-orange-500/20 text-white">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Navratri Pass Manager
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  Dandiya 2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Mapped Columns A:K (Includes Gate Check-in Column K)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/scanner"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 rounded-lg shadow-lg shadow-orange-600/20 border border-orange-500/30 transition"
            >
              <Camera className="w-4 h-4 animate-pulse" />
              Open Gate Scanner
            </Link>

            <button
              onClick={fetchStudents}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 rounded-lg border border-slate-700 transition duration-150 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-400' : ''}`} />
              Refresh Sheet Data
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-950/50'
                : toastMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-950/50'
                : 'bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            {toastMessage.type === 'info' && <ExternalLink className="w-5 h-5 text-sky-400 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {isMock && (
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <strong className="font-semibold text-amber-300">Demo Mode:</strong> Showing sample registrations. Connect live sheet via .env credentials.
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-amber-500/20 rounded-md border border-amber-500/30 text-amber-300 font-mono shrink-0">
              Columns A2:K Mapped
            </span>
          </div>
        )}

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Students</p>
              <h3 className="text-2xl font-extrabold text-white mt-1">{totalCount}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Passes Generated</p>
              <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{generatedCount}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
              <Ticket className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Sent (Col J)</p>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-1">{sentCount}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
              <Send className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Checked In (Col K)</p>
              <h3 className="text-2xl font-extrabold text-cyan-400 mt-1">{checkedInCount}</h3>
            </div>
            <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search Name, USN, Year, Block..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Students' },
              { id: 'pending', label: 'Pending Dispatch' },
              { id: 'sent', label: 'Sent (Col J)' },
              { id: 'checkedin', label: 'Checked In (Col K)' },
              { id: 'generated', label: 'Pass Generated' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase font-semibold text-slate-400 border-b border-slate-700/60">
                <tr>
                  <th scope="col" className="px-5 py-4">Row</th>
                  <th scope="col" className="px-5 py-4">Name</th>
                  <th scope="col" className="px-5 py-4">USN</th>
                  <th scope="col" className="px-5 py-4">Year (Col D)</th>
                  <th scope="col" className="px-5 py-4">Hosteller / Block</th>
                  <th scope="col" className="px-5 py-4">Status (Col J)</th>
                  <th scope="col" className="px-5 py-4">Gate Check-In (Col K)</th>
                  <th scope="col" className="px-5 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-orange-500 mb-2" />
                      Loading student records...
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      No matching student registrations found.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const isGenerated =
                      student.passGenerated.toLowerCase() === 'yes' || !!student.passUrl;
                    const isSent = student.status.toLowerCase() === 'sent';
                    const isCheckedIn = student.checkedIn.toLowerCase() === 'yes';
                    const genKey = `gen-${student.rowIndex}`;
                    const sentKey = `sent-${student.rowIndex}`;

                    return (
                      <tr key={student.rowIndex} className="hover:bg-slate-800/80 transition duration-150">
                        <td className="px-5 py-4 font-mono text-xs text-slate-500">#{student.rowIndex}</td>
                        <td className="px-5 py-4 font-medium text-white">
                          <div className="flex items-center gap-2">
                            <span>{student.name}</span>
                            {isGenerated && (
                              <button
                                onClick={() => handleOpenPreview(student)}
                                title="Preview Digital Pass"
                                className="text-orange-400 hover:text-orange-300 transition"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-slate-300">{student.usn}</td>
                        <td className="px-5 py-4 text-xs text-amber-300">
                          <div className="flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{student.year || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-300">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-200">
                              {student.hosteller ? `Hostel: ${student.hosteller}` : 'N/A'}
                            </span>
                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              {student.block || 'Day Scholar'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {isSent ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Sent
                              </span>
                            ) : isGenerated ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Ticket className="w-3.5 h-3.5" />
                                Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-400 border border-slate-600/40">
                                <Clock className="w-3.5 h-3.5" />
                                Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {isCheckedIn ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                              Checked In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-slate-500 bg-slate-800">
                              Not Checked In
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleGeneratePass(student)}
                              disabled={actionLoading[genKey]}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-200 bg-amber-950/60 hover:bg-amber-900 border border-amber-700/50 rounded-lg transition disabled:opacity-50"
                            >
                              {actionLoading[genKey] ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              {isGenerated ? 'Re-Gen' : 'Generate'}
                            </button>

                            <button
                              onClick={() => handleSendWhatsApp(student)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-100 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 rounded-lg shadow-sm transition"
                            >
                              <Send className="w-3.5 h-3.5" />
                              Send WA
                            </button>

                            <button
                              onClick={() => handleMarkAsSent(student)}
                              disabled={actionLoading[sentKey] || isSent}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition disabled:opacity-50 ${
                                isSent
                                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'
                              }`}
                            >
                              {actionLoading[sentKey] ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                              {isSent ? 'Sent' : 'Mark Sent'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Pass Preview Modal */}
      {previewStudent && previewPassUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-white text-base">Pass Preview: {previewStudent.name}</h3>
              </div>
              <button
                onClick={() => setPreviewStudent(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center bg-slate-950/50 overflow-y-auto max-h-[70vh]">
              <div className="relative border-4 border-orange-500/40 rounded-xl overflow-hidden shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewPassUrl}
                  alt={`Navratri Pass for ${previewStudent.name}`}
                  className="w-[300px] h-[480px] object-cover rounded-lg"
                />
              </div>

              <div className="mt-4 w-full text-center">
                <p className="text-xs text-slate-400">Pass Image Endpoint (Column I):</p>
                <input
                  type="text"
                  readOnly
                  value={previewPassUrl}
                  className="w-full text-xs font-mono bg-slate-900 border border-slate-700 rounded-lg p-2 mt-1 text-slate-300 text-center select-all"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
              <a
                href={previewPassUrl}
                target="_blank"
                download={`navratri-pass-${previewStudent.usn}.png`}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition"
              >
                <Download className="w-4 h-4 text-orange-400" />
                Download Image
              </a>

              <button
                onClick={() => {
                  handleSendWhatsApp(previewStudent);
                  setPreviewStudent(null);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-lg shadow-emerald-600/20"
              >
                <Send className="w-4 h-4" />
                Dispatch via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
