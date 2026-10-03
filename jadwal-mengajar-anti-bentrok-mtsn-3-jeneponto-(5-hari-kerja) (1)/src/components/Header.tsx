import React from 'react';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  RotateCcw,
  Sparkles,
  Users,
  Building,
  Clock,
  Settings,
  ShieldCheck,
  Table as TableIcon,
  UserCheck,
  Lock,
} from 'lucide-react';
import { Conflict, SchoolInfo } from '../types/schedule';

interface HeaderProps {
  activeTab: 'master' | 'teacher' | 'class' | 'audit' | 'settings' | 'calendar';
  setActiveTab: (tab: 'master' | 'teacher' | 'class' | 'audit' | 'settings' | 'calendar') => void;
  conflicts: Conflict[];
  schoolInfo: SchoolInfo;
  onPrint: () => void;
  onExportCSV: () => void;
  onRegenerate: () => void;
  onAutoFix: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  conflicts,
  schoolInfo,
  onPrint,
  onExportCSV,
  onRegenerate,
  onAutoFix,
}) => {
  const hasConflicts = conflicts.length > 0;

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30 print:hidden">
      {/* Top Banner with Official Madrasah Identity */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Calendar className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-widest uppercase bg-emerald-950/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {schoolInfo.type}
                </span>
                <span className="text-[11px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                  5 Hari Kerja (Senin - Jumat)
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                {schoolInfo.name}
              </h1>
              <p className="text-xs text-emerald-100/90 font-medium flex flex-wrap items-center gap-2">
                <span>Jadwal Pelajaran Anti Bentrok Semester {schoolInfo.semester} • TP {schoolInfo.academicYear}</span>
                <span className="text-emerald-400 font-bold hidden sm:inline">•</span>
                <span className="text-amber-300 font-black bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded text-[10.5px]">
                  Pengembang : JEMI ARIFIN, ST (Staff TU MTsN 3 Jeneponto)
                </span>
              </p>
            </div>
          </div>

          {/* Conflict Status Badge */}
          <div className="flex items-center gap-3">
            {hasConflicts ? (
              <div className="flex items-center gap-2.5 bg-rose-500/90 backdrop-blur-md border border-rose-300/40 text-white px-3.5 py-1.5 rounded-lg shadow-sm">
                <AlertTriangle className="w-5 h-5 text-yellow-200 animate-pulse" />
                <div className="text-xs">
                  <div className="font-bold">{conflicts.length} Bentrok Jadwal Terdeteksi!</div>
                  <button
                    onClick={onAutoFix}
                    className="underline text-yellow-100 hover:text-white font-medium text-[11px] mt-0.5 cursor-pointer"
                  >
                    Klik untuk Perbaiki Otomatis
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-emerald-950/70 border border-emerald-400/30 text-emerald-200 px-3.5 py-1.5 rounded-lg shadow-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div className="text-xs">
                  <span className="font-bold text-white block">Status: 100% Anti Bentrok</span>
                  <span className="text-[11px] text-emerald-300">0 Tabrakan Guru Terverifikasi</span>
                </div>
              </div>
            )}

            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 bg-white text-emerald-800 hover:bg-emerald-50 font-semibold text-xs px-3.5 py-2 rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Jadwal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar & Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('master')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'master'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Matriks Utama (13 Kelas)</span>
          </button>

          <button
            onClick={() => setActiveTab('teacher')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'teacher'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Jadwal Guru Pribadi</span>
          </button>

          <button
            onClick={() => setActiveTab('class')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'class'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Jadwal Per Kelas</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer relative ${
              activeTab === 'audit'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit & Beban Guru</span>
            {hasConflicts && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Acara & Libur</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Master Data & Waktu</span>
          </button>
        </nav>

        {/* Quick Actions & Quick Stats */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCSV}
            title="Download Jadwal ke Microsoft Excel / CSV"
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={onRegenerate}
            title="Bangun Ulang Jadwal Baru Anti Bentrok"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-2.5 py-1.5 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span>Tata Ulang Jadwal</span>
          </button>
        </div>
      </div>
    </header>
  );
};
