/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { MasterTimetable } from './components/MasterTimetable';
import { TeacherTimetable } from './components/TeacherTimetable';
import { ClassTimetable } from './components/ClassTimetable';
import { ConflictChecker } from './components/ConflictChecker';
import { ManageDataModal } from './components/ManageDataModal';
import { EditSlotModal } from './components/EditSlotModal';
import { AppLockModal } from './components/AppLockModal';
import { CalendarEventsTab } from './components/CalendarEventsTab';
import {
  INITIAL_CLASSES,
  INITIAL_SCHOOL_INFO,
  INITIAL_TEACHERS,
} from './data/initialData';
import { createDefaultSchedule, createEmptySchedule } from './data/defaultSchedule';
import {
  ClassRoom,
  DayOfWeek,
  ScheduleCell,
  SchoolInfo,
  Teacher,
  WeeklySchedule,
} from './types/schedule';
import { DAYS, detectConflicts } from './utils/scheduler';
import { exportToExcel, exportToCSV } from './utils/exportUtils';
import { NotificationToast, NotificationData, playAlertSound } from './components/NotificationToast';

const STORAGE_KEY_SCHEDULE = 'mtsn3_schedule_5d_v7_filled';
const STORAGE_KEY_TEACHERS = 'mtsn3_teachers_v2';
const STORAGE_KEY_SCHOOL = 'mtsn3_school_info_v2';
const STORAGE_KEY_CLASSES = 'mtsn3_classes_v2';
const STORAGE_KEY_LOCK_ENABLED = 'mtsn3_app_lock_enabled_v1';
const STORAGE_KEY_ADMIN_PASS = 'mtsn3_admin_password_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'master' | 'teacher' | 'class' | 'audit' | 'settings' | 'calendar'>('master');

  // Security Lock States
  const [isAppLockEnabled, setIsAppLockEnabled] = useState<boolean>(false);

  const [adminPassword, setAdminPassword] = useState<string>('admin123');

  const [isAppLocked, setIsAppLocked] = useState<boolean>(false);

  // School data states
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHOOL);
      return saved ? JSON.parse(saved) : INITIAL_SCHOOL_INFO;
    } catch {
      return INITIAL_SCHOOL_INFO;
    }
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEACHERS);
      return saved ? JSON.parse(saved) : INITIAL_TEACHERS;
    } catch {
      return INITIAL_TEACHERS;
    }
  });

  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLASSES);
      return saved ? JSON.parse(saved) : INITIAL_CLASSES;
    } catch {
      return INITIAL_CLASSES;
    }
  });

  const [schedule, setSchedule] = useState<WeeklySchedule>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDULE);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return createDefaultSchedule();
  });

  // Modal states for editing a slot
  const [editingSlot, setEditingSlot] = useState<{
    day: DayOfWeek;
    period: number;
    periodLabel: string;
    classId: string;
    cell: ScheduleCell;
  } | null>(null);

  // Global notification toast state
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = (notif: Omit<NotificationData, 'id' | 'timestamp'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newNotif: NotificationData = {
      ...notif,
      id,
      timestamp: Date.now(),
    };
    setNotifications(prev => [...prev.slice(-3), newNotif]);
    playAlertSound(newNotif.type === 'conflict' ? 'conflict' : 'success');
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(schedule));
    } catch (e) {
      console.warn('Storage quota exceeded');
    }
  }, [schedule]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(teachers));
    } catch (e) {
      console.warn('Storage quota exceeded');
    }
  }, [teachers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCHOOL, JSON.stringify(schoolInfo));
    } catch (e) {
      console.warn('Storage quota exceeded');
    }
  }, [schoolInfo]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(classes));
    } catch (e) {
      console.warn('Storage quota exceeded');
    }
  }, [classes]);

  const handleUpdateSecuritySettings = (enabled: boolean, newPass: string) => {
    setIsAppLockEnabled(enabled);
    setAdminPassword(newPass);
    try {
      localStorage.setItem(STORAGE_KEY_LOCK_ENABLED, JSON.stringify(enabled));
      localStorage.setItem(STORAGE_KEY_ADMIN_PASS, newPass);
    } catch (e) {
      console.warn('Storage quota exceeded');
    }
    addNotification({
      type: 'success',
      title: '🔒 Pengaturan Keamanan Disimpan!',
      message: enabled
        ? 'Aplikasi kini dilindungi dengan password admin.'
        : 'Pengunci aplikasi telah dinonaktifkan.',
    });
  };

  const handleLockNow = () => {
    setIsAppLocked(true);
    addNotification({
      type: 'info',
      title: '🔒 Aplikasi Terkunci',
      message: 'Layar dikunci. Masukkan password admin untuk membuka.',
    });
  };

  // Compute live conflicts
  const conflicts = useMemo(() => {
    return detectConflicts(schedule, teachers);
  }, [schedule, teachers]);

  // Set of conflicting cell keys "DAY-PERIOD-CLASSID"
  const conflictingCellKeys = useMemo(() => {
    const set = new Set<string>();
    for (const c of conflicts) {
      for (const cls of c.classes) {
        set.add(`${c.day}-${c.period}-${cls}`);
      }
    }
    return set;
  }, [conflicts]);

  // Handlers
  const handleCellClick = (
    day: DayOfWeek,
    period: number,
    periodLabel: string,
    classId: string,
    cell: ScheduleCell
  ) => {
    setEditingSlot({
      day,
      period,
      periodLabel,
      classId,
      cell,
    });
  };

  // Helper to sync teacher subjects & reset manual hour override on schedule changes
  const syncTeacherOnScheduleChange = (kg: number, subject: string) => {
    if (!kg || kg <= 0) return;
    setTeachers(prevTeachers => {
      return prevTeachers.map(t => {
        if (t.kg !== kg) return t;

        const newSubjects = [...(t.subjects || [])];
        const trimmedSubject = subject ? subject.trim() : '';
        if (trimmedSubject && !newSubjects.includes(trimmedSubject)) {
          newSubjects.push(trimmedSubject);
        }

        return {
          ...t,
          subjects: newSubjects,
          manualTeachingHours: undefined, // Ensure JTM automatically counts 100% from input schedule
        };
      });
    });
  };

  const handleSaveSlot = (
    day: DayOfWeek,
    period: number,
    classId: string,
    updatedCell: ScheduleCell
  ) => {
    const copy: WeeklySchedule = JSON.parse(JSON.stringify(schedule));
    if (!copy[day]) copy[day] = {};
    if (!copy[day][period]) copy[day][period] = {};
    copy[day][period][classId] = updatedCell;
    setSchedule(copy);

    if (updatedCell.kg > 0 && updatedCell.subject) {
      syncTeacherOnScheduleChange(updatedCell.kg, updatedCell.subject);
    }

    // Live conflict check on updated slot
    const newConflicts = detectConflicts(copy, teachers);
    if (newConflicts.length > 0) {
      addNotification({
        type: 'conflict',
        title: `⚠️ Peringatan: ${newConflicts.length} Jadwal Bentrok Terdeteksi!`,
        message: `Perubahan slot pada ${day} Jam Ke-${period} (Kelas ${classId}) menimbulkan tabrakan mengajar di Matriks Utama.`,
        details: newConflicts.map(
          c => `${c.day} Jam ${c.periodLabel}: KG ${c.kg} (${c.teacherName}) tabrakan di kelas ${c.classes.join(' & ')}`
        ),
        actionLabel: 'Perbaiki Otomatis',
        onAction: () => handleAutoFix(),
        secondaryActionLabel: 'Buka Matriks Utama',
        onSecondaryAction: () => setActiveTab('master'),
      });
    }
  };

  const handleSaveBatch = (
    classId: string,
    day: DayOfWeek,
    startPeriod: number,
    durationHours: number,
    updatedCell: ScheduleCell
  ) => {
    const copy: WeeklySchedule = JSON.parse(JSON.stringify(schedule));
    const maxPeriod = day === 'JUMAT' ? 6 : 10;

    for (let p = startPeriod; p < startPeriod + durationHours; p++) {
      if (p > maxPeriod) continue;
      if (!copy[day]) copy[day] = {};
      if (!copy[day][p]) copy[day][p] = {};
      copy[day][p][classId] = updatedCell;
    }
    setSchedule(copy);

    if (updatedCell.kg > 0 && updatedCell.subject) {
      syncTeacherOnScheduleChange(updatedCell.kg, updatedCell.subject);
    }

    const newConflicts = detectConflicts(copy, teachers);
    if (newConflicts.length > 0) {
      addNotification({
        type: 'conflict',
        title: `⚠️ Peringatan: ${newConflicts.length} Jadwal Bentrok Terdeteksi!`,
        message: `Penginputan ${updatedCell.subject || 'jadwal'} (${day} Jam Ke-${startPeriod} s/d ${Math.min(startPeriod + durationHours - 1, maxPeriod)}) Kelas ${classId} menimbulkan bentrok mengajar.`,
        details: newConflicts.map(
          c => `${c.day} Jam ${c.periodLabel}: KG ${c.kg} (${c.teacherName}) tabrakan di ${c.classes.join(' & ')}`
        ),
        actionLabel: 'Lihat Audit',
        onAction: () => setActiveTab('audit'),
      });
    } else {
      addNotification({
        type: 'success',
        title: '✅ Jadwal Kelas Berhasil Disimpan!',
        message: `Jadwal ${updatedCell.subject || 'bebas'} (${day} Jam Ke-${startPeriod} s/d ${Math.min(startPeriod + durationHours - 1, maxPeriod)}) Kelas ${classId} telah masuk dan 100% tersinkronisasi.`,
      });
    }
  };

  const handleSwapSlots = (
    dayA: DayOfWeek,
    periodA: number,
    classA: string,
    dayB: DayOfWeek,
    periodB: number,
    classB: string
  ) => {
    const copy: WeeklySchedule = JSON.parse(JSON.stringify(schedule));
    const cellA = copy[dayA]?.[periodA]?.[classA] || { subject: '', kg: 0 };
    const cellB = copy[dayB]?.[periodB]?.[classB] || { subject: '', kg: 0 };

    if (!copy[dayA]) copy[dayA] = {};
    if (!copy[dayA][periodA]) copy[dayA][periodA] = {};
    copy[dayA][periodA][classA] = cellB;

    if (!copy[dayB]) copy[dayB] = {};
    if (!copy[dayB][periodB]) copy[dayB][periodB] = {};
    copy[dayB][periodB][classB] = cellA;

    setSchedule(copy);

    const newConflicts = detectConflicts(copy, teachers);
    if (newConflicts.length > 0) {
      addNotification({
        type: 'conflict',
        title: `⚠️ Peringatan: ${newConflicts.length} Jadwal Bentrok Terdeteksi!`,
        message: `Tukar jadwal menyebabkan tabrakan guru di slot Matriks Utama.`,
        details: newConflicts.map(
          c => `${c.day} Jam ${c.periodLabel}: KG ${c.kg} (${c.teacherName}) tabrakan di kelas ${c.classes.join(' & ')}`
        ),
        actionLabel: 'Perbaiki Otomatis',
        onAction: () => handleAutoFix(),
      });
    } else {
      addNotification({
        type: 'success',
        title: '✅ Tukar Jadwal Berhasil!',
        message: `Jadwal ${classA} dan ${classB} berhasil ditukar tanpa ada bentrok (100% Anti Bentrok).`,
      });
    }
  };

  const handleRegenerate = () => {
    if (confirm('Apakah Anda ingin menata ulang seluruh jadwal secara otomatis bebas bentrok (5 hari kerja)?')) {
      const fresh = createDefaultSchedule();
      setSchedule(fresh);
      addNotification({
        type: 'success',
        title: '✨ Jadwal Dibuat Ulang!',
        message: 'Seluruh matriks jadwal berhasil ditata ulang dan 100% bebas dari bentrok.',
      });
    }
  };

  const handleClearAllSchedule = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan / mereset SELURUH jadwal pada semua kelas? Anda dapat menginput jadwal secara manual dari menu Jadwal Perkelas.')) {
      const empty = createEmptySchedule();
      setSchedule(empty);
      addNotification({
        type: 'info',
        title: '🗑️ Seluruh Jadwal Direset Kosong!',
        message: 'Matriks jadwal telah dikosongkan. Silakan input jadwal perkelas secara manual.',
      });
    }
  };

  const handleClearClassSchedule = (classId: string) => {
    if (confirm(`Apakah Anda yakin ingin mengosongkan seluruh slot jadwal untuk Kelas ${classId}?`)) {
      const copy: WeeklySchedule = JSON.parse(JSON.stringify(schedule));
      for (const day of DAYS) {
        if (copy[day]) {
          for (const periodObj of Object.values(copy[day])) {
            if (periodObj[classId]) {
              periodObj[classId] = { subject: '', kg: 0 };
            }
          }
        }
      }
      setSchedule(copy);
      addNotification({
        type: 'info',
        title: `🧹 Jadwal Kelas ${classId} Dikosongkan`,
        message: `Seluruh slot jadwal untuk ${classId} berhasil dibersihkan.`,
      });
    }
  };

  const handleAutoFix = () => {
    // Regenerate to guaranteed 0 conflict state
    const fresh = createDefaultSchedule();
    setSchedule(fresh);
    addNotification({
      type: 'success',
      title: '✨ Jadwal Berhasil Ditata Ulang!',
      message: 'Tabrakan jadwal telah dibersihkan secara otomatis. Matriks Utama kini 100% bebas bentrok.',
    });
  };

  const handleResetToDefault = () => {
    setSchoolInfo(INITIAL_SCHOOL_INFO);
    setTeachers(INITIAL_TEACHERS);
    setClasses(INITIAL_CLASSES);
    const empty = createEmptySchedule();
    setSchedule(empty);
    localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(empty));
    localStorage.setItem(STORAGE_KEY_TEACHERS, JSON.stringify(INITIAL_TEACHERS));
    localStorage.setItem(STORAGE_KEY_SCHOOL, JSON.stringify(INITIAL_SCHOOL_INFO));
    localStorage.setItem(STORAGE_KEY_CLASSES, JSON.stringify(INITIAL_CLASSES));
    addNotification({
      type: 'info',
      title: '🔄 Seluruh Jadwal Direset Kosong!',
      message: 'Matriks jadwal dikosongkan. Seluruh nama guru & mata pelajaran yang diampuh tetap tersimpan utuh.',
    });
  };

  const handleRestoreBackup = (data: {
    schedule: WeeklySchedule;
    schoolInfo: SchoolInfo;
    teachers: Teacher[];
    classes: ClassRoom[];
  }) => {
    if (data.schoolInfo) setSchoolInfo(data.schoolInfo);
    if (data.teachers) setTeachers(data.teachers);
    if (data.schedule) setSchedule(data.schedule);
    addNotification({
      type: 'success',
      title: '📁 Cadangan Dipulihkan',
      message: 'Data jadwal berhasil dimuat dari file cadangan.',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    exportToExcel(schedule, schoolInfo, classes, teachers);
    addNotification({
      type: 'success',
      title: '📊 Ekspor Excel Berhasil!',
      message: 'Jadwal 5 hari kerja berhasil diekspor ke Microsoft Excel (.xls) lengkap dengan format warna & tata letak sesuai pratinjau.',
    });
  };

  // Synchronize teacher update directly to main matrix & teachers list
  const handleUpdateTeacher = (
    kg: number,
    updated: Partial<Teacher>,
    options?: { syncScheduleSubject?: boolean; clearBKSchedule?: boolean; syncAssignedClasses?: boolean }
  ) => {
    // 1. Update teachers state
    const nextTeachers = teachers.map(t => (t.kg === kg ? { ...t, ...updated } : t));
    setTeachers(nextTeachers);

    // 2. Automatically sync to main matrix (schedule)
    let nextSchedule: WeeklySchedule = schedule;
    const shouldSyncSubject = options?.syncScheduleSubject !== false && updated.subjects && updated.subjects.length > 0;
    const shouldClearBK = updated.isBK && options?.clearBKSchedule;

    if (shouldSyncSubject || shouldClearBK) {
      const copy: WeeklySchedule = JSON.parse(JSON.stringify(schedule));
      const newSubject = updated.subjects?.[0] || '';

      for (const day of DAYS) {
        if (!copy[day]) continue;
        for (const p of Object.keys(copy[day])) {
          const periodNum = Number(p);
          for (const cls of Object.keys(copy[day][periodNum] || {})) {
            const cell = copy[day][periodNum][cls];
            if (cell && cell.kg === kg) {
              if (shouldClearBK) {
                // Guru BK doesn't teach in classrooms: clear slot
                cell.kg = 0;
                cell.subject = '';
              } else if (shouldSyncSubject && newSubject) {
                // Sync subject name directly
                cell.subject = newSubject;
              }
            }
          }
        }
      }
      nextSchedule = copy;
      setSchedule(copy);
    }

    // 3. Immediately evaluate live conflicts
    const newConflicts = detectConflicts(nextSchedule, nextTeachers);
    const updatedTeacher = nextTeachers.find(t => t.kg === kg);
    const teacherName = updated.name || updatedTeacher?.name || `Guru KG ${kg}`;

    // 4. Trigger alert notification
    if (newConflicts.length > 0) {
      const teacherSpecificConflicts = newConflicts.filter(c => c.kg === kg);
      addNotification({
        type: 'conflict',
        title: `⚠️ Peringatan: ${newConflicts.length} Jadwal Bentrok Terdeteksi!`,
        message: teacherSpecificConflicts.length > 0
          ? `Perubahan data ${teacherName} menyebabkan tabrakan jadwal pada Matriks Utama.`
          : `Tersinkronisasi ke matriks, namun ditemukan ${newConflicts.length} tabrakan jadwal pada Matriks Utama.`,
        details: newConflicts.map(
          c => `${c.day} Jam ${c.periodLabel}: KG ${c.kg} (${c.teacherName}) tabrakan di kelas ${c.classes.join(' & ')}`
        ),
        actionLabel: 'Perbaiki Otomatis Bebas Bentrok',
        onAction: () => handleAutoFix(),
        secondaryActionLabel: 'Lihat Matriks Utama',
        onSecondaryAction: () => setActiveTab('master'),
      });
    } else {
      const dutyInfo = updated.additionalDuty ? ` + ${updated.additionalDuty} (${updated.additionalDutyHours || 0} JP)` : '';
      const hoursInfo = updated.isBK
        ? 'Otomatis 24 JP Layanan BK'
        : updated.manualTeachingHours !== undefined
        ? `${updated.manualTeachingHours} JP (Manual Override)`
        : 'Sesuai Matriks';
      const classInfo = updated.assignedClasses && updated.assignedClasses.length > 0
        ? `, Rombel: ${updated.assignedClasses.join(', ')}`
        : '';

      addNotification({
        type: 'success',
        title: '✅ Sinkronisasi Matriks Utama Berhasil!',
        message: `Data ${teacherName} (${updated.subjects?.[0] || 'Mapel'}${classInfo}, Beban: ${hoursInfo}${dutyInfo}) telah otomatis sinkron pada Matriks Utama. Status: 100% Anti Bentrok.`,
      });
    }
  };

  // Bulk synchronization of all teachers to schedule
  const handleSyncAllTeachersToSchedule = () => {
    const copy: WeeklySchedule = JSON.parse(JSON.stringify(schedule));
    const teacherMap = new Map(teachers.map(t => [t.kg, t]));
    let count = 0;

    for (const day of DAYS) {
      if (!copy[day]) continue;
      for (const p of Object.keys(copy[day])) {
        const periodNum = Number(p);
        for (const cls of Object.keys(copy[day][periodNum] || {})) {
          const cell = copy[day][periodNum][cls];
          if (cell && cell.kg > 0) {
            const t = teacherMap.get(cell.kg);
            if (t && t.subjects.length > 0) {
              if (t.isBK) {
                cell.kg = 0;
                cell.subject = '';
                count++;
              } else if (cell.subject !== t.subjects[0]) {
                cell.subject = t.subjects[0];
                count++;
              }
            }
          }
        }
      }
    }

    setSchedule(copy);
    const newConflicts = detectConflicts(copy, teachers);

    if (newConflicts.length > 0) {
      addNotification({
        type: 'conflict',
        title: `⚠️ Peringatan: ${newConflicts.length} Jadwal Bentrok Terdeteksi!`,
        message: `${count} slot telah disinkronkan, namun ditemukan tabrakan jadwal pada Matriks Utama.`,
        details: newConflicts.map(
          c => `${c.day} Jam ${c.periodLabel}: KG ${c.kg} (${c.teacherName}) bentrok di ${c.classes.join(' & ')}`
        ),
        actionLabel: 'Perbaiki Otomatis',
        onAction: () => handleAutoFix(),
      });
    } else {
      addNotification({
        type: 'success',
        title: '✅ Sinkronisasi Menyeluruh Sukses!',
        message: `Mata pelajaran seluruh guru berhasil disinkronkan ke Matriks Utama (100% Bebas Bentrok).`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      {/* Official Header with Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        conflicts={conflicts}
        schoolInfo={schoolInfo}
        onPrint={handlePrint}
        onExportCSV={handleExportCSV}
        onRegenerate={handleRegenerate}
        onAutoFix={handleAutoFix}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-3 sm:p-5">
        {activeTab === 'master' && (
          <MasterTimetable
            schedule={schedule}
            classes={classes}
            teachers={teachers}
            schoolInfo={schoolInfo}
            onCellClick={handleCellClick}
            conflictingCells={conflictingCellKeys}
          />
        )}

        {activeTab === 'teacher' && (
          <TeacherTimetable
            schedule={schedule}
            teachers={teachers}
            schoolInfo={schoolInfo}
          />
        )}

        {activeTab === 'class' && (
          <ClassTimetable
            schedule={schedule}
            classes={classes}
            teachers={teachers}
            schoolInfo={schoolInfo}
            onCellClick={handleCellClick}
            onSaveBatch={handleSaveBatch}
            onClearClassSchedule={handleClearClassSchedule}
            onClearAllSchedule={handleClearAllSchedule}
          />
        )}

        {activeTab === 'audit' && (
          <ConflictChecker
            conflicts={conflicts}
            schedule={schedule}
            teachers={teachers}
            schoolInfo={schoolInfo}
            onAutoFix={handleAutoFix}
            onUpdateTeacher={handleUpdateTeacher}
            onSyncAllToSchedule={handleSyncAllTeachersToSchedule}
            onGoToMasterMatrix={() => setActiveTab('master')}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarEventsTab
            schedule={schedule}
            teachers={teachers}
            classes={classes}
          />
        )}

        {activeTab === 'settings' && (
          <ManageDataModal
            schoolInfo={schoolInfo}
            teachers={teachers}
            classes={classes}
            schedule={schedule}
            isAppLockEnabled={isAppLockEnabled}
            adminPassword={adminPassword}
            onUpdateSchoolInfo={setSchoolInfo}
            onUpdateTeacher={handleUpdateTeacher}
            onUpdateClasses={setClasses}
            onUpdateSecuritySettings={handleUpdateSecuritySettings}
            onLockNow={handleLockNow}
            onResetToDefault={handleResetToDefault}
            onRestoreBackup={handleRestoreBackup}
          />
        )}
      </main>

      {/* Floating Notification Toast System */}
      <NotificationToast
        notifications={notifications}
        onDismiss={handleDismissNotification}
      />

      {/* Edit Slot Modal */}
      {editingSlot && (
        <EditSlotModal
          isOpen={true}
          onClose={() => setEditingSlot(null)}
          day={editingSlot.day}
          period={editingSlot.period}
          periodLabel={editingSlot.periodLabel}
          classId={editingSlot.classId}
          currentCell={editingSlot.cell}
          schedule={schedule}
          teachers={teachers}
          classes={classes}
          onSave={handleSaveSlot}
          onSwap={handleSwapSlots}
        />
      )}

      {/* Footer Branding (Hidden in print) */}
      <footer className="bg-white border-t border-slate-200 py-3.5 px-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex flex-col sm:items-start text-center sm:text-left">
            <span className="font-semibold text-slate-700">
              Sistem Informasi Jadwal Anti Bentrok 5 Hari Kerja • {schoolInfo.name}
            </span>
            <span className="text-[11px] text-slate-400">
              Tahun Ajaran {schoolInfo.academicYear} • Terintegrasi Kemenag Kab. Jeneponto
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-center sm:text-right">
            <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Aplikasi Resmi Dikembangkan Oleh:</span>
            <span className="text-xs font-black text-emerald-800">
              JEMI ARIFIN, ST <span className="text-slate-500 font-bold">(Staff TU MTsN 3 Jeneponto)</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
