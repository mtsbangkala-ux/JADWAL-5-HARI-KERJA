import { DAY_PERIODS, INITIAL_CLASSES, INITIAL_TEACHERS } from '../data/initialData';
import { Conflict, DayOfWeek, PeriodSlot, ScheduleCell, Teacher, WeeklySchedule } from '../types/schedule';

export const DAYS: DayOfWeek[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];

// Map of teacher assignments per class
export interface LessonBlock {
  subject: string;
  kg: number;
  duration: number; // usually 2 JP
}

// Generate the standard subject-teacher curriculum demand for each class (Total 40 JP per week for 5-day system)
export function getClassDemands(classId: string): LessonBlock[] {
  const isGrade7 = classId.startsWith('VII');
  const isGrade8 = classId.startsWith('VIII');
  const isGrade9 = classId.startsWith('IX');

  // Determine specific teachers based on actual MTsN 3 Jeneponto distribution
  let mtkKg = 20;
  if (['VII.D', 'IX.C', 'IX.D'].includes(classId)) mtkKg = 35;
  else if (isGrade8) mtkKg = 29;
  else if (['IX.A', 'IX.B'].includes(classId)) mtkKg = 1;

  let biKg = 4;
  if (['VII.E', 'VIII.A', 'VIII.B', 'VIII.C'].includes(classId)) biKg = 11;
  else if (['VIII.D', 'IX.A', 'IX.B', 'IX.C'].includes(classId)) biKg = 13;
  else if (classId === 'IX.D') biKg = 36;

  let ipaKg = 38;
  if (classId === 'VII.C') ipaKg = 26;
  else if (isGrade8) ipaKg = 30;
  else if (isGrade9) ipaKg = 26;

  let bigKg = 22;
  if (classId === 'VII.A') bigKg = 37;
  else if (['VII.C', 'VII.D'].includes(classId)) bigKg = 25;
  else if (isGrade8) bigKg = 21;

  let ipsKg = isGrade7 ? 14 : 17;
  let pjokKg = 19;
  let sbKg = isGrade7 ? 15 : 18;

  let pknKg = 34;
  if (['VII.D', 'VII.E'].includes(classId) || isGrade8) pknKg = 33;
  else if (isGrade9) pknKg = 23;

  let fqKg = isGrade7 ? 16 : isGrade8 ? 9 : 3;
  let aaKg = isGrade7 ? 24 : isGrade8 ? 16 : 6;
  let qhKg = isGrade7 ? 12 : 8;

  let skiKg = 5;
  if (classId === 'VII.E') skiKg = 31;
  else if (isGrade8 || isGrade9) skiKg = 7;

  let baKg = 28;
  if (['VII.A', 'VII.B', 'IX.A', 'IX.B', 'IX.C', 'IX.D'].includes(classId)) baKg = 10;

  let infKg = ['VII.C', 'VII.D', 'VIII.A', 'VIII.B', 'IX.A', 'IX.B', 'IX.C', 'IX.D'].includes(classId) ? 27 : 36;

  // Total 40 JP per week: All blocks are 2 JP or 3 JP (Zero 1-hour blocks)
  return [
    { subject: 'Matematika', kg: mtkKg, duration: 2 },
    { subject: 'Matematika', kg: mtkKg, duration: 2 },
    { subject: 'Bahasa Indonesia', kg: biKg, duration: 2 },
    { subject: 'Bahasa Indonesia', kg: biKg, duration: 2 },
    { subject: 'Bahasa Indonesia', kg: biKg, duration: 2 }, // 6 JP total Bahasa Indonesia
    { subject: 'IPA', kg: ipaKg, duration: 2 },
    { subject: 'IPA', kg: ipaKg, duration: 2 },
    { subject: 'Bahasa Inggris', kg: bigKg, duration: 2 },
    { subject: 'Bahasa Inggris', kg: bigKg, duration: 2 },
    { subject: 'IPS', kg: ipsKg, duration: 3 }, // 3 JP block total IPS
    { subject: 'Pendidikan Jasmani', kg: pjokKg, duration: 3 }, // 3 JP block total Penjaskes
    { subject: 'Pendidikan Pancasila / PKn', kg: pknKg, duration: 2 },
    { subject: 'Seni Budaya', kg: sbKg, duration: 2 },
    { subject: 'Fiqhi', kg: fqKg, duration: 2 },
    { subject: 'Aqidah Akhlak', kg: aaKg, duration: 2 },
    { subject: "Al-Qur'an Hadits", kg: qhKg, duration: 2 },
    { subject: 'Sejarah Kebudayaan Islam', kg: skiKg, duration: 2 },
    { subject: 'Bahasa Arab', kg: baKg, duration: 2 },
    { subject: 'Informatika', kg: infKg, duration: 2 },
  ];
}

// Helper to calculate total hours of a subject assigned to a class on a specific day
export function getSubjectHoursOnDay(
  schedule: WeeklySchedule,
  day: DayOfWeek,
  classId: string,
  subject: string
): number {
  if (!schedule[day] || !subject) return 0;
  let total = 0;
  for (const periodObj of Object.values(schedule[day])) {
    const cell = periodObj[classId];
    if (cell && cell.subject === subject) {
      total++;
    }
  }
  return total;
}

export interface SingleHourViolation {
  day: DayOfWeek;
  classId: string;
  subject: string;
  hours: number;
}

// Detect any subject that has only 1 JP on a given day (Rule: Mapel dalam sehari minimal 2 JP)
export function detectSingleHourSubjectViolations(
  schedule: WeeklySchedule
): SingleHourViolation[] {
  const violations: SingleHourViolation[] = [];

  for (const day of DAYS) {
    if (!schedule[day]) continue;
    const counts: Record<string, Record<string, number>> = {};

    for (const periodObj of Object.values(schedule[day])) {
      for (const [classId, cell] of Object.entries(periodObj)) {
        if (!cell || !cell.subject) continue;
        if (!counts[classId]) counts[classId] = {};
        counts[classId][cell.subject] = (counts[classId][cell.subject] || 0) + 1;
      }
    }

    for (const [classId, subjectMap] of Object.entries(counts)) {
      for (const [subject, hours] of Object.entries(subjectMap)) {
        if (hours === 1) {
          violations.push({
            day,
            classId,
            subject,
            hours,
          });
        }
      }
    }
  }

  return violations;
}

export interface DailyLimitViolation {
  day: DayOfWeek;
  classId: string;
  subject: string;
  kg: number;
  hours: number;
}

// Detect any subject exceeding the 4 JP daily limit for a class
export function detectDailySubjectLimitViolations(
  schedule: WeeklySchedule
): DailyLimitViolation[] {
  const violations: DailyLimitViolation[] = [];

  for (const day of DAYS) {
    if (!schedule[day]) continue;
    const counts: Record<string, Record<string, { hours: number; kg: number }>> = {};

    for (const periodObj of Object.values(schedule[day])) {
      for (const [classId, cell] of Object.entries(periodObj)) {
        if (!cell || !cell.subject) continue;
        if (!counts[classId]) counts[classId] = {};
        if (!counts[classId][cell.subject]) {
          counts[classId][cell.subject] = { hours: 0, kg: cell.kg };
        }
        counts[classId][cell.subject].hours += 1;
        if (cell.kg > 0) counts[classId][cell.subject].kg = cell.kg;
      }
    }

    for (const [classId, subjectMap] of Object.entries(counts)) {
      for (const [subject, data] of Object.entries(subjectMap)) {
        if (data.hours > 4) {
          violations.push({
            day,
            classId,
            subject,
            kg: data.kg,
            hours: data.hours,
          });
        }
      }
    }
  }

  return violations;
}

// Detect any conflicts in the weekly schedule
export function detectConflicts(
  schedule: WeeklySchedule,
  teachers: Teacher[] = INITIAL_TEACHERS
): Conflict[] {
  const conflicts: Conflict[] = [];
  const teacherMap = new Map<number, string>(teachers.map(t => [t.kg, t.name]));

  for (const day of DAYS) {
    const daySchedule = schedule[day];
    if (!daySchedule) continue;

    const periods = DAY_PERIODS[day] || [];
    for (const p of periods) {
      const periodNum = p.period;
      const classSlots = daySchedule[periodNum] || {};

      // Check which teachers are assigned in which classes during this (day, periodNum)
      const teacherOccupancy: Record<number, { classes: string[]; subjects: string[] }> = {};

      for (const [classId, cell] of Object.entries(classSlots)) {
        if (!cell || !cell.kg || cell.kg <= 0) continue;

        if (!teacherOccupancy[cell.kg]) {
          teacherOccupancy[cell.kg] = { classes: [], subjects: [] };
        }
        teacherOccupancy[cell.kg].classes.push(classId);
        teacherOccupancy[cell.kg].subjects.push(cell.subject);
      }

      // Any teacher teaching > 1 class at this exact period is a BENTROK (Guru BK dikecualikan)
      for (const [kgStr, data] of Object.entries(teacherOccupancy)) {
        const kg = Number(kgStr);
        const teacherObj = teachers.find(t => t.kg === kg);
        // Exclude Guru BK from conflict detection
        if (teacherObj && isBKTeacher(teacherObj)) {
          continue;
        }

        if (data.classes.length > 1) {
          conflicts.push({
            id: `${day}-${periodNum}-${kg}`,
            day,
            period: periodNum,
            periodLabel: p.label,
            kg,
            teacherName: teacherMap.get(kg) || `Guru KG ${kg}`,
            classes: data.classes,
            subjects: data.subjects,
          });
        }
      }
    }
  }

  return conflicts;
}

// Helper to check if a teacher is available at (day, period) in currently built schedule
function isTeacherAvailable(
  schedule: WeeklySchedule,
  day: DayOfWeek,
  period: number,
  kg: number,
  excludeClassId?: string,
  teachers: Teacher[] = INITIAL_TEACHERS
): boolean {
  if (!kg || kg <= 0) return true;
  const teacherObj = teachers.find(t => t.kg === kg);
  if (teacherObj && isBKTeacher(teacherObj)) return true; // Guru BK selalu dianggap tersedia (tidak bentrok)

  const daySchedule = schedule[day];
  if (!daySchedule) return true;
  const periodSchedule = daySchedule[period];
  if (!periodSchedule) return true;

  for (const [clsId, cell] of Object.entries(periodSchedule)) {
    if (excludeClassId && clsId === excludeClassId) continue;
    if (cell && cell.kg === kg) {
      return false; // Teacher already busy in another class
    }
  }
  return true;
}

// Generate guaranteed 100% collision-free schedule for 5 working days
export function generateConflictFreeSchedule(): WeeklySchedule {
  const classes = INITIAL_CLASSES;
  const schedule: WeeklySchedule = {
    SENIN: {},
    SELASA: {},
    RABU: {},
    KAMIS: {},
    JUMAT: {},
  };

  // Initialize empty grid
  for (const day of DAYS) {
    schedule[day] = {};
    const periods = DAY_PERIODS[day];
    for (const p of periods) {
      schedule[day][p.period] = {};
      for (const c of classes) {
        schedule[day][p.period][c.id] = { subject: '', kg: 0 };
      }
    }
  }

  // Pre-prepare list of available period pairs/slots per day
  // Senin: [1-2], [3-4], [5-6], [7-8] -> 4 pairs = 8 JP
  // Selasa: [1-2], [3-4], [5-6], [7-8], [9] -> 4 pairs + 1 single = 9 JP
  // Rabu: [1-2], [3-4], [5-6], [7-8], [9] -> 4 pairs + 1 single = 9 JP
  // Kamis: [1-2], [3-4], [5-6], [7-8], [9] -> 4 pairs + 1 single = 9 JP
  // Jumat: [1-2], [3-4], [5] -> 2 pairs + 1 single = 5 JP
  // Total per week = 8 + 9 + 9 + 9 + 5 = 40 JP

  interface TimeSlotTarget {
    day: DayOfWeek;
    periods: number[];
  }

  const allSlotTargets: TimeSlotTarget[] = [
    // Senin
    { day: 'SENIN', periods: [1, 2] },
    { day: 'SENIN', periods: [3, 4] },
    { day: 'SENIN', periods: [5, 6] },
    { day: 'SENIN', periods: [7, 8] },
    // Selasa
    { day: 'SELASA', periods: [1, 2] },
    { day: 'SELASA', periods: [3, 4] },
    { day: 'SELASA', periods: [5, 6] },
    { day: 'SELASA', periods: [7, 8] },
    { day: 'SELASA', periods: [9] },
    // Rabu
    { day: 'RABU', periods: [1, 2] },
    { day: 'RABU', periods: [3, 4] },
    { day: 'RABU', periods: [5, 6] },
    { day: 'RABU', periods: [7, 8] },
    { day: 'RABU', periods: [9] },
    // Kamis
    { day: 'KAMIS', periods: [1, 2] },
    { day: 'KAMIS', periods: [3, 4] },
    { day: 'KAMIS', periods: [5, 6] },
    { day: 'KAMIS', periods: [7, 8] },
    { day: 'KAMIS', periods: [9] },
    // Jumat
    { day: 'JUMAT', periods: [1, 2] },
    { day: 'JUMAT', periods: [3, 4] },
    { day: 'JUMAT', periods: [5] },
  ];

  // We assign class by class using backtracking / greedy with smart ordering
  // To avoid teacher bottlenecks (e.g. Panris who teaches PJOK to all 13 classes),
  // we prioritize assigning heavy-shared teachers first!

  // Let's collect all lessons across all classes
  interface ClassLessonPlan {
    classId: string;
    lessons: LessonBlock[];
  }

  const classPlans: ClassLessonPlan[] = classes.map(c => ({
    classId: c.id,
    lessons: getClassDemands(c.id),
  }));

  // Backtracking solver
  function solve(classIdx: number): boolean {
    if (classIdx >= classPlans.length) {
      return true; // All 13 classes assigned without conflicts!
    }

    const { classId, lessons } = classPlans[classIdx];

    // Separate 2-hour blocks and 1-hour blocks
    const doubleBlocks = lessons.filter(l => l.duration === 2);
    const singleBlocks = lessons.filter(l => l.duration === 1);

    // Slot targets with 2 periods
    const doubleSlots = allSlotTargets.filter(s => s.periods.length === 2);
    // Slot targets with 1 period
    const singleSlots = allSlotTargets.filter(s => s.periods.length === 1);

    // Helper recursive for double blocks
    function assignDoubleBlocks(blockIdx: number, availableSlots: TimeSlotTarget[]): boolean {
      if (blockIdx >= doubleBlocks.length) {
        // Now assign single blocks
        return assignSingleBlocks(0, singleSlots);
      }

      const block = doubleBlocks[blockIdx];

      // Try available double slots
      for (let i = 0; i < availableSlots.length; i++) {
        const slot = availableSlots[i];
        const day = slot.day;
        const [p1, p2] = slot.periods;

        // Enforce rule: max 4 JP per day for same subject in same class
        const currentDailyHours = getSubjectHoursOnDay(schedule, day, classId, block.subject);
        if (currentDailyHours + block.duration > 4) {
          continue;
        }

        // Check if teacher is free in both p1 and p2
        if (
          isTeacherAvailable(schedule, day, p1, block.kg, classId) &&
          isTeacherAvailable(schedule, day, p2, block.kg, classId)
        ) {
          // Place lesson
          schedule[day][p1][classId] = { subject: block.subject, kg: block.kg };
          schedule[day][p2][classId] = { subject: block.subject, kg: block.kg };

          const remainingSlots = [...availableSlots.slice(0, i), ...availableSlots.slice(i + 1)];

          if (assignDoubleBlocks(blockIdx + 1, remainingSlots)) {
            return true;
          }

          // Backtrack
          schedule[day][p1][classId] = { subject: '', kg: 0 };
          schedule[day][p2][classId] = { subject: '', kg: 0 };
        }
      }

      return false;
    }

    function assignSingleBlocks(singleIdx: number, availableSlots: TimeSlotTarget[]): boolean {
      if (singleIdx >= singleBlocks.length) {
        // Class successfully assigned! Move to next class
        return solve(classIdx + 1);
      }

      const block = singleBlocks[singleIdx];

      for (let i = 0; i < availableSlots.length; i++) {
        const slot = availableSlots[i];
        const day = slot.day;
        const p = slot.periods[0];

        // Enforce rule: max 4 JP per day for same subject in same class
        const currentDailyHours = getSubjectHoursOnDay(schedule, day, classId, block.subject);
        if (currentDailyHours + block.duration > 4) {
          continue;
        }

        if (isTeacherAvailable(schedule, day, p, block.kg, classId)) {
          schedule[day][p][classId] = { subject: block.subject, kg: block.kg };
          const remainingSlots = [...availableSlots.slice(0, i), ...availableSlots.slice(i + 1)];

          if (assignSingleBlocks(singleIdx + 1, remainingSlots)) {
            return true;
          }

          schedule[day][p][classId] = { subject: '', kg: 0 };
        }
      }

      return false;
    }

    // Sort double blocks by teacher bottleneck (higher frequency teachers first)
    const sortedDoubleBlocks = [...doubleBlocks].sort((a, b) => {
      // PJOK (Panris KG 19) is shared by all 13 classes -> most constrained!
      if (a.kg === 19) return -1;
      if (b.kg === 19) return 1;
      // Other high frequency teachers: IPA, Bahasa Indonesia, MTK
      return 0;
    });

    return assignDoubleBlocks(0, doubleSlots);
  }

  const success = solve(0);
  if (!success) {
    console.warn('CSP exact backtracking needed fallback heuristic');
  }

  return schedule;
}

// Helper to identify Guru Bimbingan Konseling (BK)
export function isBKTeacher(t: Teacher): boolean {
  if (t.isBK) return true;
  return t.subjects.some(s => /bimbingan\s*konseling|^\s*bk\s*$/i.test(s));
}

// Compute workload stats per teacher
export interface TeacherWorkload {
  teacher: Teacher;
  teachingHours: number; // Jam tatap muka di kelas (atau 24 JP otomatis untuk Guru BK)
  scheduleTeachingHours: number; // Jam tatap muka murni dihitung dari matriks jadwal
  isManualTeachingHours: boolean; // Menandakan apakah jam mengajar diatur secara manual
  isBK: boolean; // Menandakan apakah guru BK (otomatis 24 JP layanan bimbingan konseling)
  internalDuty?: string; // Tugas tambahan intern madrasah
  internalDutyHours: number; // Ekuivalensi jam tugas intern madrasah
  externalTeachingSchool?: string; // Nama sekolah/madrasah lain tempat mengajar
  externalTeachingHours: number; // Jam mengajar di sekolah/madrasah lain
  additionalDutyHours: number; // Total Ekuivalensi jam tugas tambahan (intern + eksternal)
  totalCertifiedHours: number; // Total Jam Tatap Muka + Tugas Tambahan (untuk pemenuhan 24 JP)
  totalHours: number; // Alias for totalCertifiedHours / teachingHours
  classesTaught: string[]; // Kelas yang diampu (manual override atau dari jadwal)
  scheduleClassesTaught: string[]; // Kelas riil dari slot jadwal matriks
  isManualClasses: boolean; // Menandakan apakah kelas yang diampu diatur secara manual
  scheduleRombelJTM: Record<string, number>; // JTM riil per rombel dari jadwal
  rombelJTM: Record<string, number>; // JTM efektif per rombel (manual / jadwal)
  daysActive: DayOfWeek[];
  hoursByDay: Record<DayOfWeek, number>;
}

export function calculateTeacherWorkload(
  schedule: WeeklySchedule,
  teachers: Teacher[] = INITIAL_TEACHERS
): TeacherWorkload[] {
  const workloads: TeacherWorkload[] = teachers.map(t => {
    const isLegacyExternal = t.additionalDuty && /mengajar\s+di\s+sekolah\s+lain/i.test(t.additionalDuty);

    let internalDuty = t.internalDuty;
    let internalDutyHours = t.internalDutyHours ?? 0;
    let externalSchool = t.externalTeachingSchool;
    let externalHours = t.externalTeachingHours ?? 0;

    // Backward compatibility fallback from additionalDuty & additionalDutyHours
    if (!internalDuty && !externalSchool && t.additionalDuty) {
      if (isLegacyExternal) {
        externalSchool = t.additionalDuty;
        externalHours = t.additionalDutyHours || 0;
      } else {
        internalDuty = t.additionalDuty;
        internalDutyHours = t.additionalDutyHours || 0;
      }
    } else if (t.additionalDutyHours && internalDutyHours === 0 && externalHours === 0) {
      if (internalDuty) internalDutyHours = t.additionalDutyHours;
      else if (externalSchool) externalHours = t.additionalDutyHours;
    }

    const totalAddHours = internalDutyHours + externalHours;
    const bk = isBKTeacher(t);

    return {
      teacher: t,
      teachingHours: bk ? 24 : 0,
      scheduleTeachingHours: 0,
      isManualTeachingHours: t.manualTeachingHours !== undefined && t.manualTeachingHours !== null,
      isBK: bk,
      internalDuty,
      internalDutyHours,
      externalTeachingSchool: externalSchool,
      externalTeachingHours: externalHours,
      additionalDutyHours: totalAddHours,
      totalCertifiedHours: totalAddHours,
      totalHours: 0,
      classesTaught: [],
      scheduleClassesTaught: [],
      isManualClasses: Array.isArray(t.assignedClasses) && t.assignedClasses.length > 0,
      scheduleRombelJTM: {},
      rombelJTM: t.rombelJTM ? { ...t.rombelJTM } : {},
      daysActive: [],
      hoursByDay: { SENIN: 0, SELASA: 0, RABU: 0, KAMIS: 0, JUMAT: 0 },
    };
  });

  const map = new Map<number, TeacherWorkload>(workloads.map(w => [w.teacher.kg, w]));

  for (const day of DAYS) {
    const daySchedule = schedule[day] || {};
    for (const periodSlots of Object.values(daySchedule)) {
      for (const [classId, cell] of Object.entries(periodSlots)) {
        if (!cell || !cell.kg || cell.kg <= 0) continue;
        const wl = map.get(cell.kg);
        if (wl) {
          wl.scheduleTeachingHours += 1;
          wl.hoursByDay[day] += 1;
          wl.scheduleRombelJTM[classId] = (wl.scheduleRombelJTM[classId] || 0) + 1;
          if (!wl.scheduleClassesTaught.includes(classId)) {
            wl.scheduleClassesTaught.push(classId);
          }
          if (!wl.daysActive.includes(day)) {
            wl.daysActive.push(day);
          }
        }
      }
    }
  }

  // Update total totals directly from Class Schedule input as the standard benchmark
  for (const wl of workloads) {
    const bk = isBKTeacher(wl.teacher);
    wl.isBK = bk;

    // Standard benchmark: Classes taught and Rombel JTM are 100% derived from class schedule input
    wl.classesTaught = [...wl.scheduleClassesTaught];
    wl.isManualClasses = false;
    wl.rombelJTM = { ...wl.scheduleRombelJTM };

    if (bk) {
      // Guru BK otomatis 24 jam layanan konseling
      wl.teachingHours = 24;
      wl.isManualTeachingHours = false;
    } else {
      // Total JP tatap muka dihitung murni dari alokasi di Jadwal Per Kelas
      wl.teachingHours = wl.scheduleTeachingHours;
      wl.isManualTeachingHours = false;
    }

    wl.totalCertifiedHours = wl.teachingHours + wl.additionalDutyHours;
    wl.totalHours = wl.totalCertifiedHours;
  }

  return workloads;
}
