import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, BookOpen, AlertTriangle, Check, Trash2, Building, Sparkles } from 'lucide-react';
import { ClassRoom, DayOfWeek, ScheduleCell, Teacher, WeeklySchedule } from '../types/schedule';
import { DAY_PERIODS } from '../data/initialData';
import { isBKTeacher } from '../utils/scheduler';

interface ClassScheduleInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClassId: string;
  initialDay?: DayOfWeek;
  initialPeriod?: number;
  schedule: WeeklySchedule;
  teachers: Teacher[];
  classes: ClassRoom[];
  onSaveBatch: (
    classId: string,
    day: DayOfWeek,
    startPeriod: number,
    durationHours: number,
    cell: ScheduleCell
  ) => void;
  onClearSlot?: (classId: string, day: DayOfWeek, period: number) => void;
}

export const ClassScheduleInputModal: React.FC<ClassScheduleInputModalProps> = ({
  isOpen,
  onClose,
  initialClassId,
  initialDay = 'SENIN',
  initialPeriod = 1,
  schedule,
  teachers,
  classes,
  onSaveBatch,
  onClearSlot,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(initialDay);
  const [startPeriod, setStartPeriod] = useState<number>(initialPeriod);
  const [durationHours, setDurationHours] = useState<number>(2); // Default 2 JP
  const [selectedKg, setSelectedKg] = useState<number>(0);
  const [subject, setSubject] = useState<string>('');

  // Sync state when props change
  useEffect(() => {
    if (isOpen) {
      setSelectedClassId(initialClassId);
      setSelectedDay(initialDay);
      setStartPeriod(initialPeriod);

      const existingCell = schedule[initialDay]?.[initialPeriod]?.[initialClassId];
      if (existingCell && existingCell.kg > 0) {
        setSelectedKg(existingCell.kg);
        setSubject(existingCell.subject || '');
      } else {
        setSelectedKg(0);
        setSubject('');
      }
    }
  }, [isOpen, initialClassId, initialDay, initialPeriod, schedule]);

  if (!isOpen) return null;

  const days: DayOfWeek[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
  const periodsForDay = DAY_PERIODS[selectedDay] || [];
  const maxPeriod = selectedDay === 'JUMAT' ? 6 : 10;

  // Handle teacher selection change
  const handleTeacherChange = (kgVal: number) => {
    setSelectedKg(kgVal);
    const foundTeacher = teachers.find(t => t.kg === kgVal);
    if (foundTeacher) {
      if (foundTeacher.subjects && foundTeacher.subjects.length > 0) {
        setSubject(foundTeacher.subjects[0]);
      }
    } else if (kgVal === 0) {
      setSubject('');
    }
  };

  // Conflict detection for selected range (Guru BK dikecualikan)
  const conflicts: { period: number; classId: string; teacherName: string }[] = [];
  if (selectedKg > 0) {
    const teacherObj = teachers.find(t => t.kg === selectedKg);
    const isBK = teacherObj ? isBKTeacher(teacherObj) : false;
    const teacherName = teacherObj?.name || `KG ${selectedKg}`;

    if (!isBK) {
      for (let p = startPeriod; p < startPeriod + durationHours; p++) {
        if (p > maxPeriod) continue;
        const daySchedule = schedule[selectedDay];
        if (daySchedule && daySchedule[p]) {
          for (const [cls, cell] of Object.entries(daySchedule[p])) {
            if (cls !== selectedClassId && cell?.kg === selectedKg) {
              conflicts.push({
                period: p,
                classId: cls,
                teacherName,
              });
            }
          }
        }
      }
    }
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || selectedKg === 0) {
      alert('Harap pilih Nama Guru dan Mata Pelajaran.');
      return;
    }

    onSaveBatch(
      selectedClassId,
      selectedDay,
      startPeriod,
      durationHours,
      {
        subject: subject.trim(),
        kg: Number(selectedKg),
      }
    );
    onClose();
  };

  const handleClearCurrent = () => {
    if (onClearSlot) {
      onClearSlot(selectedClassId, selectedDay, startPeriod);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 font-bold">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                Input & Penjadwalan Rombel
              </span>
              <h3 className="text-base font-black text-white">
                Input Nama Guru, Mapel & Jam Pelajaran
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Target Class Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-emerald-700" />
              <span>Target Rombongan Belajar (Kelas):</span>
            </label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="w-full text-sm font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  Kelas {c.id} (Wali Kelas: {c.waliKelas || '-'})
                </option>
              ))}
            </select>
          </div>

          {/* Day & Time Selection Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            {/* Day */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>Hari:</span>
              </label>
              <select
                value={selectedDay}
                onChange={e => {
                  const newDay = e.target.value as DayOfWeek;
                  setSelectedDay(newDay);
                  if (newDay === 'JUMAT' && startPeriod > 6) {
                    setStartPeriod(5);
                  }
                }}
                className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {days.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Period */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Jam Mula:</span>
              </label>
              <select
                value={startPeriod}
                onChange={e => setStartPeriod(Number(e.target.value))}
                className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {periodsForDay.map(p => (
                  <option key={p.period} value={p.period}>
                    Jam Ke-{p.period} ({p.startTime} - {p.endTime})
                  </option>
                ))}
              </select>
            </div>

            {/* Duration / Hours */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Durasi Jam (JP):</span>
              </label>
              <select
                value={durationHours}
                onChange={e => setDurationHours(Number(e.target.value))}
                className="w-full text-xs font-bold text-emerald-950 bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value={1}>1 JP (1 Jam Pelajaran)</option>
                <option value={2}>2 JP (2 Jam Pelajaran Berurutan)</option>
                <option value={3}>3 JP (3 Jam Pelajaran Berurutan)</option>
                <option value={4}>4 JP (4 Jam Pelajaran Berurutan)</option>
              </select>
            </div>
          </div>

          {/* Teacher Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-700" />
              <span>Nama Guru Pengajar:</span>
            </label>
            <select
              value={selectedKg}
              onChange={e => handleTeacherChange(Number(e.target.value))}
              className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value={0}>-- Pilih Guru Pengajar --</option>
              {teachers.map(t => (
                <option key={t.kg} value={t.kg}>
                  KG {t.kg} - {t.name} ({t.subjects.join(', ') || 'Tanpa Mapel Utama'})
                </option>
              ))}
            </select>
          </div>

          {/* Subject Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>Mata Pelajaran (Mapel):</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Contoh: Bahasa Indonesia, IPA, Matematika, Fiqhi..."
              className="w-full text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            {/* Quick subject chips */}
            {selectedKg > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-slate-500 font-semibold self-center">Preset Mapel Guru:</span>
                {teachers
                  .find(t => t.kg === selectedKg)
                  ?.subjects.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubject(s)}
                      className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-md border border-emerald-300 transition-colors cursor-pointer"
                    >
                      + {s}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Conflict Alert Warning Box */}
          {conflicts.length > 0 && (
            <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-rose-900 text-xs space-y-1 animate-in fade-in duration-150">
              <div className="font-extrabold flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Peringatan Bentrok Jadwal Guru!</span>
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5 text-rose-800">
                {conflicts.map((c, i) => (
                  <li key={i}>
                    <strong>{c.teacherName}</strong> sudah dijadwalkan mengajar di <strong>Kelas {c.classId}</strong> pada {selectedDay} Jam Ke-{c.period}.
                  </li>
                ))}
              </ul>
              <div className="text-[10px] text-rose-700 italic pt-1">
                Catatan: Anda tetap dapat menyimpan jika bermaksud menimpa atau memindahkan jadwal.
              </div>
            </div>
          )}

          {/* Summary Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Ringkasan Jadwal Yang Akan Disimpan:</div>
              <div className="text-[11px] text-emerald-900 mt-0.5">
                • Kelas: <strong>{selectedClassId}</strong> | Hari: <strong>{selectedDay}</strong>
                <br />
                • Waktu: <strong>Jam Ke-{startPeriod}</strong> {durationHours > 1 ? `s/d Jam Ke-${startPeriod + durationHours - 1}` : ''} ({durationHours} JP)
                <br />
                • Mapel: <strong>{subject || '(Belum dipilih)'}</strong> | Guru: <strong>{teachers.find(t => t.kg === selectedKg)?.name || 'Belum dipilih'}</strong>
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            {onClearSlot && (
              <button
                type="button"
                onClick={handleClearCurrent}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Slot Ini</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-slate-700 hover:bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-md active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Jadwal Rombel</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
