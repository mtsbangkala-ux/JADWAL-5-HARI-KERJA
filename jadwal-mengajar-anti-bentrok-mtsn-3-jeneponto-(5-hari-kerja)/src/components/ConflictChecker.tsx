import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Wand2,
  BarChart3,
  Calendar,
  Users,
  Search,
  ArrowUpDown,
  Briefcase,
  Award,
  Sparkles,
  Edit3,
  HelpCircle,
  PlusCircle,
  Filter,
  Check,
  RotateCcw,
  BookOpen,
  Clock,
  User,
  Sliders,
  School,
  Building2,
  Landmark,
  GraduationCap,
  HeartHandshake
} from 'lucide-react';
import { Conflict, DayOfWeek, SchoolInfo, Teacher, WeeklySchedule } from '../types/schedule';
import { calculateTeacherWorkload, DAYS, isBKTeacher } from '../utils/scheduler';
import { INTERNAL_DUTY_OPTIONS, EXTERNAL_SCHOOL_OPTIONS, ADDITIONAL_DUTY_OPTIONS, SUBJECT_CATEGORIES, INITIAL_CLASSES } from '../data/initialData';
import { JTMSummarySection } from './JTMSummarySection';

interface ConflictCheckerProps {
  conflicts: Conflict[];
  schedule: WeeklySchedule;
  teachers: Teacher[];
  schoolInfo: SchoolInfo;
  onAutoFix: () => void;
  onUpdateTeacher?: (
    kg: number,
    updated: Partial<Teacher>,
    options?: { syncScheduleSubject?: boolean; clearBKSchedule?: boolean }
  ) => void;
  onSyncAllToSchedule?: () => void;
  onSelectTeacher?: (kg: number) => void;
  onGoToMasterMatrix?: () => void;
}

export const ConflictChecker: React.FC<ConflictCheckerProps> = ({
  conflicts,
  schedule,
  teachers,
  schoolInfo,
  onAutoFix,
  onUpdateTeacher,
  onSyncAllToSchedule,
  onSelectTeacher,
  onGoToMasterMatrix,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dutyFilter, setDutyFilter] = useState<'ALL' | 'INTERNAL_DUTY' | 'EXTERNAL_DUTY' | 'MANUAL_ONLY' | '24_ELIGIBLE' | 'LESS_24' | 'GURU_BK' | 'CONFLICT_ONLY'>('ALL');
  const [sortBy, setSortBy] = useState<'kg' | 'hours' | 'teachingHours' | 'name'>('kg');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Comprehensive Edit Modal State
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formName, setFormName] = useState<string>('');
  const [formSubjects, setFormSubjects] = useState<string>('');
  const [formAssignedClasses, setFormAssignedClasses] = useState<string[]>([]);
  const [formIsBK, setFormIsBK] = useState<boolean>(false);
  const [isManualHoursMode, setIsManualHoursMode] = useState<boolean>(false);
  const [formTeachingHours, setFormTeachingHours] = useState<number>(0);
  const [formScheduleHours, setFormScheduleHours] = useState<number>(0);
  const [formRombelJTM, setFormRombelJTM] = useState<Record<string, number>>({});
  
  // Internal Duty Form States
  const [formInternalDuty, setFormInternalDuty] = useState<string>('');
  const [formInternalDutyHours, setFormInternalDutyHours] = useState<number>(0);
  const [selectedInternalPreset, setSelectedInternalPreset] = useState<string>('');
  
  // External School Form States
  const [formExternalSchool, setFormExternalSchool] = useState<string>('');
  const [formExternalHours, setFormExternalHours] = useState<number>(0);

  const [syncScheduleSubject, setSyncScheduleSubject] = useState<boolean>(true);
  const [clearBKSchedule, setClearBKSchedule] = useState<boolean>(true);
  const [customJpPerClass, setCustomJpPerClass] = useState<number | null>(null);

  const ALL_CLASSES_BY_GRADE = useMemo(() => ({
    VII: ['VII.A', 'VII.B', 'VII.C', 'VII.D', 'VII.E'],
    VIII: ['VIII.A', 'VIII.B', 'VIII.C', 'VIII.D'],
    IX: ['IX.A', 'IX.B', 'IX.C', 'IX.D'],
  }), []);

  const ALL_13_CLASSES = useMemo(() => [
    ...ALL_CLASSES_BY_GRADE.VII,
    ...ALL_CLASSES_BY_GRADE.VIII,
    ...ALL_CLASSES_BY_GRADE.IX,
  ], [ALL_CLASSES_BY_GRADE]);

  const workloads = calculateTeacherWorkload(schedule, teachers);
  const totalTeachingHours = workloads.reduce((sum, w) => sum + w.teachingHours, 0);
  const totalInternalDutyHours = workloads.reduce((sum, w) => sum + (w.internalDutyHours || 0), 0);
  const totalExternalDutyHours = workloads.reduce((sum, w) => sum + (w.externalTeachingHours || 0), 0);
  const totalAdditionalHours = totalInternalDutyHours + totalExternalDutyHours;
  const totalCombinedCertifiedHours = workloads.reduce((sum, w) => sum + w.totalCertifiedHours, 0);
  
  const teachersWithInternalDutyCount = workloads.filter(w => !!w.internalDuty).length;
  const teachersWithExternalDutyCount = workloads.filter(w => !!w.externalTeachingSchool || (w.externalTeachingHours || 0) > 0).length;
  const certifiedEligibleCount = workloads.filter(w => w.totalCertifiedHours >= 24).length;
  const manualHoursCount = teachers.filter(t => t.manualTeachingHours !== undefined && t.manualTeachingHours !== null).length;
  const bkTeacherCount = workloads.filter(w => w.isBK).length;

  const conflictingKgSet = useMemo(() => {
    return new Set(conflicts.map(c => c.kg));
  }, [conflicts]);
  const conflictingTeachersCount = conflictingKgSet.size;

  const filteredWorkloads = workloads.filter(w => {
    const matchesSearch =
      w.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.teacher.subjects.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (w.internalDuty && w.internalDuty.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (w.externalTeachingSchool && w.externalTeachingSchool.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (w.teacher.additionalDuty && w.teacher.additionalDuty.toLowerCase().includes(searchTerm.toLowerCase())) ||
      w.classesTaught.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (dutyFilter === 'MANUAL_ONLY') return w.isManualTeachingHours;
    if (dutyFilter === 'INTERNAL_DUTY') return !!w.internalDuty;
    if (dutyFilter === 'EXTERNAL_DUTY') return !!w.externalTeachingSchool || w.externalTeachingHours > 0;
    if (dutyFilter === '24_ELIGIBLE') return w.totalCertifiedHours >= 24;
    if (dutyFilter === 'LESS_24') return w.totalCertifiedHours < 24;
    if (dutyFilter === 'GURU_BK') return w.isBK;
    if (dutyFilter === 'CONFLICT_ONLY') return conflictingKgSet.has(w.teacher.kg);

    return true;
  });

  filteredWorkloads.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'kg') cmp = a.teacher.kg - b.teacher.kg;
    else if (sortBy === 'hours') cmp = a.totalCertifiedHours - b.totalCertifiedHours;
    else if (sortBy === 'teachingHours') cmp = a.teachingHours - b.teachingHours;
    else if (sortBy === 'name') cmp = a.teacher.name.localeCompare(b.teacher.name);
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  // Calculate schedule slots for the teacher currently being edited
  const editingTeacherScheduleSlots = useMemo(() => {
    if (!editingTeacher) return [];
    const slots: { day: DayOfWeek; period: number; classId: string; subject: string }[] = [];
    for (const day of DAYS) {
      if (!schedule[day]) continue;
      for (const p of Object.keys(schedule[day])) {
        const periodNum = Number(p);
        for (const [cls, cell] of Object.entries(schedule[day][periodNum] || {})) {
          if (cell && cell.kg === editingTeacher.kg) {
            slots.push({ day, period: periodNum, classId: cls, subject: cell.subject });
          }
        }
      }
    }
    return slots;
  }, [editingTeacher, schedule]);

  const editingTeacherClasses = useMemo(() => {
    const classCount: Record<string, number> = {};
    for (const s of editingTeacherScheduleSlots) {
      classCount[s.classId] = (classCount[s.classId] || 0) + 1;
    }
    return Object.entries(classCount).map(([cls, count]) => `${cls} (${count} JP)`);
  }, [editingTeacherScheduleSlots]);

  const editingTeacherConflicts = useMemo(() => {
    if (!editingTeacher) return [];
    return conflicts.filter(c => c.kg === editingTeacher.kg);
  }, [editingTeacher, conflicts]);

  const handleOpenEditModal = (t: Teacher) => {
    const wl = workloads.find(w => w.teacher.kg === t.kg);
    const schedHours = wl ? wl.scheduleTeachingHours : 0;
    const isBK = isBKTeacher(t);

    setEditingTeacher(t);
    setFormName(t.name);
    setFormSubjects(t.subjects.join(', '));
    setFormIsBK(isBK);
    setFormScheduleHours(schedHours);
    setSyncScheduleSubject(true);
    setClearBKSchedule(true);
    setCustomJpPerClass(null);

    // Initialize manual assigned classes
    const initialAssigned = (t.assignedClasses && Array.isArray(t.assignedClasses) && t.assignedClasses.length > 0)
      ? [...t.assignedClasses]
      : (wl ? [...wl.scheduleClassesTaught] : []);

    setFormAssignedClasses(initialAssigned);

    // Initialize rombelJTM
    const initialRombelJTM: Record<string, number> = {};
    const defaultJp = defaultEstimatedJpPerClass;
    for (const cls of ALL_13_CLASSES) {
      if (t.rombelJTM && t.rombelJTM[cls] !== undefined) {
        initialRombelJTM[cls] = t.rombelJTM[cls];
      } else if (wl && wl.scheduleRombelJTM[cls] !== undefined) {
        initialRombelJTM[cls] = wl.scheduleRombelJTM[cls];
      } else {
        initialRombelJTM[cls] = defaultJp;
      }
    }
    setFormRombelJTM(initialRombelJTM);

    if (t.manualTeachingHours !== undefined && t.manualTeachingHours !== null) {
      setIsManualHoursMode(true);
      setFormTeachingHours(t.manualTeachingHours);
    } else if (t.rombelJTM && Object.keys(t.rombelJTM).length > 0) {
      setIsManualHoursMode(true);
      const sum = initialAssigned.reduce((acc, c) => acc + (initialRombelJTM[c] ?? defaultJp), 0);
      setFormTeachingHours(sum);
    } else {
      setIsManualHoursMode(false);
      setFormTeachingHours(isBK ? 24 : schedHours);
    }

    // Initialize Internal Duty
    const isLegacyExt = t.additionalDuty && /mengajar\s+di\s+sekolah\s+lain/i.test(t.additionalDuty);
    const initInternalDuty = t.internalDuty || (!isLegacyExt ? (t.additionalDuty || '') : '');
    const initInternalHours = t.internalDutyHours ?? (!isLegacyExt ? (t.additionalDutyHours || 0) : 0);
    
    setFormInternalDuty(initInternalDuty);
    setFormInternalDutyHours(initInternalHours);
    setSelectedInternalPreset(initInternalDuty);

    // Initialize External School Teaching
    const initExtSchool = t.externalTeachingSchool || (isLegacyExt ? (t.additionalDuty || '') : '');
    const initExtHours = t.externalTeachingHours ?? (isLegacyExt ? (t.additionalDutyHours || 0) : 0);
    
    setFormExternalSchool(initExtSchool);
    setFormExternalHours(initExtHours);
  };

  const handleToggleAssignedClass = (classId: string) => {
    setFormAssignedClasses(prev => {
      let next: string[];
      if (prev.includes(classId)) {
        next = prev.filter(c => c !== classId);
      } else {
        next = [...prev, classId].sort((a, b) => ALL_13_CLASSES.indexOf(a) - ALL_13_CLASSES.indexOf(b));
      }
      // If manual mode, update total hours accordingly
      if (isManualHoursMode) {
        const sum = next.reduce((acc, c) => acc + (formRombelJTM[c] ?? activeJpPerClass), 0);
        setFormTeachingHours(sum);
      }
      return next;
    });
  };

  const handleSetRombelJTM = (classId: string, jtm: number) => {
    const val = Math.max(0, jtm);
    const nextRombelJTM = { ...formRombelJTM, [classId]: val };
    setFormRombelJTM(nextRombelJTM);

    // Auto-select class if not yet selected
    let nextAssigned = formAssignedClasses;
    if (!nextAssigned.includes(classId)) {
      nextAssigned = [...nextAssigned, classId].sort((a, b) => ALL_13_CLASSES.indexOf(a) - ALL_13_CLASSES.indexOf(b));
      setFormAssignedClasses(nextAssigned);
    }

    const sum = nextAssigned.reduce((acc, c) => acc + (nextRombelJTM[c] ?? defaultEstimatedJpPerClass), 0);
    setIsManualHoursMode(true);
    setFormTeachingHours(sum);
  };

  const handleSetAllRombelJTM = (jtm: number) => {
    const nextRombelJTM = { ...formRombelJTM };
    for (const c of formAssignedClasses) {
      nextRombelJTM[c] = jtm;
    }
    setFormRombelJTM(nextRombelJTM);
    setIsManualHoursMode(true);
    setFormTeachingHours(formAssignedClasses.length * jtm);
    setCustomJpPerClass(jtm);
  };

  const handleSelectAllClasses = () => {
    setFormAssignedClasses([...ALL_13_CLASSES]);
    if (isManualHoursMode) {
      const sum = ALL_13_CLASSES.reduce((acc, c) => acc + (formRombelJTM[c] ?? activeJpPerClass), 0);
      setFormTeachingHours(sum);
    }
  };

  const handleSelectGradeClasses = (grade: 'VII' | 'VIII' | 'IX') => {
    const gradeClasses = ALL_CLASSES_BY_GRADE[grade];
    setFormAssignedClasses(prev => {
      const merged = Array.from(new Set([...prev, ...gradeClasses]));
      const sorted = merged.sort((a, b) => ALL_13_CLASSES.indexOf(a) - ALL_13_CLASSES.indexOf(b));
      if (isManualHoursMode) {
        const sum = sorted.reduce((acc, c) => acc + (formRombelJTM[c] ?? activeJpPerClass), 0);
        setFormTeachingHours(sum);
      }
      return sorted;
    });
  };

  const handleClearAssignedClasses = () => {
    setFormAssignedClasses([]);
    if (isManualHoursMode) {
      setFormTeachingHours(0);
    }
  };

  const handleResetAssignedClassesToSchedule = () => {
    if (!editingTeacher) return;
    const wl = workloads.find(w => w.teacher.kg === editingTeacher.kg);
    const schedClasses = wl ? [...wl.scheduleClassesTaught] : [];
    setFormAssignedClasses(schedClasses);
    if (wl) {
      setFormRombelJTM({ ...wl.scheduleRombelJTM });
      setFormTeachingHours(wl.scheduleTeachingHours);
    }
  };

  // Helper to estimate JP based on primary subject & selected class count
  const defaultEstimatedJpPerClass = useMemo(() => {
    const s = formSubjects.toLowerCase();
    if (s.includes('indonesia')) return 6;
    if (s.includes('matematika') || s.includes('ipa') || s.includes('inggris')) return 4;
    if (s.includes('jasmani') || s.includes('pjok') || s.includes('penjas')) return 3;
    if (s.includes('btq')) return 1;
    return 2;
  }, [formSubjects]);

  const activeJpPerClass = customJpPerClass !== null ? customJpPerClass : defaultEstimatedJpPerClass;
  const currentCalculatedRombelSum = useMemo(() => {
    return formAssignedClasses.reduce((sum, cls) => sum + (formRombelJTM[cls] ?? activeJpPerClass ?? 2), 0);
  }, [formAssignedClasses, formRombelJTM, activeJpPerClass]);
  const estimatedTotalHours = formAssignedClasses.length * activeJpPerClass;

  const handleApplyEstimatedHours = () => {
    setIsManualHoursMode(true);
    setFormTeachingHours(currentCalculatedRombelSum);
  };

  const handleSaveModal = () => {
    if (!editingTeacher || !onUpdateTeacher) return;

    let subjectsArr = formSubjects
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // If BK checked, ensure Bimbingan Konseling is in subjects
    if (formIsBK && !subjectsArr.some(s => /bimbingan\s*konseling|^bk$/i.test(s))) {
      subjectsArr = ['Bimbingan Konseling', ...subjectsArr];
    }

    const internalDutyClean = formInternalDuty.trim();
    const internalHoursClean = internalDutyClean ? Math.max(0, Number(formInternalDutyHours) || 0) : 0;
    
    const externalSchoolClean = formExternalSchool.trim();
    const externalHoursClean = externalSchoolClean ? Math.max(0, Number(formExternalHours) || 0) : 0;
    
    const totalAddHours = internalHoursClean + externalHoursClean;
    
    const dutyDescriptions: string[] = [];
    if (internalDutyClean) dutyDescriptions.push(internalDutyClean);
    if (externalSchoolClean) {
      dutyDescriptions.push(`Mengajar di ${externalSchoolClean} (${externalHoursClean} JP)`);
    }

    const updated: Partial<Teacher> = {
      name: formName.trim() || editingTeacher.name,
      subjects: subjectsArr.length > 0 ? subjectsArr : editingTeacher.subjects,
      isBK: formIsBK,
      assignedClasses: formAssignedClasses,
      rombelJTM: formRombelJTM,
      internalDuty: internalDutyClean || undefined,
      internalDutyHours: internalHoursClean,
      externalTeachingSchool: externalSchoolClean || undefined,
      externalTeachingHours: externalHoursClean,
      additionalDuty: dutyDescriptions.length > 0 ? dutyDescriptions.join(' + ') : undefined,
      additionalDutyHours: totalAddHours,
    };

    if (isManualHoursMode) {
      updated.manualTeachingHours = Math.max(0, Number(formTeachingHours) || 0);
    } else {
      updated.manualTeachingHours = undefined;
    }

    onUpdateTeacher(editingTeacher.kg, updated, {
      syncScheduleSubject,
      clearBKSchedule,
    });
    setEditingTeacher(null);
  };

  const handleSelectInternalPreset = (presetName: string) => {
    setSelectedInternalPreset(presetName);
    if (!presetName) {
      setFormInternalDuty('');
      setFormInternalDutyHours(0);
      return;
    }
    const found = INTERNAL_DUTY_OPTIONS.find(o => o.name === presetName);
    if (found) {
      setFormInternalDuty(found.name);
      setFormInternalDutyHours(found.hours);
    }
  };

  const handleSelectExternalSchoolPreset = (schoolName: string, defaultHours?: number) => {
    setFormExternalSchool(schoolName);
    if (defaultHours !== undefined) {
      setFormExternalHours(defaultHours);
    } else if (formExternalHours === 0) {
      setFormExternalHours(6);
    }
  };

  const handleAddSubjectTag = (subjName: string) => {
    const current = formSubjects
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (!current.includes(subjName)) {
      current.push(subjName);
      setFormSubjects(current.join(', '));
    }
  };

  const handleResetAllManualHours = () => {
    if (!onUpdateTeacher) return;
    if (confirm('Apakah Anda yakin ingin mengembalikan jam tatap muka seluruh guru ke hitungan otomatis jadwal?')) {
      teachers.forEach(t => {
        if (t.manualTeachingHours !== undefined) {
          onUpdateTeacher(t.kg, { manualTeachingHours: undefined });
        }
      });
    }
  };

  // Preview calculations in modal
  const effectiveTeachingInModal = isManualHoursMode
    ? Number(formTeachingHours) || 0
    : (formIsBK ? 24 : formScheduleHours);
  const effectiveInternalDutyInModal = formInternalDuty.trim() ? (Number(formInternalDutyHours) || 0) : 0;
  const effectiveExternalDutyInModal = formExternalSchool.trim() ? (Number(formExternalHours) || 0) : 0;
  const totalCertifiedInModal = effectiveTeachingInModal + effectiveInternalDutyInModal + effectiveExternalDutyInModal;
  const isCertifiedInModal = totalCertifiedInModal >= 24;

  return (
    <div className="space-y-6">
      {/* Anti-Bentrok Status Certificate Card */}
      <div className={`rounded-2xl p-6 border shadow-xs transition-all ${
        conflicts.length === 0
          ? 'bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-950 text-white border-emerald-700'
          : 'bg-rose-50 border-rose-300 text-rose-950'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              conflicts.length === 0
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                : 'bg-rose-500/20 text-rose-600 border border-rose-400'
            }`}>
              {conflicts.length === 0 ? (
                <ShieldCheck className="w-9 h-9" />
              ) : (
                <AlertTriangle className="w-9 h-9 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                  conflicts.length === 0
                    ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-rose-200 text-rose-800'
                }`}>
                  Audit Validasi Penjadwalan & Beban Kerja 5 Hari Kerja
                </span>
                {manualHoursCount > 0 && (
                  <span className="text-[11px] font-bold bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                    {manualHoursCount} Jam Diatur Manual
                  </span>
                )}
              </div>
              <h2 className={`text-xl sm:text-2xl font-black mt-1 ${
                conflicts.length === 0 ? 'text-white' : 'text-rose-900'
              }`}>
                {conflicts.length === 0
                  ? 'Status: 100% Anti Bentrok Terverifikasi'
                  : `Ditemukan ${conflicts.length} Tabrakan Jadwal Mengajar!`}
              </h2>
              <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${
                conflicts.length === 0 ? 'text-emerald-100/90' : 'text-rose-700'
              }`}>
                {conflicts.length === 0
                  ? 'Tidak ada tabrakan jadwal mengajar. Anda dapat mengedit manual nama guru, mata pelajaran yang diampu, jam tatap muka, serta tugas tambahan (Wakamad, Wali Kelas, Ka Lab/Perpus, Pembina OSIM/Ekskul).'
                  : 'Terdapat guru yang mengajar di lebih dari satu kelas pada slot waktu bersamaan. Anda dapat memperbaiki otomatis menggunakan tombol di sebelah kanan.'}
              </p>
            </div>
          </div>

          {conflicts.length > 0 && (
            <button
              onClick={onAutoFix}
              className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <Wand2 className="w-4 h-4" />
              <span>Perbaiki Bentrok Otomatis</span>
            </button>
          )}
        </div>
      </div>

      {/* Conflict List Detail (if any) */}
      {conflicts.length > 0 && (
        <div className="bg-white rounded-xl shadow-xs border border-rose-200 p-5">
          <h3 className="text-sm font-bold text-rose-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Rincian Tabrakan Jadwal:
          </h3>
          <div className="divide-y divide-rose-100">
            {conflicts.map(c => (
              <div key={c.id} className="py-2.5 flex items-center justify-between text-xs text-slate-800">
                <div>
                  <span className="font-bold text-rose-800">
                    {c.day} • Jam Ke-{c.periodLabel}
                  </span>
                  <span className="mx-2 text-slate-400">|</span>
                  <span className="font-semibold text-slate-900">
                    KG {c.kg} ({c.teacherName})
                  </span>
                  <span className="text-slate-600 ml-2">
                    Tabrakan di: <strong className="text-rose-700">{c.classes.join(' & ')}</strong>
                  </span>
                </div>
                <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-0.5 rounded">
                  Bentrok {c.classes.length} Kelas
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            Tatap Muka (JTM)
          </span>
          <span className="text-xl font-black text-slate-800">{totalTeachingHours} JP</span>
          <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
            13 Rombel • {manualHoursCount > 0 ? `${manualHoursCount} manual` : 'Otomatis'}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-teal-600" />
            Intern Madrasah
          </span>
          <span className="text-xl font-black text-teal-700">+{totalInternalDutyHours} JP</span>
          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
            {teachersWithInternalDutyCount} Guru Mengemban
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <School className="w-3.5 h-3.5 text-amber-600" />
            Mengajar Sekolah Lain
          </span>
          <span className="text-xl font-black text-amber-700">+{totalExternalDutyHours} JP</span>
          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
            {teachersWithExternalDutyCount} Guru di Sekolah Mitra
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            Total Beban Sertifikasi
          </span>
          <span className="text-xl font-black text-indigo-900">{totalCombinedCertifiedHours} JP</span>
          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
            Rata-rata: {(totalCombinedCertifiedHours / (teachers.length || 1)).toFixed(1)} JP/guru
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Syarat Sertifikasi
          </span>
          <span className="text-xl font-black text-emerald-700">
            {certifiedEligibleCount} / {teachers.length}
          </span>
          <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
            Mencapai ≥ 24 JP
          </span>
        </div>
      </div>

      {/* Teacher Workload Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              Tabel Audit Beban Mengajar & Tugas Tambahan (38 Guru MTsN 3 Jeneponto)
            </h3>
            <p className="text-xs text-slate-500">
              Tugas tambahan dibedakan antara <strong className="text-teal-700">Tugas Intern Madrasah</strong> (Wakamad, Wali Kelas, Kepala Lab/Perpus, Pembina) dan <strong className="text-amber-700">Mengajar di Sekolah Lain</strong>.
            </p>
          </div>

          {/* Filter pills & search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
              <button
                onClick={() => setDutyFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
                  dutyFilter === 'ALL'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Semua ({teachers.length})
              </button>
              <button
                onClick={() => setDutyFilter('INTERNAL_DUTY')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                  dutyFilter === 'INTERNAL_DUTY'
                    ? 'bg-teal-800 text-white'
                    : 'bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100'
                }`}
                title="Tampilkan guru yang memiliki tugas tambahan intern madrasah"
              >
                <Building2 className="w-3 h-3 text-teal-600" />
                <span>Intern Madrasah ({teachersWithInternalDutyCount})</span>
              </button>
              <button
                onClick={() => setDutyFilter('EXTERNAL_DUTY')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                  dutyFilter === 'EXTERNAL_DUTY'
                    ? 'bg-amber-800 text-white'
                    : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`}
                title="Tampilkan guru yang mengajar di madrasah/sekolah lain"
              >
                <School className="w-3 h-3 text-amber-600" />
                <span>Sekolah Lain ({teachersWithExternalDutyCount})</span>
              </button>
              <button
                onClick={() => setDutyFilter('24_ELIGIBLE')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
                  dutyFilter === '24_ELIGIBLE'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Memenuhi ≥24 JP ({certifiedEligibleCount})
              </button>
              <button
                onClick={() => setDutyFilter('LESS_24')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
                  dutyFilter === 'LESS_24'
                    ? 'bg-rose-800 text-white'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                Kurang &lt;24 JP ({teachers.length - certifiedEligibleCount})
              </button>
              <button
                onClick={() => setDutyFilter('GURU_BK')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
                  dutyFilter === 'GURU_BK'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Guru Bimbingan Konseling (Otomatis 24 JP tanpa tatap muka)"
              >
                Guru BK ({bkTeacherCount})
              </button>
              {manualHoursCount > 0 && (
                <button
                  onClick={() => setDutyFilter('MANUAL_ONLY')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
                    dutyFilter === 'MANUAL_ONLY'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  }`}
                >
                  Manual JTM ({manualHoursCount})
                </button>
              )}
              {conflictingTeachersCount > 0 && (
                <button
                  onClick={() => setDutyFilter('CONFLICT_ONLY')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    dutyFilter === 'CONFLICT_ONLY'
                      ? 'bg-rose-700 text-white shadow-xs ring-2 ring-rose-400'
                      : 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300 animate-pulse'
                  }`}
                  title="Tampilkan hanya guru yang mengalami tabrakan jadwal mengajar"
                >
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>Bentrok ({conflictingTeachersCount})</span>
                </button>
              )}
            </div>

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Cari guru / mapel / tugas..."
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
              />
            </div>

            {onSyncAllToSchedule && (
              <button
                type="button"
                onClick={onSyncAllToSchedule}
                title="Sinkronkan seluruh nama mata pelajaran dan data guru ke Matriks Utama"
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 cursor-pointer shrink-0 transition-colors shadow-2xs"
              >
                <RotateCcw className="w-3 h-3 text-emerald-600" />
                <span>Sinkronkan ke Matriks</span>
              </button>
            )}

            {manualHoursCount > 0 && (
              <button
                onClick={handleResetAllManualHours}
                title="Kembalikan semua jam tatap muka ke hitungan jadwal asli"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1.5 rounded-lg border border-slate-300 cursor-pointer shrink-0 transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Reset Jam</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <th
                  onClick={() => {
                    if (sortBy === 'kg') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('kg'); setSortOrder('asc'); }
                  }}
                  className="py-2.5 px-2.5 w-12 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    <span>KG</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('name'); setSortOrder('asc'); }
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 min-w-[150px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Nama Guru</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-2.5 min-w-[140px]">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Mata Pelajaran</span>
                  </div>
                </th>
                <th className="py-2.5 px-2.5 min-w-[150px]">
                  <div className="flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Kelas & JTM</span>
                  </div>
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'teachingHours') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('teachingHours'); setSortOrder('desc'); }
                  }}
                  className="py-2.5 px-2 text-center cursor-pointer hover:bg-slate-100 min-w-[95px]"
                  title="Jam Tatap Muka Mengajar yang Diampu"
                >
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>JTM</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-2.5 min-w-[160px]">
                  <div className="flex items-center gap-1 text-teal-900">
                    <Building2 className="w-3.5 h-3.5 text-teal-700" />
                    <span>Tugas Intern Madrasah</span>
                  </div>
                </th>
                <th className="py-2.5 px-2.5 min-w-[150px]">
                  <div className="flex items-center gap-1 text-amber-900">
                    <School className="w-3.5 h-3.5 text-amber-700" />
                    <span>Mengajar di Sekolah Lain</span>
                  </div>
                </th>
                <th className="py-2.5 px-2 text-center text-teal-800" title="Total Ekuivalensi Jam Tugas Tambahan (Intern + Sekolah Lain)">
                  Ekuiv.
                </th>
                <th
                  onClick={() => {
                    if (sortBy === 'hours') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('hours'); setSortOrder('desc'); }
                  }}
                  className="py-2.5 px-2 text-center cursor-pointer hover:bg-slate-100"
                  title="Total Jam Bersertifikasi (Tatap Muka + Intern + Sekolah Lain)"
                >
                  <div className="flex items-center justify-center gap-1 font-extrabold text-slate-900">
                    <span>Total</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-2 text-center">Status 24 JP</th>
                <th className="py-2.5 px-2 text-center">Sen</th>
                <th className="py-2.5 px-2 text-center">Sel</th>
                <th className="py-2.5 px-2 text-center">Rab</th>
                <th className="py-2.5 px-2 text-center">Kam</th>
                <th className="py-2.5 px-2 text-center">Jum</th>
                <th className="py-2.5 px-3 text-center min-w-[95px]">Aksi Edit</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorkloads.map(wl => {
                const meetsStandard = wl.totalCertifiedHours >= 24;
                const internalDuty = wl.internalDuty;
                const internalHours = wl.internalDutyHours || 0;
                const externalSchool = wl.externalTeachingSchool;
                const externalHours = wl.externalTeachingHours || 0;
                const totalDutyHours = wl.additionalDutyHours || 0;
                const teacherRowConflicts = conflicts.filter(c => c.kg === wl.teacher.kg);
                const hasRowConflict = teacherRowConflicts.length > 0;

                return (
                  <tr
                    key={wl.teacher.kg}
                    className={`border-b transition-colors ${
                      hasRowConflict
                        ? 'bg-rose-50/80 border-rose-300 hover:bg-rose-100/70'
                        : 'border-slate-200 hover:bg-emerald-50/50'
                    }`}
                  >
                    <td className="py-2.5 px-2.5 font-bold text-center">
                      <span className={`w-6 h-6 rounded inline-flex items-center justify-center text-[11px] font-bold ${
                        hasRowConflict
                          ? 'bg-rose-600 text-white shadow-xs animate-pulse'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {wl.teacher.kg}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{wl.teacher.name}</span>
                        {wl.isBK && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                            Guru BK
                          </span>
                        )}
                        {hasRowConflict && (
                          <span className="text-[10px] bg-rose-600 text-white font-black px-1.5 py-0.2 rounded animate-pulse">
                            BENTROK ({teacherRowConflicts.length})
                          </span>
                        )}
                      </div>
                      {hasRowConflict && (
                        <div className="text-[10px] text-rose-800 font-bold mt-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>Tabrakan di: {teacherRowConflicts.map(c => `${c.day} Jam ${c.periodLabel} (${c.classes.join('&')})`).join('; ')}</span>
                        </div>
                      )}
                      {wl.isManualTeachingHours && (
                        <span className="text-[10px] text-amber-700 font-medium block">
                          JTM manual: {wl.teachingHours} JP
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2.5">
                      <div className="flex flex-wrap gap-1">
                        {wl.teacher.subjects.map(s => (
                          <span
                            key={s}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                              /bimbingan\s*konseling|^bk$/i.test(s)
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5">
                      {wl.isBK ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-2 py-0.5 rounded w-fit">
                            Semua Rombel (13 Kelas)
                          </span>
                          <span className="text-[9px] text-emerald-700 font-medium">
                            Layanan Konseling Siswa
                          </span>
                        </div>
                      ) : wl.classesTaught.length > 0 ? (
                        <div>
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {wl.classesTaught.map(cls => {
                              const jtm = wl.rombelJTM[cls] || wl.scheduleRombelJTM[cls];
                              return (
                                <span
                                  key={cls}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 ${
                                    cls.startsWith('VII.')
                                      ? 'bg-blue-50 text-blue-900 border-blue-200'
                                      : cls.startsWith('VIII.')
                                      ? 'bg-amber-50 text-amber-900 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                  }`}
                                >
                                  <span>{cls}</span>
                                  {jtm ? (
                                    <span className="font-extrabold opacity-85 text-[9px] bg-white/80 px-1 rounded">
                                      {jtm} JP
                                    </span>
                                  ) : null}
                                </span>
                              );
                            })}
                          </div>
                          <div className="mt-1 text-[9px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                            {wl.isManualClasses ? (
                              <span className="text-amber-800 font-bold bg-amber-50 border border-amber-200 px-1 rounded">
                                ✓ Manual ({wl.classesTaught.length} rombel)
                              </span>
                            ) : (
                              <span>{wl.classesTaught.length} rombel terjadwal</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">- Belum ada kelas -</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`font-extrabold text-sm ${wl.isBK ? 'text-emerald-800' : 'text-slate-900'}`}>
                          {wl.teachingHours} JP
                        </span>
                        {wl.isBK ? (
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded font-black bg-emerald-100 text-emerald-900 border border-emerald-300"
                            title="Otomatis 24 JP layanan Bimbingan Konseling peserta didik tanpa jam tatap muka kelas"
                          >
                            BK (24 JP)
                          </span>
                        ) : wl.isManualTeachingHours ? (
                          <span
                            className="text-[9px] px-1 py-0.2 rounded font-bold bg-amber-100 text-amber-900 border border-amber-300"
                            title={`Jam diatur manual: ${wl.teachingHours} JP (Jadwal riil: ${wl.scheduleTeachingHours} JP)`}
                          >
                            Manual ({wl.scheduleTeachingHours} JP)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            (jadwal)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 1: Tugas Intern Madrasah */}
                    <td className="py-2.5 px-2.5">
                      {internalDuty ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${
                            internalDuty.includes('Wakamad')
                              ? 'bg-purple-100 text-purple-900 border-purple-200'
                              : internalDuty.includes('Kepala')
                              ? 'bg-blue-100 text-blue-900 border-blue-200'
                              : internalDuty.includes('Wali Kelas')
                              ? 'bg-teal-100 text-teal-900 border-teal-200'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                          }`}>
                            <Building2 className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[150px]" title={internalDuty}>{internalDuty}</span>
                          </span>
                          <span className="text-[10px] font-black text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                            +{internalHours} JP
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Column 2: Mengajar di Sekolah Lain */}
                    <td className="py-2.5 px-2.5">
                      {externalSchool || externalHours > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            <School className="w-3 h-3 text-amber-700 shrink-0" />
                            <span className="truncate max-w-[150px]" title={externalSchool || 'Sekolah Lain'}>
                              {externalSchool || 'Sekolah Lain'}
                            </span>
                          </span>
                          <span className="text-[10px] font-black text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-300">
                            +{externalHours} JP
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>

                    {/* Total Ekuivalensi Tugas */}
                    <td className="py-2.5 px-2 text-center font-bold text-teal-800">
                      {totalDutyHours > 0 ? `+${totalDutyHours} JP` : '-'}
                    </td>

                    {/* Total Beban Sertifikasi */}
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-black ${
                        meetsStandard
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {wl.totalCertifiedHours} JP
                      </span>
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      {meetsStandard ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Memenuhi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold border border-amber-300" title={`Kurang ${24 - wl.totalCertifiedHours} JP untuk mencapai 24 JP sertifikasi`}>
                          Kurang {24 - wl.totalCertifiedHours} JP
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 font-mono text-[11px]">
                      {wl.isBK ? <span className="text-emerald-700 font-bold text-[10px]" title="Layanan Bimbingan Konseling Siswa (Senin 5 JP)">BK(5)</span> : (wl.hoursByDay.SENIN || '-')}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 font-mono text-[11px]">
                      {wl.isBK ? <span className="text-emerald-700 font-bold text-[10px]" title="Layanan Bimbingan Konseling Siswa (Selasa 5 JP)">BK(5)</span> : (wl.hoursByDay.SELASA || '-')}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 font-mono text-[11px]">
                      {wl.isBK ? <span className="text-emerald-700 font-bold text-[10px]" title="Layanan Bimbingan Konseling Siswa (Rabu 5 JP)">BK(5)</span> : (wl.hoursByDay.RABU || '-')}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 font-mono text-[11px]">
                      {wl.isBK ? <span className="text-emerald-700 font-bold text-[10px]" title="Layanan Bimbingan Konseling Siswa (Kamis 5 JP)">BK(5)</span> : (wl.hoursByDay.KAMIS || '-')}
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600 font-mono text-[11px]">
                      {wl.isBK ? <span className="text-emerald-700 font-bold text-[10px]" title="Layanan Bimbingan Konseling Siswa (Jumat 4 JP)">BK(4)</span> : (wl.hoursByDay.JUMAT || '-')}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleOpenEditModal(wl.teacher)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1.5 rounded-lg shadow-2xs cursor-pointer transition-colors active:scale-95"
                        title="Edit Manual: Nama Guru, Mapel, JTM Rombel, Tugas Intern Madrasah & Mengajar Sekolah Lain"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Edit Manual: Mapel, Jam yang Diampu & Tugas Tambahan */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-sm text-emerald-200 shadow-inner">
                  KG {editingTeacher.kg}
                </span>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 block">
                    Edit Manual Beban Guru MTsN 3 Jeneponto
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {editingTeacher.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setEditingTeacher(null)}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Conflict Alert in Modal */}
              {editingTeacherConflicts.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 space-y-1.5 animate-pulse">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Perhatian: Guru ini memiliki {editingTeacherConflicts.length} tabrakan jadwal pada Matriks Utama!</span>
                  </div>
                  <ul className="text-[11px] text-rose-800 space-y-0.5 pl-5 list-disc font-medium">
                    {editingTeacherConflicts.map((c: Conflict, i: number) => (
                      <li key={i}>
                        <strong>{c.day} Jam Ke-{c.periodLabel}</strong>: Tabrakan mengajar di rombel <strong>{c.classes.join(' & ')}</strong>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-rose-700 font-medium">
                    💡 Perubahan yang Anda simpan akan langsung disinkronkan ke Matriks Utama dan dicek otomatis bebas bentrok.
                  </p>
                </div>
              )}

              {/* Current Matrix Schedule Status */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">Jadwal Terpasang di Matriks Utama:</span>
                    <span className="text-[11px] text-slate-600">
                      {editingTeacherClasses.length > 0
                        ? `Mengajar di rombel: ${editingTeacherClasses.join(', ')}`
                        : 'Belum ada jadwal tatap muka di matriks kelas'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                  {formScheduleHours} JP Jadwal
                </span>
              </div>

              {/* Field 1: Nama Guru */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  Nama Lengkap Guru & Gelar:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Field 2: Mata Pelajaran yang Diampu */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                    Mata Pelajaran yang Diampu (Pisahkan dengan koma jika lebih dari 1):
                  </label>
                </div>
                <input
                  type="text"
                  value={formSubjects}
                  onChange={e => setFormSubjects(e.target.value)}
                  placeholder="Contoh: Matematika, IPA, Fiqhi"
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                {/* Quick Subject Chips */}
                <div className="mt-2">
                  <span className="text-[10px] text-slate-500 font-semibold block mb-1">
                    Klik untuk menambahkan mata pelajaran cepat:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      'Matematika',
                      'IPA',
                      'Bahasa Indonesia',
                      'Bahasa Inggris',
                      'Bahasa Arab',
                      'Al-Qur\'an Hadits',
                      'Aqidah Akhlak',
                      'Fiqhi',
                      'SKI',
                      'IPS',
                      'Pendidikan Pancasila / PKn',
                      'Penjaskes',
                      'Seni Budaya',
                      'Informatika',
                      'BTQ',
                      'Bimbingan Konseling'
                    ].map(subj => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => {
                          handleAddSubjectTag(subj);
                          if (subj === 'Bimbingan Konseling') {
                            setFormIsBK(true);
                          }
                        }}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 transition-colors cursor-pointer"
                      >
                        + {subj}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Guru BK (Bimbingan Konseling) - Otomatis 24 JP */}
              <div className={`p-4 rounded-xl border transition-all ${
                formIsBK
                  ? 'bg-emerald-50/90 border-emerald-400 shadow-xs'
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      formIsBK ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Status Guru Bimbingan Konseling (BK)</span>
                        {formIsBK && (
                          <span className="text-[10px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded-full">
                            Aktif 24 JP
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Guru BK otomatis dihitung <strong>24 JP penuh</strong> tanpa jam tatap muka terjadwal kelas (layanan konseling siswa).
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formIsBK}
                      onChange={e => {
                        const checked = e.target.checked;
                        setFormIsBK(checked);
                        if (checked) {
                          handleAddSubjectTag('Bimbingan Konseling');
                          if (!isManualHoursMode) {
                            setFormTeachingHours(24);
                          }
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                  </label>
                </div>

                {formIsBK && (
                  <div className="mt-2.5 pt-2.5 border-t border-emerald-200/80 text-[11px] text-emerald-900 bg-white/80 p-2.5 rounded-lg border border-emerald-300">
                    ✨ <strong>Status Guru BK Aktif:</strong> Berhak atas ekuivalensi <strong>24 Jam Pelajaran (JP)</strong> dari pelayanan bimbingan konseling kepada minimal 150 peserta didik, sehingga langsung memenuhi kuota tunjangan profesi guru/sertifikasi tanpa harus ada jam di kelas.
                  </div>
                )}
              </div>

              {/* Field 3: Berapa Jam yang Diampu (Jam Tatap Muka) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    Berapa Jam yang Diampu {formIsBK ? '(Layanan Konseling / Tatap Muka)' : '(Jam Tatap Muka Mengajar)'}:
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {formIsBK ? 'Layanan BK: ' : 'Jadwal Terpasang: '}
                    <strong>{formIsBK ? '24 JP (Otomatis)' : `${formScheduleHours} JP`}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    !isManualHoursMode
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="hoursMode"
                      checked={!isManualHoursMode}
                      onChange={() => setIsManualHoursMode(false)}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div>{formIsBK ? 'Otomatis Guru BK (24 JP)' : 'Otomatis dari Matriks Jadwal'}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {formIsBK
                          ? 'Otomatis 24 JP layanan BK tanpa tatap muka'
                          : <>Hitung murni dari slot jadwal: <strong>{formScheduleHours} JP</strong></>}
                      </div>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isManualHoursMode
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="hoursMode"
                      checked={isManualHoursMode}
                      onChange={() => setIsManualHoursMode(true)}
                      className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div>Atur Manual (Override)</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        Ketik sendiri jumlah jam yang diampu
                      </div>
                    </div>
                  </label>
                </div>

                {isManualHoursMode && (
                  <div className="pt-2 border-t border-slate-200 animate-in fade-in duration-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                        Jumlah Jam Mengajar (JP):
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={45}
                        value={formTeachingHours}
                        onChange={e => setFormTeachingHours(Number(e.target.value))}
                        className="w-24 text-sm font-black px-3 py-1.5 rounded-lg border border-emerald-500 bg-white text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-600">JP / minggu</span>
                    </div>

                    {/* Quick hour buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-500 font-medium">Pilihan Cepat:</span>
                      {[3, 6, 9, 12, 18, 20, 24, 28, 30, 32].map(hr => (
                        <button
                          key={hr}
                          type="button"
                          onClick={() => setFormTeachingHours(hr)}
                          className={`text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                            formTeachingHours === hr
                              ? 'bg-emerald-700 text-white'
                              : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {hr} JP
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setFormTeachingHours(formIsBK ? 24 : formScheduleHours);
                          setIsManualHoursMode(false);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer ml-auto"
                      >
                        Reset ke Standar ({formIsBK ? 24 : formScheduleHours} JP)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Field 4: Tugas Tambahan Intern Madrasah */}
              <div className="bg-slate-50 p-4 rounded-xl border border-teal-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-teal-700" />
                    1. Tugas Tambahan Intern Madrasah (Kemenag RI):
                  </label>
                  {formInternalDutyHours > 0 && (
                    <span className="text-[10px] font-black bg-teal-100 text-teal-900 border border-teal-300 px-2 py-0.5 rounded-full">
                      Intern: +{formInternalDutyHours} JP
                    </span>
                  )}
                </div>

                {/* Preset Dropdown */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Pilih Preset Tugas Standar Intern Madrasah:
                  </label>
                  <select
                    value={selectedInternalPreset}
                    onChange={e => handleSelectInternalPreset(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="">-- Tidak Ada / Kosongkan Tugas Intern --</option>
                    <optgroup label="WAKIL KEPALA MADRASAH (12 JP)">
                      {INTERNAL_DUTY_OPTIONS.filter(o => o.category === 'wakamad').map(o => (
                        <option key={o.name} value={o.name}>{o.name} (+{o.hours} JP)</option>
                      ))}
                    </optgroup>
                    <optgroup label="KEPALA LABORATORIUM & PERPUSTAKAAN (12 JP)">
                      {INTERNAL_DUTY_OPTIONS.filter(o => ['kepala_lab', 'kepala_perpus'].includes(o.category)).map(o => (
                        <option key={o.name} value={o.name}>{o.name} (+{o.hours} JP)</option>
                      ))}
                    </optgroup>
                    <optgroup label="WALI KELAS (6 JP)">
                      {INTERNAL_DUTY_OPTIONS.filter(o => o.category === 'wali_kelas').map(o => (
                        <option key={o.name} value={o.name}>{o.name} (+{o.hours} JP)</option>
                      ))}
                    </optgroup>
                    <optgroup label="PEMBINA OSIM, PRAMUKA & EKSTRAKURIKULER (3 - 6 JP)">
                      {INTERNAL_DUTY_OPTIONS.filter(o => o.category === 'pembina').map(o => (
                        <option key={o.name} value={o.name}>{o.name} (+{o.hours} JP)</option>
                      ))}
                    </optgroup>
                    <optgroup label="KOORDINATOR & GURU PIKET (2 - 4 JP)">
                      {INTERNAL_DUTY_OPTIONS.filter(o => ['koordinator', 'guru_piket'].includes(o.category)).map(o => (
                        <option key={o.name} value={o.name}>{o.name} (+{o.hours} JP)</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Custom / Editable Name & JP */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Nama Tugas Intern (Bisa Diketik Bebas):
                    </label>
                    <input
                      type="text"
                      value={formInternalDuty}
                      onChange={e => {
                        setFormInternalDuty(e.target.value);
                        setSelectedInternalPreset('');
                      }}
                      placeholder="Contoh: Wakamad Kurikulum, Pembina Pramuka"
                      className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Ekuivalensi (JP):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      value={formInternalDutyHours}
                      onChange={e => setFormInternalDutyHours(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full text-xs font-black px-2.5 py-1.5 rounded-lg border border-teal-400 bg-teal-50/50 text-center focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Quick JP Buttons for Internal Duty */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold">Pilihan JP Intern:</span>
                  {[2, 3, 4, 6, 12].map(jp => (
                    <button
                      key={jp}
                      type="button"
                      onClick={() => setFormInternalDutyHours(jp)}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer transition-colors shadow-2xs ${
                        formInternalDutyHours === jp
                          ? 'bg-teal-700 text-white'
                          : 'bg-white hover:bg-teal-50 text-teal-900 border border-teal-300'
                      }`}
                    >
                      +{jp} JP
                    </button>
                  ))}
                  {formInternalDuty && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormInternalDuty('');
                        setFormInternalDutyHours(0);
                        setSelectedInternalPreset('');
                      }}
                      className="text-[10px] px-2 py-0.5 rounded font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer ml-auto"
                    >
                      Kosongkan Intern
                    </button>
                  )}
                </div>
              </div>

              {/* Field 5: Mengajar di Sekolah / Madrasah Lain */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-300 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <School className="w-4 h-4 text-amber-700" />
                    2. Tugas Tambahan: Mengajar di Sekolah Lain:
                  </label>
                  {formExternalHours > 0 && (
                    <span className="text-[10px] font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full border border-amber-400">
                      Sekolah Lain: +{formExternalHours} JP
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-amber-900">
                  Untuk guru yang mengajar di madrasah/sekolah lain (non-satminkal / satminkal luar) guna pemenuhan 24 JP sertifikasi.
                </p>

                {/* Preset Partner Schools */}
                <div>
                  <span className="text-[10px] font-bold text-amber-900 block mb-1">
                    Pilihan Cepat Madrasah / Sekolah Mitra:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {EXTERNAL_SCHOOL_OPTIONS.map(sch => {
                      const isActive = formExternalSchool === sch.name;
                      return (
                        <button
                          key={sch.name}
                          type="button"
                          onClick={() => handleSelectExternalSchoolPreset(sch.name, sch.hours)}
                          className={`text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1 ${
                            isActive
                              ? 'bg-amber-700 text-white shadow-xs ring-1 ring-amber-800'
                              : 'bg-white hover:bg-amber-100 text-amber-950 border border-amber-300'
                          }`}
                        >
                          <School className="w-3 h-3 shrink-0" />
                          <span>{sch.name} (+{sch.hours} JP)</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom School Name & Hours Input */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Nama Madrasah / Sekolah Lain (Bisa Diketik):
                    </label>
                    <input
                      type="text"
                      value={formExternalSchool}
                      onChange={e => setFormExternalSchool(e.target.value)}
                      placeholder="Contoh: MA Baburrahim Bangkala, SMPN 1 Bangkala"
                      className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                      Jam Mengajar (JP):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      value={formExternalHours}
                      onChange={e => setFormExternalHours(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full text-xs font-black px-2.5 py-1.5 rounded-lg border border-amber-400 bg-white text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Quick JP Buttons for External School */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-600 font-semibold">Pilihan Jam Luar:</span>
                  {[2, 4, 6, 8, 12].map(jp => (
                    <button
                      key={jp}
                      type="button"
                      onClick={() => setFormExternalHours(jp)}
                      className={`text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer transition-colors shadow-2xs ${
                        formExternalHours === jp
                          ? 'bg-amber-700 text-white'
                          : 'bg-white hover:bg-amber-100 text-amber-950 border border-amber-300'
                      }`}
                    >
                      +{jp} JP
                    </button>
                  ))}
                  {formExternalSchool && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormExternalSchool('');
                        setFormExternalHours(0);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 cursor-pointer ml-auto"
                    >
                      Kosongkan Sekolah Lain
                    </button>
                  )}
                </div>
              </div>

              {/* Real-time Calculation Summary Card */}
              <div className={`p-4 rounded-xl border transition-colors ${
                isCertifiedInModal
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold block text-sm">📊 Ringkasan Beban Sertifikasi Guru:</span>
                    <div className="text-[11px] text-slate-700 mt-1 space-y-0.5">
                      <div>• {formIsBK ? 'Layanan Bimbingan Konseling' : 'Tatap Muka Mengajar'}: <strong>{effectiveTeachingInModal} JP</strong></div>
                      <div>• Tugas Intern Madrasah: <strong>+{effectiveInternalDutyInModal} JP</strong> {formInternalDuty ? `(${formInternalDuty})` : ''}</div>
                      <div>• Mengajar Sekolah Lain: <strong>+{effectiveExternalDutyInModal} JP</strong> {formExternalSchool ? `(${formExternalSchool})` : ''}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black block">
                      {totalCertifiedInModal} JP
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                      isCertifiedInModal ? 'bg-emerald-200 text-emerald-900 border border-emerald-400' : 'bg-amber-200 text-amber-900 border border-amber-400'
                    }`}>
                      {isCertifiedInModal ? '✓ Memenuhi Syarat (≥24 JP)' : `Kurang ${24 - totalCertifiedInModal} JP`}
                    </span>
                  </div>
                </div>
              </div>
              {/* Synchronization Settings */}
              <div className="p-3.5 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
                    Otomatis Sinkronkan ke Matriks Utama (Jadwal 13 Rombel):
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    Sinkronisasi Otomatis
                  </span>
                </div>

                <label className="flex items-start gap-2 text-xs text-emerald-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncScheduleSubject}
                    onChange={e => setSyncScheduleSubject(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-500"
                  />
                  <span>
                    Perbarui nama mata pelajaran <strong>{formSubjects.split(',')[0]?.trim() || 'Mapel'}</strong> pada seluruh slot jadwal guru ini di Matriks Utama ({formScheduleHours} JP).
                  </span>
                </label>

                {formIsBK && (
                  <label className="flex items-start gap-2 text-xs text-emerald-900 cursor-pointer pt-1.5 border-t border-emerald-200">
                    <input
                      type="checkbox"
                      checked={clearBKSchedule}
                      onChange={e => setClearBKSchedule(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-500"
                    />
                    <span>
                      Kosongkan slot mengajar kelas guru ini di Matriks Utama (Direkomendasikan: Guru BK murni 24 JP layanan siswa tanpa jadwal kelas).
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setIsManualHoursMode(false);
                  setFormInternalDuty('');
                  setFormInternalDutyHours(0);
                  setSelectedInternalPreset('');
                  setFormExternalSchool('');
                  setFormExternalHours(0);
                  if (editingTeacher) {
                    setFormIsBK(isBKTeacher(editingTeacher));
                    const wl = workloads.find(w => w.teacher.kg === editingTeacher.kg);
                    setFormAssignedClasses(wl ? [...wl.scheduleClassesTaught] : []);
                    setFormTeachingHours(isBKTeacher(editingTeacher) ? 24 : (wl ? wl.scheduleTeachingHours : 0));
                    if (wl) {
                      setFormRombelJTM({ ...wl.scheduleRombelJTM });
                    }
                  }
                }}
                className="text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Reset ke Setelan Otomatis
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="text-xs px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="inline-flex items-center gap-1.5 text-xs px-4 py-2 font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan & Sinkronkan ke Matriks</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
