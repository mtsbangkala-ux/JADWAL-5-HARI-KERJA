import React, { useState, useMemo } from 'react';
import { Search, Filter, AlertCircle, Edit2, User, Eye, Info, Printer, Download, Sparkles } from 'lucide-react';
import { ClassRoom, DayOfWeek, PeriodSlot, ScheduleCell, SchoolInfo, Teacher, WeeklySchedule } from '../types/schedule';
import { DAY_PERIODS } from '../data/initialData';
import { getSubjectStyle } from '../utils/subjectColors';
import { PrintHeader, PrintFooter } from './PrintHeaderFooter';
import { calculateTeacherWorkload } from '../utils/scheduler';
import { exportToExcel } from '../utils/exportUtils';
import { JTMSummarySection } from './JTMSummarySection';
import { PieChart } from 'lucide-react';

interface MasterTimetableProps {
  schedule: WeeklySchedule;
  classes: ClassRoom[];
  teachers: Teacher[];
  schoolInfo: SchoolInfo;
  onCellClick: (day: DayOfWeek, period: number, periodLabel: string, classId: string, cell: ScheduleCell) => void;
  conflictingCells?: Set<string>; // set of "DAY-PERIOD-CLASSID"
}

export const MasterTimetable: React.FC<MasterTimetableProps> = ({
  schedule,
  classes,
  teachers,
  schoolInfo,
  onCellClick,
  conflictingCells = new Set(),
}) => {
  const [selectedKgFilter, setSelectedKgFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDayTab, setActiveDayTab] = useState<DayOfWeek | 'ALL'>('ALL');
  const [showJTMSummary, setShowJTMSummary] = useState<boolean>(false);

  const days: DayOfWeek[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
  const teacherMap = new Map<number, string>(teachers.map(t => [t.kg, t.name]));

  const daysToRender = activeDayTab === 'ALL' ? days : [activeDayTab];
  const workloads = useMemo(() => calculateTeacherWorkload(schedule, teachers), [schedule, teachers]);

  const handlePrint2Pages = () => {
    // Ensure all days are visible when printing
    setActiveDayTab('ALL');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportExcelPreview = () => {
    exportToExcel(schedule, schoolInfo, classes, teachers);
  };

  return (
    <div className="space-y-4">
      {/* =========================================================================
          PAGE 1 (PRINT & SCREEN): KOP RESMI & MATRIKS UTAMA 13 KELAS
          ========================================================================= */}
      
      {/* Print-only Header (Page 1 Kop) */}
      <PrintHeader
        schoolInfo={schoolInfo}
        title="JADWAL MATA PELAJARAN SEMESTER I (GANJIL)"
        subtitle="SISTEM 5 HARI KERJA (SENIN - JUMAT)"
      />

      {/* Screen Controls & Filters */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 print:hidden space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Day Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Hari:
            </span>
            <button
              onClick={() => setActiveDayTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeDayTab === 'ALL'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua (5 Hari)
            </button>
            {days.map(d => (
              <button
                key={d}
                onClick={() => setActiveDayTab(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeDayTab === d
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Quick Action Buttons for Export & Print PDF */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowJTMSummary(!showJTMSummary)}
              className={`inline-flex items-center gap-1.5 font-bold text-xs px-3.5 py-2 rounded-lg shadow-xs transition-all cursor-pointer ${
                showJTMSummary
                  ? 'bg-emerald-900 text-emerald-200 ring-2 ring-emerald-500'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
              title="Lihat Kesimpulan & Rekapitulasi JTM yang sudah terpenuhi vs sisa JTM"
            >
              <PieChart className="w-4 h-4 text-emerald-600" />
              <span>{showJTMSummary ? 'Tutup Kesimpulan JTM' : 'Kesimpulan Rekap JTM'}</span>
            </button>

            <button
              onClick={handleExportExcelPreview}
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-xs transition-all cursor-pointer"
              title="Download Jadwal ke Microsoft Excel (.xls) dengan format, warna, dan susunan sesuai pratinjau matriks"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel (Sesuai Pratinjau)</span>
            </button>

            <button
              onClick={handlePrint2Pages}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2 rounded-lg shadow-xs transition-all cursor-pointer"
              title="Cetak Jadwal ke format Landscape (Pas 2 Halaman PDF: Hal 1 Matriks, Hal 2 Beban Guru & Pengesahan)"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Cetak PDF (2 Hal. Landscape)</span>
            </button>
          </div>
        </div>

        {/* Search & Teacher Highlighter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-1">
            {/* Teacher highlight dropdown */}
            <div className="relative flex-1 sm:max-w-xs">
              <select
                value={selectedKgFilter}
                onChange={e => setSelectedKgFilter(Number(e.target.value))}
                className="w-full text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value={0}>✨ Sorot Jadwal Guru (Tampilkan Semua)</option>
                {teachers.map(t => (
                  <option key={t.kg} value={t.kg}>
                    KG {t.kg} - {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari Mapel / Guru..."
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
              />
            </div>
          </div>

          {selectedKgFilter > 0 && (
            <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <span>
                Sorot: <strong>KG {selectedKgFilter} - {teacherMap.get(selectedKgFilter)}</strong>
              </span>
              <button
                onClick={() => setSelectedKgFilter(0)}
                className="text-[11px] underline hover:text-emerald-950 font-bold cursor-pointer ml-2"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Expandable JTM Summary Section */}
      {showJTMSummary && (
        <div className="print:hidden animate-in fade-in zoom-in-95 duration-150">
          <JTMSummarySection
            schedule={schedule}
            teachers={teachers}
            classes={classes}
          />
        </div>
      )}

      {/* Main Matriks Table (Page 1) */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-300 overflow-hidden print:border-slate-800 print:shadow-none print:rounded-none">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[11px] sm:text-xs print-matrix-table">
            <thead>
              {/* Grand Header Row */}
              <tr className="bg-emerald-900 text-white font-bold tracking-wider text-center border-b border-emerald-950 print:bg-slate-900">
                <th className="py-2 px-1 w-12 border-r border-emerald-800/80 uppercase print:py-0.5 print:px-0.5 print:w-9">HR</th>
                <th className="py-2 px-1 w-10 border-r border-emerald-800/80 uppercase print:py-0.5 print:px-0.5 print:w-7">JAM</th>
                <th className="py-2 px-1 w-16 border-r border-emerald-800/80 uppercase text-[10px] print:text-[7pt] print:py-0.5 print:px-0.5 print:w-12">WAKTU</th>

                {/* Grade VII (5 classes) */}
                {classes.filter(c => c.grade === 'VII').map((c, idx) => (
                  <th key={c.id} colSpan={2} className={`py-1.5 px-1 bg-emerald-950/40 min-w-[120px] print:min-w-[55px] print:py-0.5 print:px-0.5 ${idx === 4 ? 'border-r-4 border-emerald-950 print:border-r-2 print:border-slate-900' : 'border-r-2 border-emerald-800/80'}`}>
                    KELAS {c.id}
                  </th>
                ))}

                {/* Grade VIII (4 classes) */}
                {classes.filter(c => c.grade === 'VIII').map((c, idx) => (
                  <th key={c.id} colSpan={2} className={`py-1.5 px-1 bg-emerald-950/20 min-w-[120px] print:min-w-[55px] print:py-0.5 print:px-0.5 ${idx === 3 ? 'border-r-4 border-emerald-950 print:border-r-2 print:border-slate-900' : 'border-r-2 border-emerald-800/80'}`}>
                    KELAS {c.id}
                  </th>
                ))}

                {/* Grade IX (4 classes) */}
                {classes.filter(c => c.grade === 'IX').map((c, idx) => (
                  <th key={c.id} colSpan={2} className={`py-1.5 px-1 min-w-[120px] print:min-w-[55px] print:py-0.5 print:px-0.5 ${idx === 3 ? 'border-r-0' : 'border-r-2 border-emerald-800/80'}`}>
                    KELAS {c.id}
                  </th>
                ))}
              </tr>

              {/* Sub-header with MAPEL and KG for each class */}
              <tr className="bg-emerald-800/90 text-white font-semibold text-[10px] text-center border-b-2 border-slate-400 print:bg-slate-800 print:text-[6.5pt]">
                <th className="py-1 px-1 border-r-2 border-emerald-700/80 print:py-0.5" colSpan={3}>KETERANGAN</th>
                {classes.map((c, cIdx) => {
                  const isLastInGrade = cIdx === 4 || cIdx === 8 || cIdx === 12;
                  const isLastClass = cIdx === classes.length - 1;
                  const kgHeaderBorder = isLastClass
                    ? 'border-r-0'
                    : isLastInGrade
                    ? 'border-r-4 border-emerald-950 print:border-r-2 print:border-slate-900'
                    : 'border-r-2 border-emerald-700/80';

                  return (
                    <React.Fragment key={c.id}>
                      <th className="py-1 px-1 border-r border-emerald-700/40 text-emerald-100 print:py-0.5 print:px-0.5">Mapel</th>
                      <th className={`py-1 px-0.5 w-8 text-amber-200 font-bold bg-emerald-900/60 print:w-6 print:py-0.5 ${kgHeaderBorder}`}>KG</th>
                    </React.Fragment>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {daysToRender.map(day => {
                const periods = DAY_PERIODS[day] || [];
                const hasUpacara = day === 'SENIN';
                const hasIstirahat1 = true;
                const hasIstirahat2 = day !== 'JUMAT';
                const dayTotalRows = periods.length + (hasUpacara ? 1 : 0) + (hasIstirahat1 ? 1 : 0) + (hasIstirahat2 ? 1 : 0);

                const DAY_HEADER_BG: Record<DayOfWeek, string> = {
                  SENIN: 'bg-emerald-900 text-white border-r-2 border-emerald-950',
                  SELASA: 'bg-teal-900 text-white border-r-2 border-teal-950',
                  RABU: 'bg-emerald-800 text-white border-r-2 border-emerald-900',
                  KAMIS: 'bg-slate-900 text-white border-r-2 border-slate-950',
                  JUMAT: 'bg-green-900 text-white border-r-2 border-green-950',
                };

                return (
                  <React.Fragment key={day}>
                    {/* UPACARA row for SENIN */}
                    {day === 'SENIN' && (
                      <tr className="bg-amber-100/80 text-amber-900 border-b border-amber-300 text-center font-bold tracking-widest text-xs print:bg-slate-200 print:text-[7pt]">
                        <td className={`py-1 px-1 ${DAY_HEADER_BG[day]} font-bold print:py-0.5`} rowSpan={dayTotalRows}>
                          <div className="rotate-180 [writing-mode:vertical-lr] py-2 text-center tracking-widest font-black print:py-1">
                            {day}
                          </div>
                        </td>
                        <td className="py-1 px-1 border-r border-slate-300 font-bold print:py-0.5">-</td>
                        <td className="py-1 px-1 border-r border-slate-300 text-[10px] font-mono print:text-[6.5pt] print:py-0.5">07.00 - 07.45</td>
                        <td colSpan={classes.length * 2} className="py-1 px-2 tracking-widest text-center uppercase font-black text-amber-950 print:py-0.5">
                          🇮🇩 U P A C A R A &nbsp;&nbsp; B E N D E R A 🇮🇩
                        </td>
                      </tr>
                    )}

                    {/* Periods of the day */}
                    {periods.map((p, pIndex) => {
                      const isIstirahat1 = (day === 'SENIN' && p.period === 5) || (day !== 'SENIN' && day !== 'JUMAT' && p.period === 5) || (day === 'JUMAT' && p.period === 4);
                      const isIstirahat2 = (day === 'SENIN' && p.period === 7) || (day !== 'SENIN' && day !== 'JUMAT' && p.period === 7);
                      const isLastPeriodOfDay = pIndex === periods.length - 1;

                      return (
                        <React.Fragment key={`${day}-${p.period}`}>
                          {/* Istirahat 1 Ribbon */}
                          {isIstirahat1 && (
                            <tr className="bg-slate-200/90 text-slate-800 border-y border-slate-300 text-center font-bold text-[10px] tracking-widest print:bg-slate-200 print:text-[6.8pt]">
                              <td className="py-0.5 px-1 border-r border-slate-300 print:py-0">-</td>
                              <td className="py-0.5 px-1 border-r border-slate-300 text-[9px] font-mono print:text-[6pt] print:py-0">
                                {day === 'JUMAT' ? '09.15 - 09.35' : '10.10 - 10.30'}
                              </td>
                              <td colSpan={classes.length * 2} className="py-0.5 text-center font-extrabold uppercase text-slate-700 tracking-widest print:py-0">
                                • • • &nbsp; ISTIRAHAT I & SHALAT DHUHA BERSAMA &nbsp; • • •
                              </td>
                            </tr>
                          )}

                          {/* Istirahat 2 (Dhuhur) Ribbon */}
                          {isIstirahat2 && (
                            <tr className="bg-emerald-100/80 text-emerald-900 border-y border-emerald-300 text-center font-bold text-[10px] tracking-widest print:bg-slate-200 print:text-[6.8pt]">
                              <td className="py-0.5 px-1 border-r border-slate-300 print:py-0">-</td>
                              <td className="py-0.5 px-1 border-r border-slate-300 text-[9px] font-mono print:text-[6pt] print:py-0">
                                {day === 'SENIN' ? '12.05 - 12.45' : '11.50 - 13.00'}
                              </td>
                              <td colSpan={classes.length * 2} className="py-0.5 text-center font-extrabold uppercase text-emerald-950 tracking-widest print:py-0">
                                🕌 &nbsp; ISHOMA (SHALAT DHUHUR BERJAMAAH & MAKAN SIANG) &nbsp; 🕌
                              </td>
                            </tr>
                          )}

                          {/* Normal Period Row */}
                          <tr className={`${isLastPeriodOfDay ? 'border-b-4 border-emerald-900 print:border-b-2 print:border-slate-900' : 'border-b border-slate-200 print:border-slate-300'} hover:bg-slate-50/70 transition-colors`}>
                            {/* Day name column for non-Senin */}
                            {day !== 'SENIN' && pIndex === 0 && (
                              <td
                                className={`py-1 px-1 ${DAY_HEADER_BG[day]} font-bold text-center print:py-0.5`}
                                rowSpan={dayTotalRows}
                              >
                                <div className="rotate-180 [writing-mode:vertical-lr] py-2 text-center tracking-widest font-black print:py-1">
                                  {day}
                                </div>
                              </td>
                            )}

                            {/* Jam Period Number */}
                            <td className="py-1 px-1 border-r border-slate-300 text-center font-bold text-slate-800 bg-slate-50 print:bg-slate-100 print:py-0.5 print:text-[7pt]">
                              {p.label}
                            </td>

                            {/* Period Time Range */}
                            <td className="py-1 px-0.5 border-r-2 border-slate-400 text-center text-[10px] text-slate-600 font-mono print:text-[6.2pt] print:py-0.5 whitespace-nowrap">
                              {p.startTime}-{p.endTime}
                            </td>

                            {/* Subject & Teacher Code for Each Class */}
                            {classes.map((c, cIdx) => {
                              const cell: ScheduleCell = schedule[day]?.[p.period]?.[c.id] || { subject: '', kg: 0 };
                              const isConflict = conflictingCells.has(`${day}-${p.period}-${c.id}`);
                              const isHighlightedTeacher = selectedKgFilter > 0 && cell.kg === selectedKgFilter;
                              const matchesSearch =
                                searchQuery &&
                                (cell.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  (cell.kg && teacherMap.get(cell.kg)?.toLowerCase().includes(searchQuery.toLowerCase())));

                              const style = getSubjectStyle(cell.subject);
                              const teacherName = cell.kg ? teacherMap.get(cell.kg) : '';

                              const isLastInGrade = cIdx === 4 || cIdx === 8 || cIdx === 12;
                              const isLastClass = cIdx === classes.length - 1;
                              const kgBorderRight = isLastClass
                                ? 'border-r-0'
                                : isLastInGrade
                                ? 'border-r-4 border-emerald-900 print:border-r-2 print:border-slate-900'
                                : 'border-r-2 border-slate-300 print:border-r-2 print:border-slate-600';

                              return (
                                <React.Fragment key={`${c.id}-${p.period}`}>
                                  {/* Subject Name Cell */}
                                  <td
                                    onClick={() => onCellClick(day, p.period, p.label, c.id, cell)}
                                    title={cell.kg ? `${cell.subject} - KG ${cell.kg} (${teacherName})` : 'Klik untuk edit'}
                                    className={`py-1 px-1 border-r border-slate-200 cursor-pointer transition-all print:py-0.5 print:px-0.5 print:bg-white ${
                                      isConflict
                                        ? 'bg-rose-100 text-rose-900 border-2 border-rose-500 font-bold animate-pulse'
                                        : isHighlightedTeacher
                                        ? 'bg-amber-200 text-amber-950 font-bold ring-2 ring-amber-500 ring-inset'
                                        : matchesSearch
                                        ? 'bg-yellow-200 text-yellow-950 font-bold'
                                        : style.bg
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-0.5">
                                      <span className={`truncate block text-[11px] leading-tight print:text-[6.8pt] print:text-black font-medium ${style.text}`}>
                                        {cell.subject || '-'}
                                      </span>
                                      {isConflict && (
                                        <AlertCircle className="w-2.5 h-2.5 text-rose-600 shrink-0 print:hidden" />
                                      )}
                                    </div>
                                  </td>

                                  {/* Teacher Code (KG) Cell */}
                                  <td
                                    onClick={() => onCellClick(day, p.period, p.label, c.id, cell)}
                                    title={`Kode Guru: ${cell.kg} (${teacherName || 'Kosong'})`}
                                    className={`py-1 px-0.5 w-8 text-center ${kgBorderRight} font-bold text-[11px] cursor-pointer print:w-6 print:py-0.5 print:text-[7pt] print:bg-white ${
                                      isConflict
                                        ? 'bg-rose-600 text-white font-extrabold'
                                        : isHighlightedTeacher
                                        ? 'bg-amber-600 text-white'
                                        : cell.kg > 0
                                        ? 'bg-slate-100 text-slate-800'
                                        : 'text-slate-300'
                                    }`}
                                  >
                                    {cell.kg > 0 ? cell.kg : '-'}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          PAGE BREAK (Ensures Page 1 is Matriks, Page 2 is Guru Legend & Signatures)
          ========================================================================= */}
      <div className="print-page-break print:block hidden my-0" />

      {/* =========================================================================
          PAGE 2 (PRINT & SCREEN): KETERANGAN KODE GURU & REKAP BEBAN MENGAJAR
          ========================================================================= */}

      {/* Page 2 Print Header (Kop Lampiran Halaman 2) */}
      <div className="hidden print:block text-center border-b-2 border-double border-slate-900 pb-1.5 mb-2">
        <div className="flex items-center justify-between px-3">
          <div className="text-left leading-tight">
            <div className="text-[8px] font-bold uppercase text-slate-600">{schoolInfo.type}</div>
            <div className="text-xs font-black uppercase text-slate-900">{schoolInfo.name}</div>
          </div>
          <div className="text-center">
            <h2 className="text-xs font-extrabold uppercase text-emerald-950">
              LAMPIRAN: KETERANGAN KODE GURU (KG) & REKAPITULASI BEBAN MENGAJAR
            </h2>
            <div className="text-[8.5px] font-semibold text-slate-700">
              SEMESTER {schoolInfo.semester} • TAHUN AJARAN {schoolInfo.academicYear} • SISTEM 5 HARI KERJA (SENIN - JUMAT)
            </div>
          </div>
          <div className="text-right text-[8.5px] font-bold text-slate-700 leading-tight">
            <div>HALAMAN 2 DARI 2</div>
            <div className="text-emerald-800">100% BEBAS BENTROK</div>
          </div>
        </div>
      </div>

      {/* Screen View: 4-Column Legend matching responsive layout */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-300 p-4 print:hidden space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 border-b border-emerald-800 pb-1.5 flex items-center justify-between">
          <span>KETERANGAN KODE GURU (KG) MTsN 3 JENEPONTO (38 GURU)</span>
          <span className="text-[11px] font-semibold text-slate-600">
            Total Siswa: {schoolInfo.totalStudents} orang • 5 Hari Kerja
          </span>
        </h4>

        {/* 4-Column Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-1.5 text-xs text-slate-800">
          {teachers.map(t => {
            const wl = workloads.find(w => w.teacher.kg === t.kg);
            return (
              <div
                key={t.kg}
                onClick={() => setSelectedKgFilter(selectedKgFilter === t.kg ? 0 : t.kg)}
                className={`flex items-center gap-1.5 py-1 px-1.5 rounded-lg transition-colors cursor-pointer text-[11px] border ${
                  selectedKgFilter === t.kg
                    ? 'bg-amber-100 text-amber-950 font-bold border-amber-400 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="w-5 h-5 rounded-md bg-emerald-800 text-white font-black flex items-center justify-center text-[10px] shrink-0">
                  {t.kg}
                </span>
                <div className="truncate flex-1">
                  <div className="font-bold text-slate-900 truncate leading-tight">{t.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{t.subjects.join(', ')}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-900 border border-emerald-200 px-1.5 py-0.2 rounded">
                    {wl?.totalCertifiedHours || 0} JP
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Screen Signature & Notes Box */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600 space-y-0.5 max-w-md">
            <div className="font-bold text-slate-800">Ketentuan 5 Hari Kerja:</div>
            <div>• Hari Senin: Upacara Bendera dimulai 07.00 WITA.</div>
            <div>• Hari Selasa - Kamis: Selesai pukul 15.00 WITA (9 JP).</div>
            <div>• Hari Jumat: Selesai pukul 10.55 WITA (5 JP, persiapan Sholat Jumat).</div>
          </div>

          <div className="text-center min-w-[240px] text-xs">
            <div className="text-slate-700">{schoolInfo.signatureCity}, {schoolInfo.signatureDate}</div>
            <div className="font-bold text-slate-800">{schoolInfo.headmasterTitle},</div>
            <div className="h-12 flex items-center justify-center">
              {schoolInfo.headmasterSignature ? (
                <img src={schoolInfo.headmasterSignature} alt="TTD Barcode Kepala Madrasah" className="max-h-12 max-w-[160px] object-contain my-0.5" />
              ) : (
                <span className="text-[10px] text-slate-400 italic">( Tanda Tangan & Cap )</span>
              )}
            </div>
            <div className="font-black text-slate-900 underline text-sm">{schoolInfo.headmasterName}</div>
            <div className="text-slate-600 text-[11px]">NIP. {schoolInfo.headmasterNip}</div>
          </div>
        </div>
      </div>

      {/* Print View: Structured Table for Page 2 (Lampiran Kode Guru & Rombel Diampu) */}
      <div className="hidden print:block space-y-2">
        <div className="border border-slate-800 rounded-none overflow-hidden">
          <table className="w-full border-collapse table-fixed text-[6.5pt] leading-tight">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-center border-b border-slate-800">
                <th className="py-1 px-1 border-r border-slate-700 w-[4%] text-center">KG</th>
                <th className="py-1 px-1 border-r border-slate-700 w-[20%] text-left">Nama Guru & Gelar</th>
                <th className="py-1 px-1 border-r border-slate-700 w-[17%] text-left">Mata Pelajaran</th>
                <th className="py-1 px-1 border-r border-slate-700 w-[23%] text-left">Rombel Diampu</th>
                <th className="py-1 px-1 border-r border-slate-700 w-[7%] text-center font-bold bg-slate-800">JTM</th>
                <th className="py-1 px-1 border-r border-slate-700 w-[17%] text-left">Tugas Tambahan</th>
                <th className="py-1 px-1 border-r border-slate-700 w-[6%] text-center font-bold bg-slate-800">Total</th>
                <th className="py-1 px-1 w-[6%] text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t, idx) => {
                const wl = workloads.find(w => w.teacher.kg === t.kg);
                const isOk = (wl?.totalCertifiedHours || 0) >= 24;

                let classesDisplay = '-';
                if (wl?.isBK) {
                  classesDisplay = 'Semua (13 Rombel)';
                } else if (wl && wl.classesTaught.length > 0) {
                  classesDisplay = wl.classesTaught.map(c => {
                    const jtm = wl.rombelJTM[c] || wl.scheduleRombelJTM[c];
                    return jtm ? `${c} (${jtm})` : c;
                  }).join(', ');
                }

                const dutyDisplay = wl?.internalDuty && wl?.externalTeachingSchool
                  ? `${wl.internalDuty} (${wl.internalDutyHours || 0} JP) + ${wl.externalTeachingSchool} (${wl.externalTeachingHours || 0} JP)`
                  : wl?.internalDuty
                  ? `${wl.internalDuty} (${wl.internalDutyHours || 0} JP)`
                  : wl?.externalTeachingSchool
                  ? `Luar: ${wl.externalTeachingSchool} (${wl.externalTeachingHours || 0} JP)`
                  : (t.additionalDuty || '-');

                return (
                  <tr key={t.kg} className={`border-b border-slate-300 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}`}>
                    <td className="py-0.5 px-1 border-r border-slate-300 text-center font-bold text-[7pt] align-middle">{t.kg}</td>
                    <td className="py-0.5 px-1 border-r border-slate-300 font-bold overflow-hidden text-ellipsis whitespace-nowrap align-middle text-[7pt] text-slate-900">{t.name}</td>
                    <td className="py-0.5 px-1 border-r border-slate-300 overflow-hidden text-ellipsis whitespace-nowrap align-middle text-[6.5pt] text-slate-800">{t.subjects.join(', ')}</td>
                    <td className="py-0.5 px-1 border-r border-slate-300 text-[6.5pt] overflow-hidden text-ellipsis whitespace-nowrap align-middle text-emerald-950 font-medium">{classesDisplay}</td>
                    <td className="py-0.5 px-1 border-r border-slate-300 text-center font-extrabold align-middle text-[7.5pt] text-slate-900 bg-slate-100/60">
                      {wl?.isBK ? '24' : wl?.teachingHours || 0}
                    </td>
                    <td className="py-0.5 px-1 border-r border-slate-300 text-[6.5pt] overflow-hidden text-ellipsis whitespace-nowrap align-middle text-slate-800" title={dutyDisplay}>
                      {dutyDisplay}
                    </td>
                    <td className="py-0.5 px-1 border-r border-slate-300 text-center font-black align-middle text-[7.5pt] text-emerald-900 bg-emerald-50/60">{wl?.totalCertifiedHours || 0} JP</td>
                    <td className="py-0.5 px-1 text-center font-bold text-[6pt] align-middle">
                      {isOk ? <span className="text-emerald-800 font-black">✓ 24 JP</span> : <span className="text-rose-700 font-bold">-{24 - (wl?.totalCertifiedHours || 0)}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Page 2 Signatures & Official Notes */}
        <div className="pt-2 border-t border-slate-400 flex items-start justify-between text-[7.5pt] leading-tight">
          <div className="space-y-0.5 max-w-sm">
            <div className="font-bold uppercase text-slate-900">Catatan Pelaksanaan 5 Hari Kerja:</div>
            <div>1. Hari Senin: Upacara Bendera dimulai pukul 07.00 WITA.</div>
            <div>2. Hari Selasa s/d Kamis: Pembelajaran 9 Jam Pelajaran berakhir pukul 15.00 WITA.</div>
            <div>3. Hari Jumat: Pembelajaran 5 Jam Pelajaran berakhir pukul 10.55 WITA (Persiapan Sholat Jumat).</div>
            <div>4. Jadwal diverifikasi 100% Bebas Bentrok (Zero Collisions Guarantee).</div>
          </div>

          <div className="text-center min-w-[200px]">
            <div>{schoolInfo.signatureCity}, {schoolInfo.signatureDate}</div>
            <div className="font-bold">{schoolInfo.headmasterTitle},</div>
            <div className="h-10 flex items-center justify-center">
              {schoolInfo.headmasterSignature ? (
                <img src={schoolInfo.headmasterSignature} alt="TTD Barcode Kepala Madrasah" className="max-h-10 max-w-[150px] object-contain my-0.5" />
              ) : (
                <span className="text-[7pt] text-slate-400 italic">( Tanda Tangan & Cap Madrasah )</span>
              )}
            </div>
            <div className="font-black underline text-[8.5pt]">{schoolInfo.headmasterName}</div>
            <div>NIP. {schoolInfo.headmasterNip}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
