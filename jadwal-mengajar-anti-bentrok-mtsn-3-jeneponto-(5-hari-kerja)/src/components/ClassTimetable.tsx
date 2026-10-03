import React, { useState } from 'react';
import { Building, Printer, BookOpen, Layers, Check, Sparkles, FileText, Edit3, PlusCircle } from 'lucide-react';
import { ClassRoom, DayOfWeek, ScheduleCell, SchoolInfo, Teacher, WeeklySchedule } from '../types/schedule';
import { DAY_PERIODS } from '../data/initialData';
import { getSubjectStyle } from '../utils/subjectColors';
import { PrintHeader } from './PrintHeaderFooter';
import { ClassScheduleInputModal } from './ClassScheduleInputModal';

// Helper to resolve the assigned Wali Kelas for a given class from teacher duties or class data
export function getWaliKelasForClass(cls: ClassRoom, teachers: Teacher[]): string {
  const classCode = cls.id.replace('Kelas ', '').trim();
  const foundTeacher = teachers.find(t => {
    const duty = (t.internalDuty || t.additionalDuty || '').toLowerCase();
    return duty.includes(`wali kelas ${classCode.toLowerCase()}`) || duty.includes(`walikelas ${classCode.toLowerCase()}`);
  });
  if (foundTeacher) {
    return foundTeacher.name;
  }
  return cls.waliKelas || '-';
}

interface ClassTimetableProps {
  schedule: WeeklySchedule;
  classes: ClassRoom[];
  teachers: Teacher[];
  schoolInfo: SchoolInfo;
  onCellClick?: (
    day: DayOfWeek,
    period: number,
    periodLabel: string,
    classId: string,
    cell: ScheduleCell
  ) => void;
  onSaveBatch?: (
    classId: string,
    day: DayOfWeek,
    startPeriod: number,
    durationHours: number,
    cell: ScheduleCell
  ) => void;
  onClearClassSchedule?: (classId: string) => void;
  onClearAllSchedule?: () => void;
}

export const ClassTimetable: React.FC<ClassTimetableProps> = ({
  schedule,
  classes,
  teachers,
  schoolInfo,
  onCellClick,
  onSaveBatch,
  onClearClassSchedule,
  onClearAllSchedule,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'VII.A');
  const [printMode, setPrintMode] = useState<'SINGLE' | 'ALL'>('SINGLE');

  // Input Modal state
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState<DayOfWeek>('SENIN');
  const [modalPeriod, setModalPeriod] = useState<number>(1);

  const currentClass = classes.find(c => c.id === selectedClassId) || classes[0];
  const teacherMap = new Map<number, string>(teachers.map(t => [t.kg, t.name]));
  const days: DayOfWeek[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];

  // Helper function to get subject distribution for any given class
  const getClassSubjectDistribution = (classId: string) => {
    const subjectHours: Record<string, { hours: number; kg: number }> = {};
    for (const day of days) {
      const daySchedule = schedule[day] || {};
      for (const periodSchedule of Object.values(daySchedule)) {
        const cell = periodSchedule[classId];
        if (cell && cell.subject) {
          if (!subjectHours[cell.subject]) {
            subjectHours[cell.subject] = { hours: 0, kg: cell.kg };
          }
          subjectHours[cell.subject].hours++;
        }
      }
    }
    return subjectHours;
  };

  const currentClassSubjectHours = getClassSubjectDistribution(selectedClassId);

  // Trigger browser print dialog for current rombel or all rombel
  const handlePrint = (mode: 'SINGLE' | 'ALL' = 'SINGLE') => {
    setPrintMode(mode);
    // Allow state to update before opening print dialog
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Render a complete single class timetable layout (Used for screen and print)
  const renderClassContent = (cls: ClassRoom, isPrintOnly: boolean = false) => {
    const subjectHours = getClassSubjectDistribution(cls.id);
    const totalJp = Object.values(subjectHours).reduce((sum, item) => sum + item.hours, 0);
    const waliKelasName = getWaliKelasForClass(cls, teachers);

    return (
      <div key={cls.id} className={`${isPrintOnly ? 'print-page-break print:block hidden' : ''} space-y-3 print:space-y-1.5 print-single-page`}>
        {/* Print Kop / Header with Left & Right Logos */}
        <PrintHeader
          schoolInfo={schoolInfo}
          title={`JADWAL PELAJARAN KELAS ${cls.id} • SEMESTER ${schoolInfo.semester}`}
          subtitle="SISTEM 5 HARI KERJA (40 JP/MINGGU)"
        />

        {/* Class Banner Info (On-screen & Print header badge) */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-xl shadow-xs p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:bg-none print:bg-slate-100 print:text-slate-900 print:border-2 print:border-slate-800 print:p-1.5 print:my-0.5 print:rounded-md">
          <div className="flex items-center gap-3 print:gap-2">
            <div className="w-10 h-10 print:w-7 print:h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-lg print:text-xs print:bg-emerald-900 print:text-white shrink-0">
              {cls.id.replace('Kelas ', '')}
            </div>
            <div>
              <div className="flex items-center gap-2 print:gap-1.5">
                <span className="text-[10px] print:text-[8pt] font-black uppercase tracking-wider bg-emerald-700/80 px-2 py-0.5 print:px-1.5 print:py-0 rounded text-emerald-100 print:bg-slate-300 print:text-slate-900">
                  Rombongan Belajar
                </span>
                <span className="text-xs print:text-[8.5pt] font-bold text-emerald-200 print:text-slate-700">
                  Tingkat {cls.grade}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl print:text-xs font-black text-white print:text-slate-950 leading-tight uppercase tracking-tight">
                JADWAL KELAS {cls.id}
              </h2>
              <p className="text-xs print:text-[8pt] text-emerald-100 print:text-slate-800 font-semibold">
                Wali Kelas: <strong className="text-white print:text-slate-950 font-black">{waliKelasName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 print:gap-3">
            <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 print:px-2 print:py-0.2 rounded-lg border border-white/20 text-center print:border-slate-500 print:bg-white">
              <span className="text-[9px] print:text-[7pt] uppercase font-bold text-emerald-200 block print:text-slate-600">Alokasi Rombel</span>
              <span className="text-sm print:text-[9pt] font-black text-white print:text-slate-950">{totalJp || 40} JP / Minggu</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 print:px-2 print:py-0.2 rounded-lg border border-white/20 text-center print:border-slate-400 print:bg-white">
              <span className="text-[9px] print:text-[7pt] uppercase font-bold text-emerald-200 block print:text-slate-600">Total Mapel</span>
              <span className="text-sm print:text-[9pt] font-black text-white print:text-slate-950">{Object.keys(subjectHours).length} Mapel</span>
            </div>
          </div>
        </div>

        {/* Schedule Matrix Table */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-300 overflow-hidden print:border-2 print:border-slate-900 print:rounded-none">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-emerald-900 text-white font-bold text-center border-b border-emerald-950 print:bg-slate-900 print:text-white">
                <th className="py-1.5 px-2 print:py-0.5 print:px-1 w-14 border-r border-emerald-800 print:border-slate-700 text-[11px] print:text-[9.5pt] print:font-black">JAM</th>
                <th className="py-1.5 px-2 print:py-0.5 print:px-1 w-24 border-r border-emerald-800 print:border-slate-700 text-[11px] print:text-[9.5pt] print:font-black">WAKTU</th>
                {days.map((d, idx) => (
                  <th key={d} className={`py-1.5 px-2 print:py-0.5 print:px-1 text-[11px] print:text-[10pt] print:font-black print:tracking-wide ${idx === days.length - 1 ? 'border-r-0' : 'border-r-2 border-emerald-700 print:border-slate-600'}`}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(periodNum => {
                const isBreakAfter4 = periodNum === 4;
                const isBreakAfter6 = periodNum === 6;

                const ROMAN_LABELS: Record<number, string> = {
                  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
                  6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X'
                };
                const periodLabel = ROMAN_LABELS[periodNum] || String(periodNum);

                return (
                  <React.Fragment key={periodNum}>
                    <tr className="border-b border-slate-200 hover:bg-slate-50/70 print:border-slate-500">
                      <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-center font-bold text-slate-800 bg-slate-50 border-r-2 border-slate-300 print:bg-slate-100 print:border-slate-500 text-[11px] print:text-[9.5pt] print:font-black">
                        {periodLabel}
                      </td>
                      <td className="py-1.5 px-2 print:py-0.5 print:px-1 text-center text-slate-600 font-mono text-[10px] print:text-[8pt] print:font-bold border-r-2 border-slate-300 print:border-slate-500">
                        {(() => {
                          const pObj = DAY_PERIODS['SENIN']?.find(p => p.period === periodNum) || DAY_PERIODS['SELASA']?.find(p => p.period === periodNum);
                          return pObj ? `${pObj.startTime} - ${pObj.endTime}` : '-';
                        })()}
                      </td>

                      {/* Day cells */}
                      {days.map((day, dIdx) => {
                        const periods = DAY_PERIODS[day] || [];
                        const slotExists = periods.some(p => p.period === periodNum);
                        const isLastDay = dIdx === days.length - 1;
                        const dayBorder = isLastDay ? 'border-r-0' : 'border-r-2 border-slate-300 print:border-slate-500';

                        if (!slotExists) {
                          return (
                            <td
                              key={day}
                              className={`py-1.5 px-2 print:py-0.5 print:px-1 ${dayBorder} text-center bg-slate-100/70 text-slate-400 italic text-[10px] print:text-[9pt] print:font-bold`}
                            >
                              -
                            </td>
                          );
                        }

                        const cell = schedule[day]?.[periodNum]?.[cls.id] || { subject: '', kg: 0 };
                        const style = getSubjectStyle(cell.subject);
                        const teacherName = cell.kg ? teacherMap.get(cell.kg) : '';

                        if (cell.subject) {
                          return (
                            <td
                              key={day}
                              onClick={() => {
                                setModalDay(day);
                                setModalPeriod(periodNum);
                                setIsInputModalOpen(true);
                                if (onCellClick) {
                                  onCellClick(day, periodNum, periodLabel, cls.id, cell);
                                }
                              }}
                              title={`Klik untuk input/edit Guru, Mapel & Jam Pelajaran (${day} Jam Ke-${periodLabel})`}
                              className={`py-1.5 px-2 print:py-0.5 print:px-1 ${dayBorder} ${style.bg} print:bg-white cursor-pointer hover:ring-2 hover:ring-amber-500 hover:ring-inset transition-all`}
                            >
                              <div className="font-extrabold text-slate-900 text-[11px] print:text-[9.5pt] print:font-black leading-tight print:text-black flex items-center justify-between">
                                <span>{cell.subject}</span>
                                <Edit3 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 print:hidden" />
                              </div>
                              <div className="text-[10px] print:text-[8pt] text-slate-600 flex items-center justify-between mt-0.5 print:mt-0 print:text-slate-900 font-semibold">
                                <span className="truncate max-w-[130px] print:max-w-none font-bold">{teacherName || '-'}</span>
                                <span className="font-bold px-1 py-0.2 rounded bg-slate-200/90 text-slate-800 text-[9px] print:text-[8pt] print:font-black print:border print:border-slate-500 shrink-0 ml-1">
                                  KG {cell.kg}
                                </span>
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={day}
                            onClick={() => {
                              setModalDay(day);
                              setModalPeriod(periodNum);
                              setIsInputModalOpen(true);
                              if (onCellClick) {
                                onCellClick(day, periodNum, periodLabel, cls.id, cell);
                              }
                            }}
                            title={`Klik untuk isi slot Guru, Mapel & Jam (${day} Jam Ke-${periodLabel})`}
                            className={`py-1.5 px-2 print:py-0.5 print:px-1 ${dayBorder} text-center text-slate-400 text-xs print:text-[9pt] print:font-bold print:text-slate-400 cursor-pointer hover:bg-amber-100/50 hover:text-amber-900 transition-all font-semibold`}
                          >
                            -
                          </td>
                        );
                      })}
                    </tr>

                    {/* Break Row Indicator for Print & Screen */}
                    {isBreakAfter4 && (
                      <tr className="bg-amber-50/70 border-b border-amber-200 text-[10px] print:text-[8.5pt] font-bold text-amber-900 text-center print:bg-slate-100 print:border-slate-500 print:text-black print:font-black">
                        <td className="py-0.5 print:py-0.2 border-r border-amber-200 print:border-slate-500">☕</td>
                        <td className="py-0.5 print:py-0.2 font-mono text-[9px] print:text-[8pt] print:font-bold border-r border-amber-200 print:border-slate-500">10.10 - 10.30</td>
                        <td colSpan={5} className="py-0.5 print:py-0.2 tracking-wider uppercase">
                          ISTIRAHAT I & SHALAT DHUHA BERSAMA
                        </td>
                      </tr>
                    )}
                    {isBreakAfter6 && (
                      <tr className="bg-amber-50/70 border-b border-amber-200 text-[10px] print:text-[8.5pt] font-bold text-amber-900 text-center print:bg-slate-100 print:border-slate-500 print:text-black print:font-black">
                        <td className="py-0.5 print:py-0.2 border-r border-amber-200 print:border-slate-500">🕌</td>
                        <td className="py-0.5 print:py-0.2 font-mono text-[9px] print:text-[8pt] print:font-bold border-r border-amber-200 print:border-slate-500">11.50 - 13.00</td>
                        <td colSpan={5} className="py-0.5 print:py-0.2 tracking-wider uppercase">
                          ISHOMA (ISTIRAHAT, SHALAT DZUHUR BERJAMAAH & MAKAN SIANG)
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Lower Section: Subject Distribution & Signatures optimized for A4 Landscape */}
        <div className="grid grid-cols-1 lg:grid-cols-12 print:grid-cols-12 gap-3 print:gap-1.5 pt-1 print:pt-0">
          {/* Left Column: Subject Distribution Table (7 cols on print/lg) */}
          <div className="lg:col-span-7 print:col-span-7 bg-white rounded-xl shadow-xs border border-slate-200 p-3 print:border-2 print:border-slate-800 print:p-1.5 print:rounded-none">
            <h4 className="text-[11px] print:text-[8.5pt] font-black uppercase tracking-wider text-slate-800 mb-2 print:mb-0.5 flex items-center justify-between border-b border-slate-200 pb-1.5 print:pb-0.5 print:border-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-900 font-extrabold print:text-slate-950">
                <BookOpen className="w-3.5 h-3.5 print:w-3 print:h-3 text-emerald-700 print:text-slate-800" />
                Distribusi Mata Pelajaran & Guru Pengajar ({cls.id})
              </span>
              <span className="text-[10px] print:text-[8pt] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded print:text-slate-900 print:font-black">
                Total: {totalJp} JP
              </span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-3 gap-1 print:gap-0.5 text-[10px] print:text-[8pt]">
              {Object.entries(subjectHours).map(([subj, data]) => (
                <div key={subj} className="flex items-center justify-between p-1 print:p-0.5 rounded-lg bg-slate-50 border border-slate-200 print:bg-white print:border-slate-400">
                  <div className="truncate mr-1">
                    <div className="font-bold text-slate-900 truncate leading-tight text-[10px] print:text-[8pt] print:font-extrabold print:text-black">{subj}</div>
                    <div className="text-[9px] print:text-[7.5pt] text-slate-600 print:text-slate-800 print:font-semibold truncate">
                      {teacherMap.get(data.kg) || '-'} (KG {data.kg})
                    </div>
                  </div>
                  <span className="text-[9px] print:text-[7.5pt] font-black bg-emerald-100 text-emerald-950 px-1.5 py-0.5 print:px-1 print:py-0 rounded shrink-0 border border-emerald-300 print:border-slate-500 print:bg-slate-100 print:text-slate-950">
                    {data.hours} JP
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Official Signatures (5 cols on print/lg) */}
          <div className="lg:col-span-5 print:col-span-5 bg-white rounded-xl shadow-xs border border-slate-200 p-3 print:p-1.5 flex flex-col justify-between print:border-2 print:border-slate-800 print:rounded-none">
            <div className="text-center text-[10px] print:text-[8pt] text-slate-600 print:text-slate-900 font-bold mb-1 print:mb-0.5">
              {schoolInfo.signatureCity}, {schoolInfo.signatureDate}
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-[10px] print:text-[8pt] text-slate-800">
              {/* Kepala Madrasah */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="font-medium text-slate-600 print:text-slate-800 print:font-semibold">Mengetahui,</div>
                  <div className="font-bold print:font-extrabold">{schoolInfo.headmasterTitle}</div>
                </div>
                <div className="my-2 print:my-0.5 h-10 flex items-center justify-center">
                  {schoolInfo.headmasterSignature ? (
                    <img src={schoolInfo.headmasterSignature} alt="TTD Barcode Kepala Madrasah" className="max-h-10 max-w-[140px] object-contain my-0.5" />
                  ) : (
                    <span className="text-[9px] text-slate-400 italic print:hidden">( Tanda Tangan & Cap )</span>
                  )}
                </div>
                <div>
                  <div className="font-bold underline text-[11px] print:text-[9pt] print:font-black text-slate-950">{schoolInfo.headmasterName}</div>
                  <div className="text-[9px] print:text-[7.5pt] print:font-semibold text-slate-600 print:text-slate-800">NIP. {schoolInfo.headmasterNip}</div>
                </div>
              </div>

              {/* Wali Kelas */}
              <div className="flex flex-col justify-between border-l border-slate-200 pl-2 print:border-slate-400">
                <div>
                  <div className="font-medium text-slate-600 print:text-slate-800 print:font-semibold">Wali Kelas,</div>
                  <div className="font-bold print:font-extrabold">{cls.id}</div>
                </div>
                <div className="my-2 print:my-0.5 h-10 flex items-center justify-center">
                  <span className="text-[9px] text-slate-400 italic print:hidden">( Tanda Tangan )</span>
                </div>
                <div>
                  <div className="font-bold underline text-[11px] print:text-[9pt] print:font-black text-slate-950">{waliKelasName}</div>
                  <div className="text-[9px] print:text-[7.5pt] print:font-semibold text-slate-600 print:text-slate-800">NIP. .....................................</div>
                </div>
              </div>
            </div>

            <div className="mt-1 print:mt-0.5 pt-1 print:pt-0.5 border-t border-slate-200 print:border-slate-400 text-[9px] print:text-[7pt] text-slate-500 print:text-slate-700 text-center italic">
              Dicetak melalui Sistem Otomatis Jadwal MTsN 3 Jeneponto • 100% Bebas Bentrok
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Screen Controls & Navigation Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 print:hidden space-y-4">
        {/* Top bar with Title & Primary Print Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-700" />
              <span>Jadwal Pelajaran Per Kelas (Rombongan Belajar)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih rombel untuk melihat rincian jadwal, atau cetak laporan A4 Landscape per rombel.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setModalDay('SENIN');
                setModalPeriod(1);
                setIsInputModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-md active:scale-95"
              title="Input atau edit nama guru, mata pelajaran, dan waktu jam pelajaran pada rombel ini"
            >
              <PlusCircle className="w-4 h-4 text-amber-200" />
              <span>Input Guru, Mapel & Jam ({currentClass.id})</span>
            </button>

            {onClearClassSchedule && (
              <button
                onClick={() => onClearClassSchedule(currentClass.id)}
                className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs px-3 py-2.5 rounded-xl shadow-2xs transition-all cursor-pointer"
                title="Kosongkan seluruh slot jadwal untuk rombel yang sedang aktif ini"
              >
                <span>🧹 Reset {currentClass.id}</span>
              </button>
            )}

            {onClearAllSchedule && (
              <button
                onClick={onClearAllSchedule}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-800 border border-slate-300 font-bold text-xs px-3 py-2.5 rounded-xl shadow-2xs transition-all cursor-pointer"
                title="Kosongkan seluruh jadwal pada semua 13 kelas untuk diinput ulang secara manual"
              >
                <span>🗑️ Kosongkan Semua Jadwal</span>
              </button>
            )}

            <button
              onClick={() => handlePrint('SINGLE')}
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-md active:scale-95"
              title="Cetak jadwal kelas yang sedang aktif ke format kertas A4 Landscape"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Laporan Rombel ({currentClass.id})</span>
            </button>

            <button
              onClick={() => handlePrint('ALL')}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-md active:scale-95"
              title="Cetak seluruh 13 rombel sekaligus (1 rombel per halaman A4 landscape)"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Cetak Semua (13 Rombel)</span>
            </button>
          </div>
        </div>

        {/* Informative Banner */}
        <div className="bg-amber-50/80 border border-amber-200 text-amber-950 p-2.5 rounded-xl text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Info Sinkronisasi Otomatis:</strong> Hasil inputan jadwal perkelas ini akan <strong>otomatis langsung terhubung & sinkron 100%</strong> ke Matriks Utama, Kartu Guru, Laporan Cetak PDF, serta Audit Beban Kerja Guru.
          </span>
        </div>

        {/* Grade-grouped Rombel Selector Pills */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Pilih Rombongan Belajar (13 Kelas):</span>
            <span className="text-[11px] font-semibold text-emerald-800">
              Sedang Aktif: Kelas {currentClass.id} (Wali Kelas: {currentClass.waliKelas || '-'})
            </span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Tingkat VII */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-blue-800 block mb-1 uppercase tracking-wider">
                • Tingkat Kelas VII (5 Rombel):
              </span>
              <div className="flex flex-wrap gap-1">
                {classes.filter(c => c.grade === 'VII').map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedClassId === c.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50 hover:text-blue-900'
                    }`}
                  >
                    {selectedClassId === c.id && <Check className="w-3 h-3" />}
                    <span>{c.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tingkat VIII */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-amber-800 block mb-1 uppercase tracking-wider">
                • Tingkat Kelas VIII (4 Rombel):
              </span>
              <div className="flex flex-wrap gap-1">
                {classes.filter(c => c.grade === 'VIII').map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedClassId === c.id
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50 hover:text-amber-900'
                    }`}
                  >
                    {selectedClassId === c.id && <Check className="w-3 h-3" />}
                    <span>{c.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tingkat IX */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-emerald-800 block mb-1 uppercase tracking-wider">
                • Tingkat Kelas IX (4 Rombel):
              </span>
              <div className="flex flex-wrap gap-1">
                {classes.filter(c => c.grade === 'IX').map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedClassId === c.id
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-900'
                    }`}
                  >
                    {selectedClassId === c.id && <Check className="w-3 h-3" />}
                    <span>{c.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Display View (Current Selected Class) */}
      <div className="print:hidden">
        {renderClassContent(currentClass, false)}
      </div>

      {/* Print View: Either Single Active Rombel OR All 13 Rombel */}
      <div className="hidden print:block">
        {printMode === 'SINGLE' ? (
          renderClassContent(currentClass, false)
        ) : (
          classes.map(c => (
            <div key={c.id} className="print-page-break">
              {renderClassContent(c, false)}
            </div>
          ))
        )}
      </div>

      {/* Class Schedule Input Modal */}
      <ClassScheduleInputModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        initialClassId={selectedClassId}
        initialDay={modalDay}
        initialPeriod={modalPeriod}
        schedule={schedule}
        teachers={teachers}
        classes={classes}
        onSaveBatch={(clsId, d, startP, duration, cell) => {
          if (onSaveBatch) {
            onSaveBatch(clsId, d, startP, duration, cell);
          } else if (onCellClick) {
            // fallback for single cell save
            for (let p = startP; p < startP + duration; p++) {
              onCellClick(d, p, `Jam Ke-${p}`, clsId, cell);
            }
          }
        }}
        onClearSlot={(clsId, d, p) => {
          if (onSaveBatch) {
            onSaveBatch(clsId, d, p, 1, { subject: '', kg: 0 });
          }
        }}
      />
    </div>
  );
};
