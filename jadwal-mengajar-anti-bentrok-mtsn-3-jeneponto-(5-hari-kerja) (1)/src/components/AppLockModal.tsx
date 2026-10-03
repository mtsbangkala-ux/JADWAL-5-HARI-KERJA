import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, School, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SchoolInfo } from '../types/schedule';

interface AppLockModalProps {
  isOpen: boolean;
  schoolInfo: SchoolInfo;
  adminPassword: string;
  onUnlockSuccess: () => void;
}

export const AppLockModal: React.FC<AppLockModalProps> = ({
  isOpen,
  schoolInfo,
  adminPassword,
  onUnlockSuccess,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === adminPassword) {
      setErrorMsg('');
      onUnlockSuccess();
    } else {
      setErrorMsg('Kata sandi salah! Silakan coba lagi.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden transition-all transform ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

          {/* School Logos / Icon */}
          <div className="flex items-center justify-center gap-3 mb-3">
            {schoolInfo.logoLeft ? (
              <img src={schoolInfo.logoLeft} alt="Logo Left" className="w-12 h-12 object-contain bg-white/20 p-1 rounded-xl border border-white/30" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <School className="w-6 h-6 text-emerald-200" />
              </div>
            )}

            <div className="w-10 h-10 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-sm shadow-md">
              <Lock className="w-5 h-5" />
            </div>

            {schoolInfo.logoRight ? (
              <img src={schoolInfo.logoRight} alt="Logo Right" className="w-12 h-12 object-contain bg-white/20 p-1 rounded-xl border border-white/30" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <ShieldCheck className="w-6 h-6 text-emerald-200" />
              </div>
            )}
          </div>

          <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-950/70 text-emerald-200 px-3 py-1 rounded-full border border-emerald-500/30">
            LOGIN APLIKASI
          </span>

          <h2 className="text-xl font-black tracking-tight mt-2 uppercase text-white">
            LOGIN
          </h2>

          <div className="text-[11px] font-bold text-amber-200 mt-1 bg-emerald-950/60 py-1 px-3 rounded-lg border border-emerald-500/30 inline-block shadow-2xs">
            Pengembang : JEMI ARIFIN, ST (Staff TU MTsN 3 Jeneponto)
          </div>

          <h3 className="text-xs font-bold text-emerald-100 mt-2">
            {schoolInfo.name}
          </h3>
          <p className="text-[11px] text-emerald-100/90 font-medium">
            Sistem Informasi Jadwal Pelajaran 5 Hari Kerja
          </p>
        </div>

        {/* Lock Form Body */}
        <form onSubmit={handleUnlock} className="p-6 space-y-4">
          <div className="text-center space-y-1.5">
            <h3 className="text-base font-black text-slate-900 flex items-center justify-center gap-1.5 uppercase">
              <KeyRound className="w-4 h-4 text-emerald-700" />
              LOGIN
            </h3>
            <div className="text-xs font-bold text-emerald-900 bg-emerald-50 py-1 px-3 rounded-lg border border-emerald-200 inline-block">
              Pengembang : JEMI ARIFIN, ST (Staff TU MTsN 3 Jeneponto)
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Aplikasi disetujui hanya dibuka oleh Admin/Operator Madrasah yang memiliki password resmi.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-rose-700 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              Password Admin:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="Masukkan kata sandi..."
                autoFocus
                className="w-full text-sm font-semibold px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Buka Kunci Aplikasi</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center text-[11px] text-slate-400 border-t border-slate-100">
            Password Default: <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold">admin123</code> (Dapat diubah di Pengaturan Master)
          </div>
        </form>
      </div>
    </div>
  );
};
