import { DAY_PERIODS, INITIAL_CLASSES, INITIAL_TEACHERS } from './initialData';
import { DayOfWeek, ScheduleCell, WeeklySchedule } from '../types/schedule';
import { getSubjectHoursOnDay } from '../utils/scheduler';

// Teacher curriculum distribution per class (40 JP total per class)
export interface SubjectDemand {
  subject: string;
  kg: number;
  hours: number;
}

export function getCurriculumDemand(classId: string): SubjectDemand[] {
  const isGrade7 = classId.startsWith('VII');
  const isGrade8 = classId.startsWith('VIII');

  // Matematika (4 JP)
  let mtk = 20; // Hj. Rosdiana, S.Ag (VII.A - VII.D)
  if (['VII.E', 'VIII.A', 'VIII.B'].includes(classId)) mtk = 29; // Alfiyah Ramadhanah, S.Pd
  else if (['VIII.C', 'VIII.D'].includes(classId)) mtk = 35; // Sriyanti, S.Pd
  else if (classId.startsWith('IX')) mtk = 1; // Hj. Rachmawati, S.Ag (IX.A - IX.D)

  // Bahasa Indonesia: 6 JP/minggu untuk seluruh kelas (Tiga blok 2 JP)
  let bi = 4; // Sainal, S.Pd (VII.A - VII.D)
  if (['VII.E', 'VIII.A', 'VIII.B', 'VIII.C'].includes(classId)) bi = 11; // Nurfan, S.Pd.I
  else if (['VIII.D', 'IX.A', 'IX.B', 'IX.C'].includes(classId)) bi = 13; // Miftahul Khair, S.Pd
  else if (classId === 'IX.D') bi = 36; // Herni Nengsi, S.Pd

  // IPA (4 JP)
  let ipa = 26; // Fatimah Rezky, S.Pd (VII.A, VII.B, IX.A, IX.B)
  if (['VII.C', 'VII.D', 'VIII.A', 'VIII.B'].includes(classId)) ipa = 30; // Adi Umar Pabeta, S.Pd
  else if (['VII.E', 'VIII.C', 'VIII.D', 'IX.C', 'IX.D'].includes(classId)) ipa = 38; // Nurcahyana Pattahuddin, S.Pd

  // Bahasa Inggris (4 JP)
  let big = 21; // Duniati, S.Pd (VII.A, VII.B, VIII.A, VIII.B)
  if (['VII.C', 'VII.D'].includes(classId)) big = 25; // Nurjannah Thahir, S.Pd
  else if (['VII.E', 'VIII.C', 'VIII.D'].includes(classId)) big = 37; // Nurul Aoliyah Rostam, S.Pd
  else if (classId.startsWith('IX')) big = 22; // Fitriani. N, S.Pd (IX.A - IX.D)

  // IPS: Wajib 3 JP per kelas dalam seminggu
  let ips = isGrade7 || ['VIII.A', 'VIII.B'].includes(classId) ? 14 : 17; // A. Monika Santi / Tila Insaniyati

  // Penjaskes (3 JP)
  let pjok = 19; // Panris, S.Pd.I

  // PKn (2 JP)
  let pkn = 23; // Hasnawati, S.Pd
  if (['VIII.C', 'VIII.D', 'IX.A', 'IX.B'].includes(classId)) pkn = 33; // Ardi, S.Pd
  else if (['IX.C', 'IX.D'].includes(classId)) pkn = 34; // Hersa, S.Pd

  // Seni Budaya (2 JP)
  let sb = isGrade7 || ['VIII.A', 'VIII.B'].includes(classId) ? 15 : 18; // Arini / Hasnawati

  // Fiqhi (2 JP)
  let fq = 3; // Hj. Musnia, S.Ag
  if (['VIII.C', 'VIII.D', 'IX.A', 'IX.B'].includes(classId)) fq = 9; // Ishak, S.Ag
  else if (['IX.C', 'IX.D'].includes(classId)) fq = 16; // Rizki Istitah, SH

  // Aqidah Akhlak (2 JP)
  let aa = ['VIII.D', 'IX.A', 'IX.B', 'IX.C', 'IX.D'].includes(classId) ? 24 : 6; // Hasmi / Rabasiah Anriani

  // Al-Qur'an Hadits (2 JP)
  let qh = ['VIII.C', 'VIII.D', 'IX.A', 'IX.B', 'IX.C', 'IX.D'].includes(classId) ? 12 : 8; // Ridwan / Nurhayati

  // SKI (2 JP)
  let ski = ['VIII.C', 'VIII.D', 'IX.A', 'IX.B', 'IX.C', 'IX.D'].includes(classId) ? 7 : 5; // Rasni / Muh. Safir

  // Bahasa Arab (2 JP)
  let ba = ['VIII.C', 'VIII.D', 'IX.A', 'IX.B', 'IX.C', 'IX.D'].includes(classId) ? 28 : 10; // Ibnu Maksum / Basmawati

  // Informatika (2 JP)
  let inf = ['VIII.C', 'VIII.D', 'IX.A', 'IX.B', 'IX.C', 'IX.D'].includes(classId) ? 36 : 27; // Herni Nengsi / Sarti Rahayu

  // Total 40 JP: 4+6+4+4+3+3+2+2+2+2+2+2+2+2 = 40 JP (Tanpa ada jam tunggal 1 JP!)
  return [
    { subject: 'Matematika', kg: mtk, hours: 4 },
    { subject: 'Bahasa Indonesia', kg: bi, hours: 6 },
    { subject: 'IPA', kg: ipa, hours: 4 },
    { subject: 'Bahasa Inggris', kg: big, hours: 4 },
    { subject: 'IPS', kg: ips, hours: 3 },
    { subject: 'Penjaskes', kg: pjok, hours: 3 },
    { subject: 'Pendidikan Pancasila / PKn', kg: pkn, hours: 2 },
    { subject: 'Seni Budaya', kg: sb, hours: 2 },
    { subject: 'Fiqhi', kg: fq, hours: 2 },
    { subject: 'Aqidah Akhlak', kg: aa, hours: 2 },
    { subject: "Al-Qur'an Hadits", kg: qh, hours: 2 },
    { subject: 'Sejarah Kebudayaan Islam', kg: ski, hours: 2 },
    { subject: 'Bahasa Arab', kg: ba, hours: 2 },
    { subject: 'Informatika', kg: inf, hours: 2 },
  ];
}

// Check if any class is missing any of the 14 mandatory subjects
export interface MissingSubjectDetail {
  classId: string;
  subject: string;
  expectedHours: number;
  actualHours: number;
}

export function auditMissingSubjectsInSchedule(
  schedule: WeeklySchedule,
  classes = INITIAL_CLASSES
): MissingSubjectDetail[] {
  const missing: MissingSubjectDetail[] = [];

  for (const cls of classes) {
    const demands = getCurriculumDemand(cls.id);
    const subjectCounts: Record<string, number> = {};

    for (const day of ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'] as DayOfWeek[]) {
      if (!schedule[day]) continue;
      for (const periodObj of Object.values(schedule[day])) {
        const cell = periodObj[cls.id];
        if (cell && cell.subject) {
          subjectCounts[cell.subject] = (subjectCounts[cell.subject] || 0) + 1;
        }
      }
    }

    for (const demand of demands) {
      const actual = subjectCounts[demand.subject] || 0;
      if (actual < demand.hours) {
        missing.push({
          classId: cls.id,
          subject: demand.subject,
          expectedHours: demand.hours,
          actualHours: actual,
        });
      }
    }
  }

  return missing;
}

// Helper to generate a pristine empty schedule grid (All slots cleared to subject: '', kg: 0)
export function createEmptySchedule(): WeeklySchedule {
  const days: DayOfWeek[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
  const classes = INITIAL_CLASSES;
  const schedule: WeeklySchedule = {
    SENIN: {},
    SELASA: {},
    RABU: {},
    KAMIS: {},
    JUMAT: {},
  };

  for (const day of days) {
    schedule[day] = {};
    const periods = DAY_PERIODS[day] || [];
    for (const p of periods) {
      schedule[day][p.period] = {};
      for (const cls of classes) {
        schedule[day][p.period][cls.id] = { subject: '', kg: 0 };
      }
    }
  }

  return schedule;
}

// Build initial schedule systematically guaranteeing ZERO conflicts and ZERO missing subjects
export function createDefaultSchedule(): WeeklySchedule {
  const days: DayOfWeek[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
  const classes = INITIAL_CLASSES;

  const schedule: WeeklySchedule = {
    SENIN: {},
    SELASA: {},
    RABU: {},
    KAMIS: {},
    JUMAT: {},
  };

  // Pre-initialize empty slots
  for (const day of days) {
    schedule[day] = {};
    const periods = DAY_PERIODS[day];
    for (const p of periods) {
      schedule[day][p.period] = {};
      for (const cls of classes) {
        schedule[day][p.period][cls.id] = { subject: '', kg: 0 };
      }
    }
  }

  // Pre-expand curriculum demands into teaching blocks (3 JP blocks and 2 JP blocks)
  interface Block {
    classId: string;
    subject: string;
    kg: number;
    hours: number;
  }

  const allBlocks: Block[] = [];
  for (const cls of classes) {
    const demands = getCurriculumDemand(cls.id);
    for (const d of demands) {
      if (d.hours === 3) {
        allBlocks.push({
          classId: cls.id,
          subject: d.subject,
          kg: d.kg,
          hours: 3,
        });
      } else {
        let rem = d.hours;
        while (rem > 0) {
          const h = rem >= 3 ? 3 : 2;
          allBlocks.push({
            classId: cls.id,
            subject: d.subject,
            kg: d.kg,
            hours: h,
          });
          rem -= h;
        }
      }
    }
  }

  // Helper to test if teacher is free in all periods of chunk
  function isTeacherFree(day: DayOfWeek, periods: number[], kg: number, classId: string): boolean {
    for (const p of periods) {
      const clsMap = schedule[day][p];
      if (!clsMap) continue;
      for (const [otherCls, cell] of Object.entries(clsMap)) {
        if (otherCls !== classId && cell.kg === kg) {
          return false;
        }
      }
    }
    return true;
  }

  // Helper to check if class has free space in this chunk
  function isClassSlotFree(day: DayOfWeek, periods: number[], classId: string): boolean {
    for (const p of periods) {
      if (schedule[day]?.[p]?.[classId]?.kg > 0) {
        return false;
      }
    }
    return true;
  }

  // Sort blocks: 3-hour blocks first, then 2-hour blocks, ordered by teacher frequency
  const teacherCounts: Record<number, number> = {};
  for (const b of allBlocks) {
    teacherCounts[b.kg] = (teacherCounts[b.kg] || 0) + 1;
  }

  allBlocks.sort((a, b) => {
    if (a.hours !== b.hours) return b.hours - a.hours;
    return (teacherCounts[b.kg] || 0) - (teacherCounts[a.kg] || 0);
  });

  // Assign blocks: every block is 3 JP or 2 JP (Never 1 JP)
  for (const block of allBlocks) {
    const req = block.hours;
    let assigned = false;

    // Search days for contiguous req periods where teacher and class are free
    for (const day of days) {
      if (assigned) break;

      const currentDailyHours = getSubjectHoursOnDay(schedule, day, block.classId, block.subject);
      // Enforce max 4 JP per day and enforce no existing 1-hour fragment
      if (currentDailyHours + req > 4) continue;

      const dayPeriods = DAY_PERIODS[day] || [];
      for (let i = 0; i <= dayPeriods.length - req; i++) {
        const targetPeriods = dayPeriods.slice(i, i + req).map(p => p.period);

        if (
          isClassSlotFree(day, targetPeriods, block.classId) &&
          isTeacherFree(day, targetPeriods, block.kg, block.classId)
        ) {
          for (const p of targetPeriods) {
            schedule[day][p][block.classId] = {
              subject: block.subject,
              kg: block.kg,
            };
          }
          assigned = true;
          break;
        }
      }
    }

    if (!assigned) {
      // Relaxed fallback search across days for contiguous slot
      for (const day of days) {
        if (assigned) break;
        const dayPeriods = DAY_PERIODS[day] || [];
        for (let i = 0; i <= dayPeriods.length - req; i++) {
          const targetPeriods = dayPeriods.slice(i, i + req).map(p => p.period);
          if (
            isClassSlotFree(day, targetPeriods, block.classId) &&
            isTeacherFree(day, targetPeriods, block.kg, block.classId)
          ) {
            for (const p of targetPeriods) {
              schedule[day][p][block.classId] = {
                subject: block.subject,
                kg: block.kg,
              };
            }
            assigned = true;
            break;
          }
        }
      }
    }
  }

  return schedule;
}
