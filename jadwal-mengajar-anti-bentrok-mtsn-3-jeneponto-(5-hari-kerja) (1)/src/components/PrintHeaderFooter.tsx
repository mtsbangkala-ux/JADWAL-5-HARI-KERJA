import React from 'react';
import { SchoolInfo } from '../types/schedule';

interface PrintHeaderFooterProps {
  schoolInfo: SchoolInfo;
  title?: string;
  subtitle?: string;
}

export const PrintHeader: React.FC<PrintHeaderFooterProps> = ({
  schoolInfo,
  title = 'JADWAL MATA PELAJARAN SEMESTER I (GANJIL)',
  subtitle = 'SISTEM 5 HARI KERJA (SENIN - JUMAT)',
}) => {
  return (
    <div className="hidden print:block mb-2 print:mb-1 text-center border-b-2 border-double border-slate-800 pb-2 print:pb-1">
      <div className="flex items-center justify-between px-4">
        {/* Logo Kiri (Instansi / Kemenag RI) */}
        <div className="w-14 h-14 print:w-11 print:h-11 flex items-center justify-center shrink-0">
          {schoolInfo.logoLeft ? (
            <img
              src={schoolInfo.logoLeft}
              alt="Logo Kiri Kop Surat"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center border-2 border-emerald-800 rounded-full text-emerald-800 font-extrabold text-[9px] text-center p-0.5 leading-tight">
              KEMENAG RI
            </div>
          )}
        </div>

        <div className="flex-1 text-center px-3">
          <div className="text-[10px] print:text-[8pt] uppercase tracking-widest font-bold text-slate-700 leading-tight">
            {schoolInfo.type}
          </div>
          <h1 className="text-base print:text-sm font-black uppercase text-slate-900 tracking-tight leading-tight">
            {schoolInfo.name}
          </h1>
          <h2 className="text-xs print:text-[9.5pt] font-extrabold uppercase text-emerald-950 leading-tight">
            {title}
          </h2>
          <div className="text-[10px] print:text-[8pt] font-bold text-slate-700 leading-tight">
            TAHUN AJARAN {schoolInfo.academicYear} • {subtitle}
          </div>
        </div>

        {/* Logo Kanan (Madrasah / Sekolah) */}
        <div className="w-14 h-14 print:w-11 print:h-11 flex items-center justify-center shrink-0">
          {schoolInfo.logoRight ? (
            <img
              src={schoolInfo.logoRight}
              alt="Logo Kanan Kop Surat"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center border-2 border-teal-800 rounded-lg text-teal-800 font-bold text-[9px] text-center p-0.5 leading-tight">
              MTsN 3 JEP
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const PrintFooter: React.FC<{ schoolInfo: SchoolInfo }> = ({ schoolInfo }) => {
  return (
    <div className="hidden print:block mt-6 pt-3 text-xs text-slate-800">
      <div className="flex justify-between items-end px-8">
        <div>
          <div className="text-[11px] text-slate-600">
            <strong>Catatan:</strong>
            <div>1. Jadwal berlaku 5 hari kerja (Senin s/d Jumat).</div>
            <div>2. Guru hadir 15 menit sebelum jam pertama dimulai.</div>
            <div>3. Jumlah Peserta Didik: {schoolInfo.totalStudents} Siswa.</div>
          </div>
        </div>

        <div className="text-center w-72">
          <div>{schoolInfo.signatureCity}, {schoolInfo.signatureDate}</div>
          <div className="font-semibold">{schoolInfo.headmasterTitle} MTsN 3 Jeneponto,</div>
          <div className="h-16 flex items-center justify-center">
            {/* Signature space */}
            {schoolInfo.headmasterSignature ? (
              <img src={schoolInfo.headmasterSignature} alt="TTD Barcode Kepala Madrasah" className="max-h-16 max-w-[180px] object-contain my-0.5" />
            ) : (
              <span className="text-[10px] text-slate-400 italic">( Tanda Tangan & Cap )</span>
            )}
          </div>
          <div className="font-bold underline text-sm">{schoolInfo.headmasterName}</div>
          <div className="text-xs">NIP. {schoolInfo.headmasterNip}</div>
        </div>
      </div>
    </div>
  );
};
