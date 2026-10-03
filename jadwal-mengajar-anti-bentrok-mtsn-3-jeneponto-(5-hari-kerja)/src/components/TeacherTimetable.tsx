import React, { useState } from 'react';
import { UserCheck, Printer, Clock, BookOpen, Calendar, Award, Briefcase, HeartHandshake } from 'lucide-react';
import { DayOfWeek, PeriodSlot, SchoolInfo, Teacher, WeeklySchedule } from '../types/schedule';
import { DAY_PERIODS } from '../data/initialData';
import { getSubjectStyle } from '../utils/subjectColors';
import { isBKTeacher } from '../utils/scheduler';
import { PrintHeader, PrintFooter } from './PrintHeaderFooter';

interface TeacherTimetableProps {
  schedule: WeeklySchedule;
  teachers: Teacher[];
  schoolInfo: SchoolInfo;
}

export const TeacherTimetable: React.FC<TeacherTimetableProps> = ({
  schedule,
  teachers,
  schoolInfo,
}) => {
  const [selectedKg, setSelectedKg] = useState<number>(teachers[0]?.kg || 1);

  const teacher = teachers.find(t => t.kg === selectedKg) || teachers[0];
  const isBK = isBKTeacher(teacher);
  const days: DayOfWeek[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];

  // Calculate statistics for this teacher
  let teachingHours = 0;
  const classesTaught = new Set<string>();
  const activeDays = new Set<DayOfWeek>();
  const hoursPerDay: Record<DayOfWeek, number> = {
    SENIN: 0,
    SELASA: 0,
    RABU: 0,
    KAMIS: 0,
    JUMAT: 0,
  };

  for (const day of days) {
    const daySchedule = schedule[day] || {};
    for (const periodSchedule of Object.values(daySchedule)) {
      for (const [clsId, cell] of Object.entries(periodSchedule)) {
        if (cell && cell.kg === selectedKg) {
          teachingHours++;
          classesTaught.add(clsId);
          activeDays.add(day);
          hoursPerDay[day] = (hoursPerDay[day] || 0) + 1;
        }
      }
    }
  }

  // Handle BK defaults if no classroom teaching slots
  if (isBK && teachingHours === 0) {
    days.forEach(d => activeDays.add(d));
    hoursPerDay.SENIN = 5;
    hoursPerDay.SELASA = 5;
    hoursPerDay.RABU = 5;
    hoursPerDay.KAMIS = 5;
    hoursPerDay.JUMAT = 4;
  }

  const additionalHours = teacher.additionalDutyHours || 0;
  const effectiveTeachingHours = teacher.manualTeachingHours !== undefined && teacher.manualTeachingHours !== null
    ? teacher.manualTeachingHours
    : (isBK ? 24 : teachingHours);
  const totalCombinedHours = effectiveTeachingHours + additionalHours;
  const freeDays = isBK && teachingHours === 0 ? [] : days.filter(d => !activeDays.has(d));

  const handlePrintTeacher = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Print-only Header */}
      <PrintHeader
        schoolInfo={schoolInfo}
        title="KARTU JADWAL MENGAJAR GURU"
        subtitle={`KODE GURU ${teacher.kg}: ${teacher.name}`}
      />

      {/* Screen Controls */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              Pilih Guru MTsN 3 Jeneponto:
            </label>
            <select
              value={selectedKg}
              onChange={e => setSelectedKg(Number(e.target.value))}
              className="w-full text-sm font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
            >
              {teachers.map(t => (
                <option key={t.kg} value={t.kg}>
                  KG {t.kg} - {t.name} ({t.subjects.join(', ')})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrintTeacher}
            className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer self-start sm:self-end"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Kartu Jadwal Guru</span>
          </button>
        </div>
      </div>

      {/* Teacher Profile Card */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-xl shadow-sm p-5 border border-emerald-900 print:bg-none print:text-slate-900 print:border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-emerald-200 font-black text-xl shadow-inner print:border-slate-800 print:text-slate-900">
              KG {teacher.kg}
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
                Profil & Beban Mengajar Guru
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white print:text-slate-900">
                {teacher.name}
              </h2>
              <p className="text-xs text-emerald-100 print:text-slate-700">
                Mata Pelajaran: <strong>{teacher.subjects.join(', ')}</strong>
              </p>
              {isBK && (
                <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-300 text-emerald-950 font-black text-[11px] print:border print:border-slate-800">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    Guru BK: Otomatis 24 JP Layanan Bimbingan & Konseling Siswa
                  </span>
                </div>
              )}
              {teacher.additionalDuty && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[11px] print:border print:border-slate-800">
                    <Briefcase className="w-3 h-3" />
                    {teacher.additionalDuty} (+{teacher.additionalDutyHours || 0} JP)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-4 gap-2 w-full md:w-auto text-center">
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-2 border border-white/15 print:border-slate-300">
              <span className="text-[10px] text-emerald-200 block font-semibold print:text-slate-600">
                {isBK ? 'Layanan BK' : 'Tatap Muka'} {teacher.manualTeachingHours !== undefined ? '(Manual)' : isBK ? '(Otomatis)' : ''}
              </span>
              <span className="text-base font-black text-white print:text-slate-900">{effectiveTeachingHours} JP</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-2 border border-white/15 print:border-slate-300">
              <span className="text-[10px] text-teal-200 block font-semibold print:text-slate-600">Tugas Tambahan</span>
              <span className="text-base font-black text-teal-200 print:text-slate-900">+{additionalHours} JP</span>
            </div>
            <div className="bg-white/15 backdrop-blur-xs rounded-lg p-2 border border-white/25 print:border-slate-400">
              <span className="text-[10px] text-amber-200 block font-bold print:text-slate-600">Total Beban</span>
              <span className="text-base font-black text-amber-300 print:text-slate-900">{totalCombinedHours} JP</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-lg p-2 border border-white/15 print:border-slate-300">
              <span className="text-[10px] text-emerald-200 block font-semibold print:text-slate-600">Hari Aktif</span>
              <span className="text-base font-black text-white print:text-slate-900">{activeDays.size} Hari</span>
            </div>
          </div>
        </div>

        {/* Classes taught pills */}
        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-emerald-200 font-semibold print:text-slate-700">Kelas yang Diampu:</span>
          {Array.from(classesTaught).sort().map(c => (
            <span key={c} className="bg-white/20 px-2 py-0.5 rounded text-white font-bold text-[11px] print:border print:border-slate-400 print:text-slate-900">
              {c}
            </span>
          ))}
          {freeDays.length > 0 && (
            <span className="ml-auto text-[11px] text-emerald-200/90 font-medium print:text-slate-600">
              Hari Bebas: <strong className="text-white print:text-slate-900">{freeDays.join(', ')}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Weekly Schedule Grid for Teacher */}
      {isBK && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-emerald-950 flex items-start gap-3 print:border-slate-800 print:bg-none">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-emerald-900 block text-sm">
              Pedoman Tugas Guru Bimbingan Konseling (BK) MTsN 3 Jeneponto
            </span>
            <p className="text-emerald-800 mt-1 leading-relaxed">
              Sesuai regulasi Kemenag RI, Guru Bimbingan Konseling (BK) otomatis berstatus <strong>24 Jam Pelajaran (JP) per minggu</strong> (ekuivalensi membimbing peserta didik) tanpa jam tatap muka terjadwal pada rombel kelas. Pelayanan meliputi bimbingan klasikal, konseling individual, konseling kelompok, mediasi, dan kunjungan rumah (home visit).
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden print:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-emerald-900 text-white font-bold text-center border-b border-emerald-950 print:bg-slate-900">
                <th className="py-2.5 px-3 w-16 border-r border-emerald-800">JAM</th>
                <th className="py-2.5 px-3 w-28 border-r border-emerald-800">WAKTU</th>
                {days.map(d => (
                  <th key={d} className="py-2.5 px-3 border-r border-emerald-800 last:border-r-0">
                    <div>{d}</div>
                    <div className="text-[10px] font-normal text-emerald-200">
                      ({hoursPerDay[d]} JP)
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(periodNum => {
                const seninPeriod = (DAY_PERIODS['SENIN'] || []).find(p => p.period === periodNum);
                const periodLabel = seninPeriod?.label || (periodNum === 10 ? 'X' : String(periodNum));
                const periodTime = seninPeriod ? `${seninPeriod.startTime} - ${seninPeriod.endTime}` : '';

                return (
                  <tr key={periodNum} className="border-b border-slate-200 hover:bg-slate-50/60">
                    <td className="py-2 px-3 text-center font-bold text-slate-800 bg-slate-50 border-r border-slate-300">
                      {periodLabel}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-600 font-mono text-[11px] border-r border-slate-300">
                      {periodTime}
                    </td>

                    {/* Day slots */}
                    {days.map(day => {
                      const periods = DAY_PERIODS[day] || [];
                      const slotExists = periods.some(p => p.period === periodNum);

                      if (!slotExists) {
                        return (
                          <td
                            key={day}
                            className="py-2 px-3 border-r border-slate-200 text-center bg-slate-100 text-slate-400 italic text-[11px]"
                          >
                            -
                          </td>
                        );
                      }

                      // Find if this teacher is teaching in any class during (day, periodNum)
                      const daySlots = schedule[day]?.[periodNum] || {};
                      let teachingClass: string | null = null;
                      let subjectName = '';

                      for (const [cId, cell] of Object.entries(daySlots)) {
                        if (cell && cell.kg === selectedKg) {
                          teachingClass = cId;
                          subjectName = cell.subject;
                          break;
                        }
                      }

                      if (teachingClass) {
                        const style = getSubjectStyle(subjectName);
                        return (
                          <td
                            key={day}
                            className={`py-2 px-3 border-r border-slate-200 font-semibold ${style.bg}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-xs">
                                Kelas {teachingClass}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-800 text-white font-bold">
                                {subjectName}
                              </span>
                            </div>
                          </td>
                        );
                      }

                      // Special view for Guru BK with 0 classroom hours
                      if (isBK && teachingHours === 0) {
                        const isBKActiveSlot = (day !== 'JUMAT' && periodNum <= 5) || (day === 'JUMAT' && periodNum <= 4);
                        if (isBKActiveSlot) {
                          const serviceLabel =
                            periodNum === 1
                              ? 'Konseling Individual Siswa'
                              : periodNum === 2
                              ? 'Bimbingan Kelompok'
                              : periodNum === 3
                              ? 'Layanan Klasikal / Konsultasi'
                              : periodNum === 4
                              ? 'Administrasi & Rekam BK'
                              : 'Kunjungan Rumah / Home Visit';
                          return (
                            <td
                              key={day}
                              className="py-2 px-2.5 border-r border-slate-200 bg-emerald-50/40 text-emerald-950 font-medium text-[11px]"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold text-emerald-900 text-[10px] truncate" title={serviceLabel}>
                                  {serviceLabel}
                                </span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-200 text-emerald-900 font-black shrink-0">
                                  BK
                                </span>
                              </div>
                            </td>
                          );
                        }
                      }

                      return (
                        <td
                          key={day}
                          className="py-2 px-3 border-r border-slate-200 text-center text-slate-400 text-xs hover:bg-slate-50"
                        >
                          -
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature Box for Teacher Card */}
      <div className="hidden print:block mt-8 pt-4">
        <div className="flex justify-between items-end px-12 text-xs">
          <div className="text-center w-64">
            <div>Mengetahui,</div>
            <div className="font-semibold">{schoolInfo.headmasterTitle} MTsN 3 Jeneponto</div>
            <div className="h-16 flex items-center justify-center">
              {schoolInfo.headmasterSignature ? (
                <img src={schoolInfo.headmasterSignature} alt="TTD Barcode Kepala Madrasah" className="max-h-16 max-w-[180px] object-contain my-0.5" />
              ) : (
                <span className="text-[10px] text-slate-400 italic">( Tanda Tangan & Cap )</span>
              )}
            </div>
            <div className="font-bold underline text-sm">{schoolInfo.headmasterName}</div>
            <div>NIP. {schoolInfo.headmasterNip}</div>
          </div>

          <div className="text-center w-64">
            <div>{schoolInfo.signatureCity}, {schoolInfo.signatureDate}</div>
            <div className="font-semibold">Guru Pengajar,</div>
            <div className="h-16" />
            <div className="font-bold underline text-sm">{teacher.name}</div>
            <div>Kode Guru: KG {teacher.kg}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
