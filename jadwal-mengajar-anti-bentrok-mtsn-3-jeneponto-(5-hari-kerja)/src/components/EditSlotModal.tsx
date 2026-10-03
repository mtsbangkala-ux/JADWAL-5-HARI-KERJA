import React, { useState } from 'react';
import { X, AlertTriangle, ArrowLeftRight, Check, Trash2, Clock } from 'lucide-react';
import { ClassRoom, DayOfWeek, PeriodSlot, ScheduleCell, Teacher, WeeklySchedule } from '../types/schedule';
import { SUBJECT_CATEGORIES } from '../data/initialData';
import { getSubjectHoursOnDay, isBKTeacher } from '../utils/scheduler';

interface EditSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: DayOfWeek;
  period: number;
  periodLabel: string;
  classId: string;
  currentCell: ScheduleCell;
  schedule: WeeklySchedule;
  teachers: Teacher[];
  classes: ClassRoom[];
  onSave: (day: DayOfWeek, period: number, classId: string, cell: ScheduleCell) => void;
  onSwap: (
    dayA: DayOfWeek,
    periodA: number,
    classA: string,
    dayB: DayOfWeek,
    periodB: number,
    classB: string
  ) => void;
}

export const EditSlotModal: React.FC<EditSlotModalProps> = ({
  isOpen,
  onClose,
  day,
  period,
  periodLabel,
  classId,
  currentCell,
  schedule,
  teachers,
  classes,
  onSave,
  onSwap,
}) => {
  const [subject, setSubject] = useState(currentCell.subject || '');
  const [selectedKg, setSelectedKg] = useState<number>(currentCell.kg || 0);
  const [mode, setMode] = useState<'edit' | 'swap'>('edit');

  // Swap target state
  const [swapDay, setSwapDay] = useState<DayOfWeek>(day);
  const [swapPeriod, setSwapPeriod] = useState<number>(period === 1 ? 2 : 1);
  const [swapClassId, setSwapClassId] = useState<string>(classId);

  if (!isOpen) return null;

  // Check if selected teacher is busy at (day, period) in another class (Guru BK dikecualikan)
  const conflictingClasses: string[] = [];
  if (selectedKg > 0) {
    const teacherObj = teachers.find(t => t.kg === selectedKg);
    const isBK = teacherObj ? isBKTeacher(teacherObj) : false;
    if (!isBK) {
      const daySchedule = schedule[day];
      if (daySchedule && daySchedule[period]) {
        for (const [cls, cell] of Object.entries(daySchedule[period])) {
          if (cls !== classId && cell?.kg === selectedKg) {
            conflictingClasses.push(cls);
          }
        }
      }
    }
  }

  // Check daily limit for current subject in this class
  const existingDailyHours = subject ? getSubjectHoursOnDay(schedule, day, classId, subject.trim()) : 0;
  const isCurrentSlotThisSubject = currentCell.subject === subject.trim();
  const projectedDailyHours = isCurrentSlotThisSubject ? existingDailyHours : existingDailyHours + 1;
  const isDailyLimitExceeded = projectedDailyHours > 4;

  const handleTeacherChange = (kgVal: number) => {
    setSelectedKg(kgVal);
    const teacher = teachers.find(t => t.kg === kgVal);
    if (teacher && teacher.subjects.length > 0 && !subject) {
      setSubject(teacher.subjects[0]);
    }
  };

  const handleSave = () => {
    onSave(day, period, classId, {
      subject: subject.trim(),
      kg: Number(selectedKg),
    });
    onClose();
  };

  const handleExecuteSwap = () => {
    onSwap(day, period, classId, swapDay, swapPeriod, swapClassId);
    onClose();
  };

  const handleClear = () => {
    onSave(day, period, classId, { subject: '', kg: 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              Edit Jadwal Mengajar
            </span>
            <h3 className="text-base font-bold text-white">
              {day} • Jam Ke-{periodLabel} (Kelas {classId})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Edit or Swap */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setMode('edit')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              mode === 'edit'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Ubah Mata Pelajaran & Guru
          </button>
          <button
            onClick={() => setMode('swap')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              mode === 'swap'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Tukar Jadwal (Swap)</span>
          </button>
        </div>

        <div className="p-6">
          {mode === 'edit' ? (
            <div className="space-y-4">
              {/* Subject Input / Preset */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mata Pelajaran:
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Contoh: Matematika, IPA, Fiqhi..."
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                {/* Quick preset chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {SUBJECT_CATEGORIES.slice(0, 8).map(s => (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => setSubject(s.name)}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 border border-slate-200 transition-colors cursor-pointer"
                    >
                      {s.shortName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Teacher Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Guru Pengajar (Kode Guru / KG):
                </label>
                <select
                  value={selectedKg}
                  onChange={e => handleTeacherChange(Number(e.target.value))}
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
                >
                  <option value={0}>-- Belum Ditentukan (Kosong) --</option>
                  {teachers.map(t => (
                    <option key={t.kg} value={t.kg}>
                      KG {t.kg} - {t.name} ({t.subjects.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Conflict warning if teacher is booked */}
              {conflictingClasses.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-rose-900 text-xs">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-rose-700 font-bold">
                      PERINGATAN BENTROK JADWAL!
                    </strong>
                    Guru ini sudah mengajar di kelas{' '}
                    <span className="font-bold underline">{conflictingClasses.join(', ')}</span>{' '}
                    pada hari {day} Jam Ke-{periodLabel}. Menyimpan ini akan menyebabkan tabrakan jadwal.
                  </div>
                </div>
              )}

              {/* 4 JP Daily Limit Indicator / Warning */}
              {subject.trim() && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    isDailyLimitExceeded
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${isDailyLimitExceeded ? 'text-amber-600' : 'text-emerald-600'}`} />
                  <div>
                    <span className="font-bold block">
                      Batas Durasi Sehari: {subject} ({projectedDailyHours} JP pada hari {day})
                    </span>
                    <span className="text-[11px] block mt-0.5 opacity-90">
                      {isDailyLimitExceeded
                        ? `⚠️ Perhatian: Durasi ${subject} di kelas ${classId} pada hari ${day} menjadi ${projectedDailyHours} JP (melebihi batas rekomendasi 4 JP/hari).`
                        : `Aturan madrasah: Cukup maksimal 4 JP per mapel dalam sehari pada kelas yang sama (Saat ini: ${projectedDailyHours} JP).`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Swap Mode */
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Pilih slot jadwal lain untuk bertukar posisi secara langsung tanpa merusak struktur jam:
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hari:</label>
                  <select
                    value={swapDay}
                    onChange={e => setSwapDay(e.target.value as DayOfWeek)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="SENIN">Senin</option>
                    <option value="SELASA">Selasa</option>
                    <option value="RABU">Rabu</option>
                    <option value="KAMIS">Kamis</option>
                    <option value="JUMAT">Jumat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Ke-:</label>
                  <select
                    value={swapPeriod}
                    onChange={e => setSwapPeriod(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(p => (
                      <option key={p} value={p}>
                        Jam {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas:</label>
                  <select
                    value={swapClassId}
                    onChange={e => setSwapClassId(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview target slot */}
              {schedule[swapDay]?.[swapPeriod]?.[swapClassId] && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
                  <div className="text-slate-500 font-semibold mb-1">Isi Target Saat Ini:</div>
                  <div className="font-bold text-slate-800">
                    {schedule[swapDay][swapPeriod][swapClassId].subject || '(Kosong)'}
                  </div>
                  <div className="text-slate-600">
                    Kode Guru: KG {schedule[swapDay][swapPeriod][swapClassId].kg || '-'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan Slot</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>

            {mode === 'edit' ? (
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 text-xs px-4 py-2 font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExecuteSwap}
                className="inline-flex items-center gap-1.5 text-xs px-4 py-2 font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Tukar Slot Ini</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
