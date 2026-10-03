import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  School,
  Award,
  ChevronDown,
  ChevronUp,
  Layers,
  BookOpen,
  Users,
  Check,
  ArrowRight,
  Sparkles,
  PieChart,
  HelpCircle,
  Edit3,
  ShieldCheck,
} from 'lucide-react';
import { DayOfWeek, Teacher, WeeklySchedule, ClassRoom } from '../types/schedule';
import { TeacherWorkload, calculateTeacherWorkload, DAYS } from '../utils/scheduler';
import { INITIAL_CLASSES } from '../data/initialData';

interface JTMSummarySectionProps {
  schedule: WeeklySchedule;
  teachers: Teacher[];
  onOpenEditTeacher?: (teacher: Teacher) => void;
  classes?: ClassRoom[];
}

export const JTMSummarySection: React.FC<JTMSummarySectionProps> = ({
  schedule,
  teachers,
  onOpenEditTeacher,
  classes = INITIAL_CLASSES,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DEFICIT_TEACHERS' | 'FULFILLED_TEACHERS' | 'ROMBEL' | 'SUBJECTS'>('OVERVIEW');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const workloads = useMemo(() => calculateTeacherWorkload(schedule, teachers), [schedule, teachers]);

  // 1. Matriks Jadwal Slots Calculation (13 Rombel x 40 JP = 520 JP target)
  const TOTAL_ROMBEL_TARGET_JP = classes.length * 40; // 13 * 40 = 520 JP

  const {
    filledScheduleSlots,
    emptyScheduleSlots,
    rombelScheduleMap,
    subjectScheduleMap,
  } = useMemo(() => {
    let filled = 0;
    const rombelMap: Record<string, { filled: number; target: number; subjects: Record<string, number> }> = {};
    const subjMap: Record<string, { filled: number; teachers: Set<number> }> = {};

    classes.forEach(c => {
      rombelMap[c.id] = { filled: 0, target: 40, subjects: {} };
    });

    for (const day of DAYS) {
      const daySlots = schedule[day] || {};
      for (const periodSlots of Object.values(daySlots)) {
        for (const [classId, cell] of Object.entries(periodSlots)) {
          if (cell && cell.subject && cell.subject.trim() !== '' && cell.kg > 0) {
            filled += 1;
            if (rombelMap[classId]) {
              rombelMap[classId].filled += 1;
              rombelMap[classId].subjects[cell.subject] = (rombelMap[classId].subjects[cell.subject] || 0) + 1;
            }
            if (!subjMap[cell.subject]) {
              subjMap[cell.subject] = { filled: 0, teachers: new Set() };
            }
            subjMap[cell.subject].filled += 1;
            subjMap[cell.subject].teachers.add(cell.kg);
          }
        }
      }
    }

    return {
      filledScheduleSlots: filled,
      emptyScheduleSlots: Math.max(0, TOTAL_ROMBEL_TARGET_JP - filled),
      rombelScheduleMap: rombelMap,
      subjectScheduleMap: subjMap,
    };
  }, [schedule, classes, TOTAL_ROMBEL_TARGET_JP]);

  // 2. Teacher Workload & Certification Standards Calculation (38 Guru x 24 JP = 912 JP)
  const TOTAL_CERTIFICATION_TARGET_JP = teachers.length * 24; // 38 * 24 = 912 JP

  const {
    totalTeachingHours,
    totalInternalDutyHours,
    totalExternalDutyHours,
    totalCombinedCertifiedHours,
    teachersMeeting24,
    teachersBelow24,
    totalDeficitHours,
    totalSurplusHours,
  } = useMemo(() => {
    const teaching = workloads.reduce((sum, w) => sum + w.teachingHours, 0);
    const internal = workloads.reduce((sum, w) => sum + (w.internalDutyHours || 0), 0);
    const external = workloads.reduce((sum, w) => sum + (w.externalTeachingHours || 0), 0);
    const combined = workloads.reduce((sum, w) => sum + w.totalCertifiedHours, 0);

    const meeting: TeacherWorkload[] = [];
    const below: TeacherWorkload[] = [];
    let deficit = 0;
    let surplus = 0;

    for (const w of workloads) {
      if (w.totalCertifiedHours >= 24) {
        meeting.push(w);
        surplus += (w.totalCertifiedHours - 24);
      } else {
        below.push(w);
        deficit += (24 - w.totalCertifiedHours);
      }
    }

    return {
      totalTeachingHours: teaching,
      totalInternalDutyHours: internal,
      totalExternalDutyHours: external,
      totalCombinedCertifiedHours: combined,
      teachersMeeting24: meeting,
      teachersBelow24: below,
      totalDeficitHours: deficit,
      totalSurplusHours: surplus,
    };
  }, [workloads]);

  // Standard Subject Curriculums
  const standardCurriculumSubjects = useMemo(() => [
    { name: 'Bahasa Indonesia', weeklyPerRombel: 6, totalTarget: 6 * classes.length },
    { name: 'Matematika', weeklyPerRombel: 4, totalTarget: 4 * classes.length },
    { name: 'IPA', weeklyPerRombel: 4, totalTarget: 4 * classes.length },
    { name: 'Bahasa Inggris', weeklyPerRombel: 4, totalTarget: 4 * classes.length },
    { name: 'IPS', weeklyPerRombel: 4, totalTarget: 4 * classes.length },
    { name: 'Penjaskes', weeklyPerRombel: 3, totalTarget: 3 * classes.length },
    { name: 'PKn', weeklyPerRombel: 2, totalTarget: 2 * classes.length },
    { name: 'Seni Budaya', weeklyPerRombel: 2, totalTarget: 2 * classes.length },
    { name: 'Fiqhi', weeklyPerRombel: 2, totalTarget: 2 * classes.length },
    { name: 'Aqidah Akhlak', weeklyPerRombel: 2, totalTarget: 2 * classes.length },
    { name: "Al-Qur'an Hadits", weeklyPerRombel: 2, totalTarget: 2 * classes.length },
    { name: 'SKI', weeklyPerRombel: 2, totalTarget: 2 * classes.length },
    { name: 'Bahasa Arab', weeklyPerRombel: 2, totalTarget: 2 * classes.length },
    { name: 'Informatika', weeklyPerRombel: 2, totalTarget: 2 * classes.length },
    { name: 'BTQ', weeklyPerRombel: 1, totalTarget: 1 * classes.length },
  ], [classes]);

  const scheduleFillPercent = Math.min(100, (filledScheduleSlots / (TOTAL_ROMBEL_TARGET_JP || 1)) * 100);
  const teacherCertPercent = Math.min(100, (teachersMeeting24.length / (teachers.length || 1)) * 100);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-2xl shadow-xl border border-emerald-800/60 overflow-hidden text-white transition-all">
      {/* Header Banner */}
      <div className="p-5 border-b border-emerald-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                Kesimpulan Rekapitulasi JTM
              </span>
              <span className="text-[10px] font-bold text-emerald-200/80">
                13 Rombel • 38 Guru • Sistem 5 Hari Kerja
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white mt-0.5 flex items-center gap-2">
              <span>Analisis JTM Terpenuhi vs Sisa JTM</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-700/60">
                {filledScheduleSlots === TOTAL_ROMBEL_TARGET_JP ? '100% Tuntas Terpenuhi' : `${filledScheduleSlots}/${TOTAL_ROMBEL_TARGET_JP} JP Terisi`}
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200 bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/60 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <span>{isExpanded ? 'Sembunyikan Rincian' : 'Buka Rincian Lengkap'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main 4-Column Executive Summary Cards */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 bg-black/20">
        {/* Card 1: JTM Kurikulum / Jadwal 13 Rombel */}
        <div className="bg-white/5 backdrop-blur-xs p-4 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-bold flex items-center gap-1.5 text-emerald-300">
              <Clock className="w-3.5 h-3.5" />
              JTM Jadwal 13 Rombel
            </span>
            <span className="font-mono font-bold text-[11px] text-slate-400">Target: {TOTAL_ROMBEL_TARGET_JP} JP</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white">
              {filledScheduleSlots} <span className="text-xs font-semibold text-emerald-300">JP Terpenuhi</span>
            </div>
            <div className="text-right">
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                emptyScheduleSlots === 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
              }`}>
                {emptyScheduleSlots === 0 ? '✓ Sisa: 0 JP' : `Sisa: ${emptyScheduleSlots} JP`}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                scheduleFillPercent >= 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-300' : 'bg-amber-400'
              }`}
              style={{ width: `${scheduleFillPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>13 Kelas x 40 JP/minggu</span>
            <span className="font-bold text-emerald-300">{scheduleFillPercent.toFixed(1)}% Terisi</span>
          </div>
        </div>

        {/* Card 2: Guru Memenuhi Syarat Sertifikasi (≥ 24 JP) */}
        <div className="bg-white/5 backdrop-blur-xs p-4 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-bold flex items-center gap-1.5 text-teal-300">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Kelayakan Sertifikasi (≥24 JP)
            </span>
            <span className="font-mono font-bold text-[11px] text-slate-400">{teachers.length} Guru</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-teal-200">
              {teachersMeeting24.length} <span className="text-xs font-semibold text-slate-300">Guru Tuntas</span>
            </div>
            <div className="text-right">
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                teachersBelow24.length === 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
              }`}>
                {teachersBelow24.length === 0 ? '✓ Semua Memenuhi' : `${teachersBelow24.length} Kurang <24`}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                teacherCertPercent >= 100 ? 'bg-gradient-to-r from-teal-400 to-emerald-300' : 'bg-amber-400'
              }`}
              style={{ width: `${teacherCertPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Standar Kemenag 24 JP/minggu</span>
            <span className="font-bold text-teal-300">{teacherCertPercent.toFixed(1)}% Guru</span>
          </div>
        </div>

        {/* Card 3: Sisa Kekurangan JTM Guru */}
        <div className="bg-white/5 backdrop-blur-xs p-4 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-bold flex items-center gap-1.5 text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Sisa Kekurangan JTM Guru
            </span>
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded">
              {teachersBelow24.length} Guru
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-amber-300">
              {totalDeficitHours} <span className="text-xs font-semibold text-slate-300">JP Sisa Kurang</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-300">
                Surplus: +{totalSurplusHours} JP
              </span>
            </div>
          </div>

          <div className="text-[11px] text-amber-200/90 leading-tight">
            {totalDeficitHours === 0 ? (
              <span className="text-emerald-300 font-bold">✨ Sempurna! Seluruh 38 guru telah mencapai kuota minimal 24 JP.</span>
            ) : (
              <span>Dapat dipenuhi melalui <strong>Tugas Intern Madrasah</strong> atau <strong>Mengajar di Sekolah Lain</strong>.</span>
            )}
          </div>
        </div>

        {/* Card 4: Total Beban Terealisasi */}
        <div className="bg-white/5 backdrop-blur-xs p-4 rounded-xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-bold flex items-center gap-1.5 text-indigo-300">
              <Award className="w-3.5 h-3.5 text-indigo-400" />
              Total Beban Guru Realisasi
            </span>
            <span className="text-[10px] font-bold text-slate-400">Tatap Muka + Tugas</span>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-indigo-200">
              {totalCombinedCertifiedHours} <span className="text-xs font-semibold text-slate-300">JP Total</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-300 font-bold">
                +{(totalInternalDutyHours + totalExternalDutyHours)} JP Tugas
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>Intern: +{totalInternalDutyHours} JP</span>
            <span>Sekolah Lain: +{totalExternalDutyHours} JP</span>
          </div>
        </div>
      </div>

      {/* Expandable Detailed Breakdown Section */}
      {isExpanded && (
        <div className="p-5 border-t border-emerald-800/50 space-y-4 bg-slate-950/40">
          {/* Sub-tabs selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs border-b border-emerald-800/40 pb-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'OVERVIEW'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>1. Ringkasan Keseluruhan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('DEFICIT_TEACHERS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'DEFICIT_TEACHERS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Guru Kurang JTM ({teachersBelow24.length} Orang • Sisa -{totalDeficitHours} JP)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('FULFILLED_TEACHERS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'FULFILLED_TEACHERS'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-300" />
              <span>3. Guru Memenuhi Syarat ({teachersMeeting24.length} Orang)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ROMBEL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'ROMBEL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <School className="w-3.5 h-3.5 text-blue-300" />
              <span>4. Rekap JTM Tiap Rombel (13 Kelas)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('SUBJECTS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'SUBJECTS'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-300" />
              <span>5. Rekap JTM Per Mapel (15 Mapel)</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Summary Box */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Kesimpulan Pemenuhan JTM MTsN 3 Jeneponto
                  </h4>

                  <div className="space-y-2 text-xs text-slate-300 divide-y divide-white/10">
                    <div className="flex items-center justify-between pt-1">
                      <span>Total Kebutuhan Kurikulum 13 Rombel:</span>
                      <span className="font-bold text-white">{TOTAL_ROMBEL_TARGET_JP} JP / minggu</span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="flex items-center gap-1.5 text-emerald-300 font-bold">
                        <span>• JTM Terpenuhi & Terplot di Matriks:</span>
                      </span>
                      <span className="font-black text-emerald-300 text-sm">{filledScheduleSlots} JP ({scheduleFillPercent.toFixed(1)}%)</span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
                        <span>• Sisa Slot JTM Belum Terisi:</span>
                      </span>
                      <span className={`font-black ${emptyScheduleSlots === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {emptyScheduleSlots === 0 ? '0 JP (Lengkap 100%)' : `${emptyScheduleSlots} JP`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span>Total Beban Tatap Muka Guru Diampu:</span>
                      <span className="font-bold text-white">{totalTeachingHours} JP</span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span>Tugas Tambahan Intern Madrasah:</span>
                      <span className="font-bold text-teal-300">+{totalInternalDutyHours} JP</span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span>Mengajar di Madrasah/Sekolah Lain:</span>
                      <span className="font-bold text-amber-300">+{totalExternalDutyHours} JP</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 font-bold text-indigo-300 text-sm">
                      <span>Total Realisasi Beban Guru:</span>
                      <span className="font-black text-white">{totalCombinedCertifiedHours} JP</span>
                    </div>
                  </div>
                </div>

                {/* Right: Recommendation & Action Points */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Status Pemenuhan Beban Kerja Guru
                  </h4>

                  <div className="space-y-2.5 text-xs text-slate-300">
                    <div className="bg-emerald-950/70 p-3 rounded-lg border border-emerald-700/60 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-200 block text-xs font-bold">
                          {teachersMeeting24.length} dari {teachers.length} Guru ({teacherCertPercent.toFixed(1)}%) Telah Memenuhi Syarat Sertifikasi
                        </strong>
                        <span className="text-[11px] text-emerald-100/80">
                          Guru pada kategori ini memiliki beban total ≥ 24 JP (gabungan jam tatap muka kelas, tugas intern, atau mengajar luar).
                        </span>
                      </div>
                    </div>

                    {teachersBelow24.length > 0 ? (
                      <div className="bg-amber-950/70 p-3 rounded-lg border border-amber-700/60 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-200 block text-xs font-bold">
                            Terdapat {teachersBelow24.length} Guru Memiliki Sisa Kekurangan JTM (Total Sisa: {totalDeficitHours} JP)
                          </strong>
                          <span className="text-[11px] text-amber-100/80">
                            Untuk memenuhi kuota 24 JP, tambahkan jam melalui <strong>Tugas Intern Madrasah</strong> (Wali Kelas +6 JP, Pembina +3 s/d 6 JP, Wakamad +12 JP) atau <strong>Mengajar di Sekolah Lain</strong> (+2 s/d 12 JP).
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-950/70 p-3 rounded-lg border border-emerald-700/60 text-[11px] text-emerald-200">
                        🎉 Luar biasa! Seluruh 38 guru telah memenuhi kuota minimal 24 JP/minggu.
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Rata-rata beban mengajar guru:</span>
                      <strong className="text-white">{(totalCombinedCertifiedHours / (teachers.length || 1)).toFixed(1)} JP / guru</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEFICIT TEACHERS (<24 JP) */}
          {activeTab === 'DEFICIT_TEACHERS' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300">
                  Daftar {teachersBelow24.length} Guru yang Belum Mencapai Kuota 24 JP (Total Sisa Kekurangan: {totalDeficitHours} JP):
                </span>
                <span className="text-[11px] text-slate-400">
                  Klik tombol <strong>"Atur JTM / Tugas"</strong> untuk menambahkan jam
                </span>
              </div>

              {teachersBelow24.length === 0 ? (
                <div className="p-6 text-center bg-white/5 rounded-xl border border-white/10 text-emerald-300 font-bold text-xs">
                  ✓ Tidak ada guru yang kurang jam. Seluruh 38 guru telah memenuhi kuota ≥24 JP.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {teachersBelow24.map(wl => {
                    const deficit = 24 - wl.totalCertifiedHours;
                    return (
                      <div
                        key={wl.teacher.kg}
                        className="bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-amber-500/30 space-y-2 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center border border-amber-400/40">
                              {wl.teacher.kg}
                            </span>
                            <div>
                              <div className="font-bold text-xs text-white leading-tight">{wl.teacher.name}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[170px]">{wl.teacher.subjects.join(', ')}</div>
                            </div>
                          </div>

                          <span className="text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-400/40 px-2 py-0.5 rounded-full shrink-0">
                            Kurang {deficit} JP
                          </span>
                        </div>

                        {/* Breakdown bar */}
                        <div className="bg-black/30 p-2 rounded-lg text-[11px] space-y-1">
                          <div className="flex justify-between text-slate-300">
                            <span>Tatap Muka Kelas:</span>
                            <strong className="text-white">{wl.teachingHours} JP</strong>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Tugas Intern:</span>
                            <span className="text-teal-300">{wl.internalDutyHours ? `+${wl.internalDutyHours} JP` : '-'}</span>
                          </div>
                          <div className="flex justify-between text-slate-300">
                            <span>Sekolah Lain:</span>
                            <span className="text-amber-300">{wl.externalTeachingHours ? `+${wl.externalTeachingHours} JP` : '-'}</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-white/10 font-bold">
                            <span>Total Saat Ini:</span>
                            <span className="text-amber-300">{wl.totalCertifiedHours} / 24 JP</span>
                          </div>
                        </div>

                        {onOpenEditTeacher && (
                          <button
                            type="button"
                            onClick={() => onOpenEditTeacher(wl.teacher)}
                            className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Atur JTM / Tugas (+{deficit} JP)</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FULFILLED TEACHERS (>=24 JP) */}
          {activeTab === 'FULFILLED_TEACHERS' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-teal-300">
                  Daftar {teachersMeeting24.length} Guru yang Sudah Memenuhi Syarat Kuota ≥24 JP:
                </span>
                <span className="text-[11px] text-emerald-300 font-semibold">
                  Total Terpenuhi: {teachersMeeting24.reduce((sum, w) => sum + w.totalCertifiedHours, 0)} JP
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {teachersMeeting24.map(wl => {
                  const surplus = wl.totalCertifiedHours - 24;
                  return (
                    <div
                      key={wl.teacher.kg}
                      className="bg-white/5 p-3 rounded-xl border border-emerald-500/20 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center border border-emerald-400/40">
                            {wl.teacher.kg}
                          </span>
                          <div>
                            <div className="font-bold text-xs text-white leading-tight">{wl.teacher.name}</div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[170px]">{wl.teacher.subjects.join(', ')}</div>
                          </div>
                        </div>

                        <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full shrink-0">
                          {wl.totalCertifiedHours} JP {surplus > 0 ? `(+${surplus})` : '✓'}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center justify-between bg-black/20 px-2 py-1 rounded">
                        <span>Tatap Muka: <strong className="text-white">{wl.teachingHours} JP</strong></span>
                        {wl.internalDutyHours > 0 && <span>Intern: <strong className="text-teal-300">+{wl.internalDutyHours} JP</strong></span>}
                        {wl.externalTeachingHours > 0 && <span>Luar: <strong className="text-amber-300">+{wl.externalTeachingHours} JP</strong></span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ROMBEL BREAKDOWN */}
          {activeTab === 'ROMBEL' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-300">
                  Rekapitulasi JTM Tiap Rombel (13 Kelas • Target 40 JP/rombel):
                </span>
                <span className="text-[11px] text-slate-400">
                  Total: {filledScheduleSlots} / {TOTAL_ROMBEL_TARGET_JP} JP ({scheduleFillPercent.toFixed(1)}%)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                {classes.map(c => {
                  const rombelData = rombelScheduleMap[c.id] || { filled: 0, target: 40, subjects: {} };
                  const isFull = rombelData.filled >= 40;
                  const deficit = Math.max(0, 40 - rombelData.filled);

                  return (
                    <div
                      key={c.id}
                      className={`p-3 rounded-xl border space-y-1.5 ${
                        isFull
                          ? 'bg-white/5 border-emerald-500/30'
                          : 'bg-white/5 border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-white">{c.id}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                          isFull
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                        }`}>
                          {isFull ? '40 JP (100%)' : `${rombelData.filled}/40 JP`}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400">
                        Wali Kelas: <strong className="text-slate-300 block truncate">{c.waliKelas || '-'}</strong>
                      </div>

                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${isFull ? 'bg-emerald-400' : 'bg-amber-400'}`}
                          style={{ width: `${Math.min(100, (rombelData.filled / 40) * 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>{Object.keys(rombelData.subjects).length} Mapel</span>
                        <span>{deficit === 0 ? 'Sisa: 0 JP' : `Sisa: -${deficit} JP`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: SUBJECTS BREAKDOWN */}
          {activeTab === 'SUBJECTS' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-purple-300">
                  Rekapitulasi Kebutuhan JTM Kurikulum Per Mata Pelajaran (13 Rombel):
                </span>
                <span className="text-[11px] text-slate-400">
                  Total Kurikulum: 520 JP
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {standardCurriculumSubjects.map(subj => {
                  const data = subjectScheduleMap[subj.name] || { filled: 0, teachers: new Set() };
                  const target = subj.totalTarget;
                  const filled = data.filled;
                  const deficit = Math.max(0, target - filled);
                  const isComplete = filled >= target;

                  return (
                    <div
                      key={subj.name}
                      className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-bold text-white truncate max-w-[160px]">{subj.name}</strong>
                        <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                          isComplete
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                        }`}>
                          {filled} / {target} JP
                        </span>
                      </div>

                      <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${isComplete ? 'bg-emerald-400' : 'bg-amber-400'}`}
                          style={{ width: `${Math.min(100, (filled / (target || 1)) * 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{subj.weeklyPerRombel} JP/rombel x 13 kelas</span>
                        <span className="text-emerald-300">{data.teachers.size} Guru Pengampu</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
