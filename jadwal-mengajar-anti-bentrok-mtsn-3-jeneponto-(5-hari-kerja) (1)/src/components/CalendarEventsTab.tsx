import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  BookOpen,
  Sparkles,
  Clock,
  PieChart,
  CheckCircle2,
  Filter,
  TrendingUp,
} from 'lucide-react';
import { ClassRoom, DayOfWeek, Teacher, WeeklySchedule } from '../types/schedule';
import { DAYS } from '../utils/scheduler';

interface SchoolEvent {
  id: string;
  name: string;
  type: 'nasional' | 'sekolah' | 'acara_khusus';
  dateStr: string;
  dayOfWeek: DayOfWeek;
  impact: string;
  isKbmSuspended: boolean;
  compensationStrategy: string;
}

const DEFAULT_EVENTS: SchoolEvent[] = [
  {
    id: 'evt-1',
    name: 'Tahun Baru Hijriah 1448 H',
    type: 'nasional',
    dateStr: 'Jumat, 17 Juli 2026',
    dayOfWeek: 'JUMAT',
    impact: 'KBM Diliburkan',
    isKbmSuspended: true,
    compensationStrategy: 'Mata pelajaran dialokasikan ke penugasan mandiri terstruktur / e-learning.',
  },
  {
    id: 'evt-2',
    name: 'Proklamasi Kemerdekaan RI ke-81',
    type: 'nasional',
    dateStr: 'Senin, 17 Agustus 2026',
    dayOfWeek: 'SENIN',
    impact: 'Upacara Bendera Nasional & KBM Diliburkan',
    isKbmSuspended: true,
    compensationStrategy: 'Jam belajar dipadatkan pada pertemuan berikutnya dengan modul suplemen.',
  },
  {
    id: 'evt-3',
    name: 'Peringatan Maulid Nabi Muhammad SAW',
    type: 'nasional',
    dateStr: 'Senin, 14 September 2026',
    dayOfWeek: 'SENIN',
    impact: 'KBM Diliburkan Nasional',
    isKbmSuspended: true,
    compensationStrategy: 'Diskusi keagamaan mandiri mengenai sejarah dakwah Nabi via LMS.',
  },
  {
    id: 'evt-4',
    name: 'Peringatan Hari Besar Islam (PHBI) Maulid Nabi MTsN 3',
    type: 'acara_khusus',
    dateStr: 'Jumat, 11 September 2026',
    dayOfWeek: 'JUMAT',
    impact: 'KBM dialihkan untuk Tabligh Akbar & Lomba Keagamaan',
    isKbmSuspended: true,
    compensationStrategy: 'Penilaian praktik ibadah dan ceramah terintegrasi mapel PAI.',
  },
  {
    id: 'evt-5',
    name: 'Asesmen Nasional Berbasis Komputer (ANBK)',
    type: 'acara_khusus',
    dateStr: 'Senin - Kamis, 21-24 September 2026',
    dayOfWeek: 'SELASA', // Mewakili hari utama
    impact: 'KBM Kelas VIII dialihkan mandiri di rumah (Kombinasi ANBK)',
    isKbmSuspended: false,
    compensationStrategy: 'Blended learning mandiri terpandu untuk siswa yang tidak menjadi peserta ANBK.',
  },
  {
    id: 'evt-6',
    name: 'Class Meeting Ganjil & Penyerahan Rapor',
    type: 'sekolah',
    dateStr: 'Senin - Jumat, 14-18 Desember 2026',
    dayOfWeek: 'RABU',
    impact: 'Evaluasi & Kompetensi Akademik/Olahraga Siswa',
    isKbmSuspended: true,
    compensationStrategy: 'Konsolidasi capaian pembelajaran, bimbingan wali kelas, dan remedial efektif.',
  },
  {
    id: 'evt-7',
    name: 'Hari Amal Bakti (HAB) Kementerian Agama',
    type: 'acara_khusus',
    dateStr: 'Kamis, 17 Desember 2026',
    dayOfWeek: 'KAMIS',
    impact: 'Pentas Seni & Bakti Sosial MTsN 3 Jeneponto',
    isKbmSuspended: true,
    compensationStrategy: 'Penilaian projek P5-RA (Profil Pelajar Pancasila Rahmatan Lil Alamin).',
  },
];

interface CalendarEventsTabProps {
  schedule: WeeklySchedule;
  teachers: Teacher[];
  classes: ClassRoom[];
}

export const CalendarEventsTab: React.FC<CalendarEventsTabProps> = ({
  schedule,
  teachers,
  classes,
}) => {
  const [events, setEvents] = useState<SchoolEvent[]>(() => {
    try {
      const saved = localStorage.getItem('mtsn3_calendar_events_v1');
      return saved ? JSON.parse(saved) : DEFAULT_EVENTS;
    } catch {
      return DEFAULT_EVENTS;
    }
  });

  const [activeFilter, setActiveFilter] = useState<'semua' | 'nasional' | 'sekolah' | 'acara_khusus'>('semua');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'nasional' | 'sekolah' | 'acara_khusus'>('acara_khusus');
  const [newDateStr, setNewDateStr] = useState('');
  const [newDayOfWeek, setNewDayOfWeek] = useState<DayOfWeek>('SENIN');
  const [newImpact, setNewImpact] = useState('');
  const [newIsKbmSuspended, setNewIsKbmSuspended] = useState(true);
  const [newCompensation, setNewCompensation] = useState('');

  // Persist events
  useEffect(() => {
    localStorage.setItem('mtsn3_calendar_events_v1', JSON.stringify(events));
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'semua') return events;
    return events.filter(e => e.type === activeFilter);
  }, [events, activeFilter]);

  // Handler to add a new event
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newDateStr || !newImpact) {
      alert('Mohon lengkapi semua field utama!');
      return;
    }

    const defaultStrategy = newIsKbmSuspended
      ? 'Kompresi jam tatap muka dan pemberian modul penugasan terstruktur.'
      : 'Pemanfaatan penugasan mandiri terpandu.';

    const newEvent: SchoolEvent = {
      id: `evt-${Date.now()}`,
      name: newName,
      type: newType,
      dateStr: newDateStr,
      dayOfWeek: newDayOfWeek,
      impact: newImpact,
      isKbmSuspended: newIsKbmSuspended,
      compensationStrategy: newCompensation || defaultStrategy,
    };

    setEvents(prev => [...prev, newEvent]);
    setShowAddForm(false);
    // Reset form states
    setNewName('');
    setNewDateStr('');
    setNewImpact('');
    setNewCompensation('');
  };

  // Handler to delete an event
  const handleDeleteEvent = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus agenda/hari libur ini dari kalender akademik?')) {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  // Helper to reset to default events
  const handleResetToDefault = () => {
    if (confirm('Apakah Anda ingin memulihkan kalender agenda & hari libur bawaan MTsN 3 Jeneponto?')) {
      setEvents(DEFAULT_EVENTS);
    }
  };

  // CALCULATOR: Calculate lost hours per teacher based on their weekly schedule
  // We determine on which days of the week they are teaching and map them to KBM suspended events
  const teacherImpacts = useMemo(() => {
    const suspendedEvents = events.filter(e => e.isKbmSuspended);
    const result = teachers.map(t => {
      // Find on which days this teacher teaches and how many hours (JTM) per day
      const dailyHours: Record<DayOfWeek, number> = {
        SENIN: 0,
        SELASA: 0,
        RABU: 0,
        KAMIS: 0,
        JUMAT: 0,
      };

      for (const day of DAYS) {
        if (!schedule[day]) continue;
        for (const periodObj of Object.values(schedule[day])) {
          for (const cell of Object.values(periodObj)) {
            if (cell && cell.kg === t.kg) {
              dailyHours[day] += 1;
            }
          }
        }
      }

      // Calculate total hours lost across all suspended events
      let totalLostHours = 0;
      const affectedEventsList: Array<{ name: string; date: string; lost: number }> = [];

      for (const ev of suspendedEvents) {
        const lostOnDay = dailyHours[ev.dayOfWeek];
        if (lostOnDay > 0) {
          totalLostHours += lostOnDay;
          affectedEventsList.push({
            name: ev.name,
            date: ev.dateStr,
            lost: lostOnDay,
          });
        }
      }

      const originalTotalJtm = Object.values(dailyHours).reduce((a, b) => a + b, 0);
      const effectiveTotalJtm = Math.max(0, originalTotalJtm - totalLostHours);

      return {
        teacher: t,
        dailyHours,
        originalTotalJtm,
        totalLostHours,
        effectiveTotalJtm,
        affectedEventsList,
      };
    });

    // Sort by total hours lost descending so high-impacted teachers are highlighted first
    return result.sort((a, b) => b.totalLostHours - a.totalLostHours);
  }, [schedule, teachers, events]);

  const totalSchoolLostHours = useMemo(() => {
    return teacherImpacts.reduce((sum, item) => sum + item.totalLostHours, 0);
  }, [teacherImpacts]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5.5 h-5.5 text-emerald-700" />
              Kalender Agenda, Libur Nasional & Acara Madrasah
            </h2>
            <p className="text-xs text-slate-500">
              Kelola penanda hari libur nasional, libur sekolah, serta agenda besar madrasah untuk mengoptimalkan efektifitas tatap muka (KBM) guru.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetToDefault}
              className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all border border-slate-300 cursor-pointer"
            >
              Pulihkan Bawaan
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Agenda Baru</span>
            </button>
          </div>
        </div>

        {/* Global Impact Alert */}
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
          <Sparkles className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs text-emerald-950 space-y-1">
            <div className="font-extrabold">Sistem Optimalisasi Pembelajaran Efektif MTsN 3 Jeneponto</div>
            <div>
              Meskipun terdapat libur nasional & agenda madrasah, total estimasi jam belajar terselamatkan melalui strategi penyesuaian padat adalah sebanyak <strong className="text-emerald-900 font-extrabold font-mono tabular-nums">{Math.round(totalSchoolLostHours * 0.85)} JP</strong> dengan memanfaatkan media e-learning terstruktur Kemenag.
            </div>
          </div>
        </div>
      </div>

      {/* ADD AGENDA FORM */}
      {showAddForm && (
        <form
          onSubmit={handleAddEvent}
          className="bg-white rounded-xl shadow-xs border border-emerald-200 p-5 animate-in slide-in-from-top-4 duration-200 space-y-4"
        >
          <h3 className="text-sm font-bold text-emerald-950 border-b border-emerald-100 pb-1.5 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-700" /> Tambah Agenda Baru Ke Kalender Akademik
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Event Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Nama Agenda / Hari Libur *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Maulid Nabi Muhammad SAW"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800"
              />
            </div>

            {/* Event Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Kategori Agenda *</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="nasional">Hari Libur Nasional</option>
                <option value="sekolah">Hari Libur Sekolah</option>
                <option value="acara_khusus">Acara Khusus Madrasah</option>
              </select>
            </div>

            {/* Date string */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Tanggal Pelaksanaan *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Senin, 14 September 2026"
                value={newDateStr}
                onChange={e => setNewDateStr(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800"
              />
            </div>

            {/* Day of Week Map */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Hari Dalam Jadwal Terdampak *</label>
              <select
                value={newDayOfWeek}
                onChange={e => setNewDayOfWeek(e.target.value as DayOfWeek)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {DAYS.map(day => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Impact Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Dampak Terhadap KBM *</label>
              <input
                type="text"
                required
                placeholder="Contoh: KBM Diliburkan Nasional"
                value={newImpact}
                onChange={e => setNewImpact(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800"
              />
            </div>

            {/* KBM Suspended Switch */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Apakah KBM Normal Diliburkan?</label>
              <div className="flex items-center gap-3 h-9">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsKbmSuspended}
                    onChange={e => setNewIsKbmSuspended(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700"></div>
                  <span className="ml-2 text-xs font-semibold text-slate-700">
                    {newIsKbmSuspended ? 'Ya, Libur/Dialihkan' : 'Tidak, KBM Tetap Jalan'}
                  </span>
                </label>
              </div>
            </div>

            {/* Compensation Strategy */}
            <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
              <label className="text-xs font-bold text-slate-700 block">Strategi Pemadatan & Kompensasi Jam (Solusi Efektif)</label>
              <textarea
                rows={2}
                placeholder="Contoh: Pemberian penugasan mandiri terstruktur bertema hari besar via Google Classroom."
                value={newCompensation}
                onChange={e => setNewCompensation(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-300 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-xs cursor-pointer"
            >
              Simpan Agenda
            </button>
          </div>
        </form>
      )}

      {/* MIDDLE SECTION: MAIN CALENDAR LISTING & IMPACT ANALYSIS TAB SPLIT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* CALENDAR AGENDA GRID (LEFT - 7 COLUMNS) */}
        <div className="xl:col-span-7 space-y-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                Daftar Agenda & Hari Libur Ganjil TP 2026/2027
              </h3>

              {/* Filtering Toggles */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {(['semua', 'nasional', 'sekolah', 'acara_khusus'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-md capitalize transition-all cursor-pointer ${
                      activeFilter === filter
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter === 'acara_khusus' ? 'Acara Khusus' : filter}
                  </button>
                ))}
              </div>
            </div>

            {/* List of events */}
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Tidak ditemukan agenda akademik untuk filter terpilih.
                </div>
              ) : (
                filteredEvents.map(ev => {
                  // Style configurations
                  const typeColors = {
                    nasional: { border: 'border-rose-200 bg-rose-50/50', badge: 'text-rose-800 bg-rose-100/60', indicator: 'bg-rose-500' },
                    sekolah: { border: 'border-indigo-200 bg-indigo-50/50', badge: 'text-indigo-800 bg-indigo-100/60', indicator: 'bg-indigo-500' },
                    acara_khusus: { border: 'border-amber-200 bg-amber-50/50', badge: 'text-amber-800 bg-amber-100/60', indicator: 'bg-amber-500' },
                  };
                  const colors = typeColors[ev.type] || typeColors.acara_khusus;

                  return (
                    <div
                      key={ev.id}
                      className={`p-3.5 rounded-xl border ${colors.border} transition-all hover:shadow-xs relative group flex flex-col md:flex-row gap-3 items-start justify-between`}
                    >
                      {/* Left content block */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Categorization Indicator using text typography as per zero-pill discipline */}
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                            {ev.type === 'nasional' ? 'Libur Nasional' : ev.type === 'sekolah' ? 'Libur Sekolah' : 'Acara Madrasah'}
                          </span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <span className="text-xs font-black text-slate-800">{ev.dateStr}</span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                          {ev.name}
                        </h4>

                        <div className="text-xs space-y-1 text-slate-600">
                          <p className="flex items-start gap-1">
                            <span className="font-bold text-slate-700 shrink-0">Dampak KBM:</span>
                            <span>{ev.impact}</span>
                          </p>
                          <p className="flex items-start gap-1 p-2 bg-white/70 border border-slate-200/50 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-emerald-950 font-bold">Kompensasi:</strong> {ev.compensationStrategy}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Right Control Actions */}
                      <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 w-full md:w-auto border-t md:border-t-0 border-slate-200 pt-2.5 md:pt-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${colors.badge} text-center`}>
                          Terdampak: {ev.dayOfWeek}
                        </span>
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg md:self-end transition-colors cursor-pointer"
                          title="Hapus Agenda"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* AUTOMATED IMPACT CALCULATOR (RIGHT - 5 COLUMNS) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 space-y-3">
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1">
                <PieChart className="w-3.5 h-3.5 text-emerald-700" />
                Dampak Jam Mengajar (JTM) & Efektifitas Guru
              </h3>
              <p className="text-[11px] text-slate-500">
                Daftar guru yang jam mengajarnya paling terdampak oleh hari libur di semester ganjil, diurutkan dari dampak tertinggi.
              </p>
            </div>

            {/* Micro statistic boxes */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Total Jam Belajar</span>
                <span className="text-xl font-mono font-black text-slate-800 tabular-nums">
                  {teacherImpacts.reduce((sum, item) => sum + item.originalTotalJtm, 0)} JP
                </span>
              </div>
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-center">
                <span className="text-[10px] text-rose-500 block font-bold uppercase tracking-wider">Terdampak Libur</span>
                <span className="text-xl font-mono font-black text-rose-800 tabular-nums">
                  {totalSchoolLostHours} JP
                </span>
              </div>
            </div>

            {/* List of teacher workloads impacted */}
            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin">
              {teacherImpacts.map(({ teacher, originalTotalJtm, totalLostHours, effectiveTotalJtm, affectedEventsList }) => {
                if (originalTotalJtm === 0) return null;
                const isHighlyAffected = totalLostHours > 3;

                return (
                  <div
                    key={teacher.kg}
                    className={`p-3 rounded-lg border text-xs space-y-2 transition-all ${
                      isHighlyAffected
                        ? 'border-amber-200 bg-amber-50/30'
                        : 'border-slate-200 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-emerald-800 text-white font-black flex items-center justify-center text-[10px] shrink-0">
                          {teacher.kg}
                        </span>
                        <span className="font-extrabold text-slate-900 truncate">{teacher.name}</span>
                      </div>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded shrink-0 ${
                        totalLostHours > 0 ? 'bg-rose-100 text-rose-900' : 'bg-slate-100 text-slate-600'
                      }`}>
                        Hilang: {totalLostHours} JP
                      </span>
                    </div>

                    {/* Progress bar to visualize load comparison */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Efektifitas Tatap Muka:</span>
                        <span className="font-bold text-slate-800">
                          {originalTotalJtm - totalLostHours} dari {originalTotalJtm} JP ({Math.round(((originalTotalJtm - totalLostHours) / originalTotalJtm) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-emerald-600"
                          style={{ width: `${((originalTotalJtm - totalLostHours) / originalTotalJtm) * 100}%` }}
                        />
                        <div
                          className="h-full bg-rose-400"
                          style={{ width: `${(totalLostHours / originalTotalJtm) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Affected events details (Only if any) */}
                    {affectedEventsList.length > 0 && (
                      <div className="text-[10px] bg-white border border-slate-200/60 rounded p-1.5 text-slate-500 space-y-0.5">
                        <div className="font-bold text-slate-700">Agenda Penyebab:</div>
                        {affectedEventsList.map((aff, affIdx) => (
                          <div key={affIdx} className="flex items-center justify-between">
                            <span className="truncate max-w-[190px]">{aff.name}</span>
                            <span className="font-mono text-rose-700 font-bold">-{aff.lost} JP</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* COMPACT & EFFECTIVE COMPACTION POLICY GUIDE */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-xl shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5.5 h-5.5 text-emerald-300" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
            Kebijakan Kurikulum Darurat / Kompresi Jadwal Efektif
          </h3>
        </div>

        <p className="text-xs text-emerald-100/90 leading-relaxed">
          Guna menyiasati waktu belajar yang hilang tanpa perlu mengurangi hak belajar peserta didik, MTsN 3 Jeneponto menetapkan 3 Langkah Penyusunan Jadwal Padat & Efektif:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">1. Sinkronisasi Jam</span>
            <p className="leading-snug text-emerald-100">
              Guru diimbau memadatkan materi teoretis ke dalam format rangkuman digital PDF 3 hari sebelum libur tiba, sehingga tatap muka kelas difokuskan penuh pada sesi tanya-jawab/praktik.
            </p>
          </div>
          <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">2. Aliansi Tugas P5</span>
            <p className="leading-snug text-emerald-100">
              Kegiatan hari khusus (seperti Maulid Nabi atau ANBK) diintegrasikan langsung sebagai bagian penilaian proyek P5-RA, menghemat hingga 4 jam pelajaran evaluasi kurikuler reguler.
            </p>
          </div>
          <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 space-y-1.5">
            <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">3. Asesmen Berkelanjutan</span>
            <p className="leading-snug text-emerald-100">
              Ujian periodik dialihkan seluruhnya ke dalam platform e-learning Madrasah di luar jam sekolah utama, menjaga 100% alokasi tatap muka reguler tetap utuh tanpa terpotong sesi ujian tulis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
