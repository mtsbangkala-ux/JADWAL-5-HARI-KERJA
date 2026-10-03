export type DayOfWeek = 'SENIN' | 'SELASA' | 'RABU' | 'KAMIS' | 'JUMAT';

export interface Teacher {
  kg: number; // Kode Guru (1 - 38)
  name: string;
  title?: string;
  subjects: string[];
  maxHoursPerWeek?: number;
  phone?: string;
  additionalDuty?: string; // Legacy/combined summary
  additionalDutyHours?: number; // Legacy/combined hours
  internalDuty?: string; // Tugas tambahan intern madrasah (e.g. 'Wakamad Kurikulum', 'Wali Kelas VII.A', 'Kepala Lab Komputer')
  internalDutyHours?: number; // Ekuivalensi jam intern madrasah (e.g. 12 JP, 6 JP)
  externalTeachingSchool?: string; // Nama sekolah/madrasah lain (e.g. 'MA Baburrahim', 'MTs Al-Falah')
  externalTeachingHours?: number; // Jam mengajar di sekolah/madrasah lain (e.g. 6 JP)
  manualTeachingHours?: number; // Manual override for teaching hours in audit/workload
  isBK?: boolean; // Flag menandakan Guru Bimbingan Konseling (BK) otomatis 24 JP
  assignedClasses?: string[]; // Manual override / assignment kelas yang diampu (e.g. ['VII.A', 'VII.B'])
  rombelJTM?: Record<string, number>; // Manual input JTM per rombel (e.g. { 'VII.A': 3, 'VII.B': 3, 'VIII.A': 4 })
}

export interface Subject {
  code: string;
  name: string;
  shortName: string;
  category: 'agama' | 'umum' | 'bahasa' | 'muatan_lokal' | 'khusus';
  color: string;
}

export interface ClassRoom {
  id: string; // e.g. 'VII.A'
  grade: 'VII' | 'VIII' | 'IX';
  section: string; // 'A', 'B', etc.
  name: string;
  waliKelas?: string;
  room?: string;
}

export interface PeriodSlot {
  period: number; // 1, 2, 3, ...
  label: string; // "I", "II", ...
  startTime: string; // "07.30"
  endTime: string; // "08.10"
  isBreak?: boolean;
  breakLabel?: string;
  isCeremony?: boolean;
}

export interface ScheduleCell {
  subject: string;
  kg: number; // 0 if empty / non-teacher
}

// schedule[day][periodNumber][classId] = ScheduleCell
export type WeeklySchedule = Record<DayOfWeek, Record<number, Record<string, ScheduleCell>>>;

export interface Conflict {
  id: string;
  day: DayOfWeek;
  period: number;
  periodLabel: string;
  kg: number;
  teacherName: string;
  classes: string[];
  subjects: string[];
}

export interface SchoolInfo {
  name: string;
  type: string;
  academicYear: string;
  semester: string;
  headmasterName: string;
  headmasterNip: string;
  headmasterTitle: string;
  signatureCity: string;
  signatureDate: string;
  totalStudents: number;
  workingDays: number;
  logoLeft?: string; // URL / Data URI / SVG for Left Header Logo (e.g. Kemenag RI)
  logoRight?: string; // URL / Data URI / SVG for Right Header Logo (e.g. Madrasah / MTsN 3 Jeneponto)
  headmasterSignature?: string; // URL / Data URI for Headmaster Digital Barcode / Signature
}
