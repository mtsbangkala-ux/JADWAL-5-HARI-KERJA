import React, { useState } from 'react';
import {
  Settings,
  Building,
  Users,
  RotateCcw,
  Save,
  Check,
  Download,
  Upload,
  Clock,
  UserCheck,
  Briefcase,
  Image as ImageIcon,
  Sparkles,
  GraduationCap,
  Lock,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ClassRoom, SchoolInfo, Teacher, WeeklySchedule } from '../types/schedule';
import { exportBackupJSON } from '../utils/exportUtils';
import { ADDITIONAL_DUTY_OPTIONS } from '../data/initialData';
import { LOGO_PRESETS_LEFT, LOGO_PRESETS_RIGHT, SVG_BARCODE_HEADMASTER_SIGNATURE } from '../utils/logoPresets';

interface ManageDataModalProps {
  schoolInfo: SchoolInfo;
  teachers: Teacher[];
  classes: ClassRoom[];
  schedule: WeeklySchedule;
  isAppLockEnabled?: boolean;
  adminPassword?: string;
  onUpdateSchoolInfo: (info: SchoolInfo) => void;
  onUpdateTeacher: (kg: number, updated: Partial<Teacher>) => void;
  onUpdateClasses?: (classes: ClassRoom[]) => void;
  onUpdateSecuritySettings?: (enabled: boolean, newPass: string) => void;
  onLockNow?: () => void;
  onResetToDefault: () => void;
  onRestoreBackup: (data: { schedule: WeeklySchedule; schoolInfo: SchoolInfo; teachers: Teacher[]; classes: ClassRoom[] }) => void;
}

export const ManageDataModal: React.FC<ManageDataModalProps> = ({
  schoolInfo,
  teachers,
  classes,
  schedule,
  isAppLockEnabled = false,
  adminPassword = 'admin123',
  onUpdateSchoolInfo,
  onUpdateTeacher,
  onUpdateClasses,
  onUpdateSecuritySettings,
  onLockNow,
  onResetToDefault,
  onRestoreBackup,
}) => {
  const [subTab, setSubTab] = useState<'info' | 'teachers' | 'schedule_time' | 'security' | 'backup'>('info');

  // Form states
  const [infoForm, setInfoForm] = useState<SchoolInfo>({ ...schoolInfo });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Security Form States
  const [lockEnabled, setLockEnabled] = useState(isAppLockEnabled);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [secMsg, setSecMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setSecMsg(null);

    // If changing password
    if (newPassInput || confirmPassInput) {
      if (currentPassInput !== adminPassword) {
        setSecMsg({ type: 'error', text: 'Password lama tidak cocok!' });
        return;
      }
      if (newPassInput.length < 4) {
        setSecMsg({ type: 'error', text: 'Password baru minimal 4 karakter!' });
        return;
      }
      if (newPassInput !== confirmPassInput) {
        setSecMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok!' });
        return;
      }
    }

    const finalPass = newPassInput ? newPassInput : adminPassword;
    if (onUpdateSecuritySettings) {
      onUpdateSecuritySettings(lockEnabled, finalPass);
    }

    setSecMsg({ type: 'success', text: 'Pengaturan keamanan dan password berhasil diperbarui!' });
    setCurrentPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
    setTimeout(() => setSecMsg(null), 3000);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSchoolInfo(infoForm);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoLeft' | 'logoRight' | 'headmasterSignature') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const result = event.target?.result as string;
      if (result) {
        setInfoForm(prev => ({ ...prev, [field]: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleWaliKelasChange = (classId: string, waliName: string) => {
    const nextClasses = classes.map(c => (c.id === classId ? { ...c, waliKelas: waliName } : c));
    if (onUpdateClasses) {
      onUpdateClasses(nextClasses);
    }

    const classCode = classId.replace('Kelas ', '').trim();
    const matchedTeacher = teachers.find(t => t.name === waliName);

    if (matchedTeacher) {
      onUpdateTeacher(matchedTeacher.kg, {
        internalDuty: `Wali Kelas ${classCode}`,
        internalDutyHours: 6,
      });
    }
  };

  const handleExportJSON = () => {
    exportBackupJSON({
      schedule,
      schoolInfo: infoForm,
      teachers,
      classes,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.schedule && parsed.schoolInfo && parsed.teachers) {
          onRestoreBackup(parsed);
          alert('Data jadwal dan master guru berhasil dipulihkan!');
        } else {
          alert('Format file cadangan tidak valid.');
        }
      } catch (err) {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Settings Navigation Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-300" />
            Pengaturan Master Data MTsN 3 Jeneponto
          </h2>
          <p className="text-xs text-emerald-100">
            Kelola identitas madrasah, tanda tangan pimpinan, daftar guru, dan cadangan data.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Apakah Anda yakin ingin mengatur ulang jadwal ke setelan awal MTsN 3 Jeneponto?')) {
              onResetToDefault();
            }
          }}
          className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset ke Awal (Default)</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 px-6">
        <button
          onClick={() => setSubTab('info')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            subTab === 'info'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Identitas Madrasah & Kepala
        </button>
        <button
          onClick={() => setSubTab('teachers')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            subTab === 'teachers'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daftar 38 Guru (KG)
        </button>
        <button
          onClick={() => setSubTab('schedule_time')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            subTab === 'schedule_time'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Jam Belajar 5 Hari Kerja
        </button>

        <button
          onClick={() => setSubTab('backup')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            subTab === 'backup'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Cadangan & Pemulihan (Backup)
        </button>
      </div>

      <div className="p-6">
        {/* TAB 1: INFO MADRASAH */}
        {subTab === 'info' && (
          <form onSubmit={handleSaveInfo} className="max-w-3xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Madrasah:
                </label>
                <input
                  type="text"
                  value={infoForm.name}
                  onChange={e => setInfoForm({ ...infoForm, name: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instansi / Kemenag:
                </label>
                <input
                  type="text"
                  value={infoForm.type}
                  onChange={e => setInfoForm({ ...infoForm, type: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tahun Ajaran:
                </label>
                <input
                  type="text"
                  value={infoForm.academicYear}
                  onChange={e => setInfoForm({ ...infoForm, academicYear: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Semester:
                </label>
                <input
                  type="text"
                  value={infoForm.semester}
                  onChange={e => setInfoForm({ ...infoForm, semester: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Kepala Madrasah:
                </label>
                <input
                  type="text"
                  value={infoForm.headmasterName}
                  onChange={e => setInfoForm({ ...infoForm, headmasterName: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  NIP Kepala Madrasah:
                </label>
                <input
                  type="text"
                  value={infoForm.headmasterNip}
                  onChange={e => setInfoForm({ ...infoForm, headmasterNip: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kota Tanda Tangan:
                </label>
                <input
                  type="text"
                  value={infoForm.signatureCity}
                  onChange={e => setInfoForm({ ...infoForm, signatureCity: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Pengesahan:
                </label>
                <input
                  type="text"
                  value={infoForm.signatureDate}
                  onChange={e => setInfoForm({ ...infoForm, signatureDate: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* SECTION INPUT LOGO KIRI & LOGO KANAN KOP SURAT */}
            <div className="border border-slate-200 rounded-xl bg-slate-50 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    Input Logo Kop Surat (Logo Kiri & Logo Kanan)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Unggah gambar logo (PNG/JPG/SVG) dari komputer Anda atau pilih dari preset logo resmi instansi/madrasah.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LOGO KIRI */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      Logo Kiri (Instansi / Kemenag RI)
                    </label>
                    {infoForm.logoLeft && (
                      <button
                        type="button"
                        onClick={() => setInfoForm({ ...infoForm, logoLeft: '' })}
                        className="text-[10px] text-rose-600 hover:underline font-semibold"
                      >
                        Hapus Logo
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 p-1">
                      {infoForm.logoLeft ? (
                        <img src={infoForm.logoLeft} alt="Preview Logo Kiri" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-[9px] text-slate-400 text-center font-bold">KEMENAG</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pilih File Logo Kiri:</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleImageUpload(e, 'logoLeft')}
                          className="w-full text-[11px] text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-emerald-100 file:text-emerald-800 hover:file:bg-emerald-200 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Atau Gunakan Preset Logo Kiri:</label>
                        <div className="flex flex-wrap gap-1">
                          {LOGO_PRESETS_LEFT.map(preset => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setInfoForm({ ...infoForm, logoLeft: preset.dataUrl })}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-900 border border-slate-200 cursor-pointer"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">URL Logo Kiri (Opsional):</label>
                    <input
                      type="text"
                      placeholder="https://... atau data:image/..."
                      value={infoForm.logoLeft || ''}
                      onChange={e => setInfoForm({ ...infoForm, logoLeft: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* LOGO KANAN */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                      Logo Kanan (Madrasah / Sekolah)
                    </label>
                    {infoForm.logoRight && (
                      <button
                        type="button"
                        onClick={() => setInfoForm({ ...infoForm, logoRight: '' })}
                        className="text-[10px] text-rose-600 hover:underline font-semibold"
                      >
                        Hapus Logo
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 p-1">
                      {infoForm.logoRight ? (
                        <img src={infoForm.logoRight} alt="Preview Logo Kanan" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-[9px] text-slate-400 text-center font-bold">MADRASAH</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pilih File Logo Kanan:</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleImageUpload(e, 'logoRight')}
                          className="w-full text-[11px] text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-teal-100 file:text-teal-800 hover:file:bg-teal-200 cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Atau Gunakan Preset Logo Kanan:</label>
                        <div className="flex flex-wrap gap-1">
                          {LOGO_PRESETS_RIGHT.map(preset => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setInfoForm({ ...infoForm, logoRight: preset.dataUrl })}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-teal-100 hover:text-teal-900 border border-slate-200 cursor-pointer"
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">URL Logo Kanan (Opsional):</label>
                    <input
                      type="text"
                      placeholder="https://... atau data:image/..."
                      value={infoForm.logoRight || ''}
                      onChange={e => setInfoForm({ ...infoForm, logoRight: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Realtime Kop Surat Preview */}
              <div className="bg-white p-3 rounded-xl border border-slate-300 space-y-1">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Pratinjau Kop Surat Resmi Saat Ini:
                </div>
                <div className="flex items-center justify-between border-b-2 border-double border-slate-800 pb-2 px-3">
                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    {infoForm.logoLeft ? (
                      <img src={infoForm.logoLeft} alt="Kiri" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="w-10 h-10 border border-slate-300 text-[8px] flex items-center justify-center text-slate-400 font-bold">LOGOKIRI</div>
                    )}
                  </div>

                  <div className="text-center flex-1 px-2">
                    <div className="text-[9px] font-bold uppercase text-slate-600">{infoForm.type}</div>
                    <div className="text-xs font-black uppercase text-slate-900">{infoForm.name}</div>
                    <div className="text-[10px] font-bold uppercase text-emerald-800">JADWAL PELAJARAN SEMESTER {infoForm.semester}</div>
                  </div>

                  <div className="w-12 h-12 flex items-center justify-center shrink-0">
                    {infoForm.logoRight ? (
                      <img src={infoForm.logoRight} alt="Kanan" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="w-10 h-10 border border-slate-300 text-[8px] flex items-center justify-center text-slate-400 font-bold">LOGOKANAN</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION INPUT TTD BARCODE KEPALA MADRASAH */}
            <div className="border border-emerald-300 rounded-xl bg-emerald-50/50 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <div>
                  <h3 className="text-xs font-black text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    Upload / Kelola Tanda Tangan Barcode Kepala Madrasah
                  </h3>
                  <p className="text-[11px] text-emerald-800">
                    Unggah gambar TTD/Barcode/QR Code pengesahan Kepala Madrasah (PNG/JPG/SVG) dari komputer Anda, atau gunakan preset Barcode resmi.
                  </p>
                </div>
                {infoForm.headmasterSignature && (
                  <button
                    type="button"
                    onClick={() => setInfoForm({ ...infoForm, headmasterSignature: '' })}
                    className="text-[11px] text-rose-600 hover:underline font-bold bg-white px-2.5 py-1 rounded border border-rose-200 cursor-pointer shadow-2xs"
                  >
                    Hapus TTD Barcode
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload File & Preset Button */}
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1">
                      1. Pilih File Gambar TTD / Barcode (PNG / JPG / SVG):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageUpload(e, 'headmasterSignature')}
                      className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-800 file:text-white hover:file:bg-emerald-900 cursor-pointer"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1">
                      2. Atau Gunakan Preset Barcode Verifikasi Resmi:
                    </label>
                    <button
                      type="button"
                      onClick={() => setInfoForm({ ...infoForm, headmasterSignature: SVG_BARCODE_HEADMASTER_SIGNATURE })}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition-all cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Gunakan Barcode TTD Sah MTsN 3 Jeneponto</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">URL / Data URI TTD (Opsional):</label>
                    <input
                      type="text"
                      placeholder="https://... atau data:image/..."
                      value={infoForm.headmasterSignature || ''}
                      onChange={e => setInfoForm({ ...infoForm, headmasterSignature: e.target.value })}
                      className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Live Signature Stamp Preview */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-300 space-y-2 flex flex-col justify-between">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Pratinjau Tanda Tangan Pengesahan Dokumen:
                  </div>

                  <div className="border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50 text-center min-h-[110px] flex flex-col items-center justify-center">
                    <div className="text-xs text-slate-600 font-semibold mb-0.5">
                      {infoForm.signatureCity}, {infoForm.signatureDate}
                    </div>
                    <div className="text-xs font-bold text-slate-900">{infoForm.headmasterTitle},</div>

                    {/* TTD Image or Fallback */}
                    <div className="my-1.5 h-16 flex items-center justify-center">
                      {infoForm.headmasterSignature ? (
                        <img
                          src={infoForm.headmasterSignature}
                          alt="TTD Barcode Kepala Madrasah"
                          className="max-h-16 max-w-[210px] object-contain"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 italic font-semibold">( Belum ada TTD Barcode )</span>
                      )}
                    </div>

                    <div className="font-bold underline text-xs text-slate-950">{infoForm.headmasterName}</div>
                    <div className="text-[11px] text-slate-600">NIP. {infoForm.headmasterNip}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Identitas</span>
              </button>
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Berhasil disimpan!
                </span>
              )}
            </div>
          </form>
        )}

        {/* TAB 2: DAFTAR GURU */}
        {subTab === 'teachers' && (
          <div className="space-y-5">
            {/* CARD PENETAPAN WALI KELAS PER ROMBEL */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-700" />
                    Penetapan Wali Kelas 13 Rombel (Untuk Tanda Tangan Jadwal Per Kelas)
                  </h3>
                  <p className="text-[11px] text-emerald-800">
                    Pilih nama guru yang menjadi Wali Kelas untuk tiap rombel. Pilihan ini otomatis tersinkronisasi ke nama Wali Kelas di lembar cetak jadwal kelas dan ekuivalensi jam (+6 JP).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {classes.map(cls => {
                  const currentWali = cls.waliKelas || '';
                  return (
                    <div key={cls.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                          Kelas {cls.id}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold">
                          Tingkat {cls.grade}
                        </span>
                      </div>

                      <select
                        value={currentWali}
                        onChange={e => handleWaliKelasChange(cls.id, e.target.value)}
                        className="w-full text-[11px] font-semibold px-2 py-1 rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="">-- Pilih Wali Kelas --</option>
                        {teachers.map(t => (
                          <option key={t.kg} value={t.name}>
                            KG {t.kg} - {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-slate-600 font-semibold pt-2">
              Daftar Seluruh 38 Tenaga Pendidik MTsN 3 Jeneponto & Ekuivalensi Tugas Tambahan:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {teachers.map(t => (
                <div key={t.kg} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col justify-between gap-2.5">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-black flex items-center justify-center text-xs shrink-0">
                      {t.kg}
                    </span>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        defaultValue={t.name}
                        onBlur={e => onUpdateTeacher(t.kg, { name: e.target.value })}
                        className="w-full font-bold text-xs text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-white focus:outline-none px-1 rounded"
                      />
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate px-1">
                        {t.subjects.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-emerald-700" />
                      Tugas Tambahan:
                    </label>
                    <select
                      value={t.additionalDuty || ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (!val) {
                          onUpdateTeacher(t.kg, { additionalDuty: undefined, additionalDutyHours: 0 });
                        } else {
                          const found = ADDITIONAL_DUTY_OPTIONS.find(o => o.name === val);
                          onUpdateTeacher(t.kg, {
                            additionalDuty: val,
                            additionalDutyHours: found ? found.hours : 6,
                          });
                        }
                      }}
                      className="w-full text-[11px] font-medium px-2 py-1 rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="">(Tidak Ada Tugas Tambahan)</option>
                      <optgroup label="Wakamad (12 JP)">
                        {ADDITIONAL_DUTY_OPTIONS.filter(o => o.category === 'wakamad').map(o => (
                          <option key={o.name} value={o.name}>{o.name} (+12 JP)</option>
                        ))}
                      </optgroup>
                      <optgroup label="Kepala Lab & Perpus (12 JP)">
                        {ADDITIONAL_DUTY_OPTIONS.filter(o => ['kepala_lab', 'kepala_perpus'].includes(o.category)).map(o => (
                          <option key={o.name} value={o.name}>{o.name} (+12 JP)</option>
                        ))}
                      </optgroup>
                      <optgroup label="Wali Kelas (6 JP)">
                        {ADDITIONAL_DUTY_OPTIONS.filter(o => o.category === 'wali_kelas').map(o => (
                          <option key={o.name} value={o.name}>{o.name} (+6 JP)</option>
                        ))}
                      </optgroup>
                      <optgroup label="Pembina OSIM & Ekskul (3 - 6 JP)">
                        {ADDITIONAL_DUTY_OPTIONS.filter(o => o.category === 'pembina').map(o => (
                          <option key={o.name} value={o.name}>{o.name} (+{o.hours} JP)</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: JAM BELAJAR 5 HARI KERJA */}
        {subTab === 'schedule_time' && (
          <div className="space-y-4 max-w-3xl text-xs text-slate-700">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h4 className="font-bold text-emerald-900 text-sm mb-1">
                Struktur Jam Belajar 5 Hari Kerja (Sesuai Jadwal Resmi)
              </h4>
              <p className="text-slate-600 text-xs">
                Sistem 5 hari kerja diatur secara komprehensif mengintegrasikan seluruh muatan kurikulum (40 JP/minggu) tanpa hari Sabtu:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <h5 className="font-bold text-slate-900 border-b pb-1">Senin s/d Kamis: Jam Belajar Harian</h5>
                <ul className="space-y-1 font-mono text-[11px] text-slate-600">
                  <li>• 07.00 - 07.30: Upacara Bendera / Pembiasaan</li>
                  <li>• Jam I (07.30 - 08.10) & Jam II (08.10 - 08.50)</li>
                  <li>• Jam III (08.50 - 09.30) & Jam IV (09.30 - 10.10)</li>
                  <li>• 10.10 - 10.30: Istirahat I (Snack & Sholat Dhuha)</li>
                  <li>• Jam V (10.30 - 11.10) & Jam VI (11.10 - 11.50)</li>
                  <li>• 11.50 - 12.30: Istirahat II (Ishoma / Sholat Dhuhur)</li>
                  <li>• Jam VII (12.30 - 13.10), VIII (13.10 - 13.50), IX (13.50 - 14.30) & X (14.30 - 15.10)</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <h5 className="font-bold text-slate-900 border-b pb-1">Jumat: 6 Jam Pelajaran (Selesai Jam 11.50 WITA)</h5>
                <ul className="space-y-1 font-mono text-[11px] text-slate-600">
                  <li>• Jam I (07.30 - 08.10) & Jam II (08.10 - 08.50)</li>
                  <li>• Jam III (08.50 - 09.30) & Jam IV (09.30 - 10.10)</li>
                  <li>• 10.10 - 10.30: Istirahat Pagi</li>
                  <li>• Jam V (10.30 - 11.10) & Jam VI (11.10 - 11.50)</li>
                  <li>• 11.50 WITA: KBM Selesai (Persiapan Sholat Jumat)</li>
                </ul>
              </div>
            </div>
          </div>
        )}



        {/* TAB 5: BACKUP & RESTORE */}
        {subTab === 'backup' && (
          <div className="space-y-4 max-w-xl">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Ekspor Cadangan Lengkap (JSON)
              </h4>
              <p className="text-xs text-slate-600">
                Unduh file cadangan yang berisi seluruh susunan jadwal, pengaturan guru, dan data madrasah agar dapat dipulihkan di komputer lain.
              </p>
              <button
                onClick={handleExportJSON}
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Cadangan JSON</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Pulihkan Cadangan (Restore)
              </h4>
              <p className="text-xs text-slate-600">
                Unggah file cadangan JSON yang sebelumnya diunduh untuk mengembalikan susunan jadwal.
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-100 file:text-emerald-900 hover:file:bg-emerald-200 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
