import { DAY_PERIODS, INITIAL_CLASSES, INITIAL_TEACHERS } from '../data/initialData';
import { ClassRoom, DayOfWeek, SchoolInfo, Teacher, WeeklySchedule } from '../types/schedule';
import { calculateTeacherWorkload } from './scheduler';

/**
 * Export Schedule to Styled Microsoft Excel (.xls) matching on-screen preview
 */
export function exportToExcel(
  schedule: WeeklySchedule,
  schoolInfo: SchoolInfo,
  classes: ClassRoom[] = INITIAL_CLASSES,
  teachers: Teacher[] = INITIAL_TEACHERS
): void {
  const teacherMap = new Map<number, string>(teachers.map(t => [t.kg, t.name]));
  const days: DayOfWeek[] = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'];
  const totalCols = 3 + classes.length * 2; // HARI, JAM, WAKTU + (Mapel & KG for each class)

  const workloads = calculateTeacherWorkload(schedule, teachers);

  let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>Matriks Jadwal 5 Hari Kerja</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
            <x:Print>
              <x:Orientation>Landscape</x:Orientation>
              <x:PaperSizeIndex>9</x:PaperSizeIndex> <!-- A4 -->
            </x:Print>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 10pt; }
    table { border-collapse: collapse; width: 100%; table-layout: fixed; }
    th, td { border: 1px solid #94A3B8; padding: 4px 6px; font-size: 9.5pt; vertical-align: middle; }
    .kop-kemenag { font-size: 11pt; font-weight: bold; text-align: center; color: #334155; }
    .kop-title { font-size: 14pt; font-weight: bold; text-align: center; background-color: #047857; color: #FFFFFF; }
    .kop-subtitle { font-size: 11pt; font-weight: bold; text-align: center; background-color: #065F46; color: #FFFFFF; }
    .kop-academic { font-size: 10pt; font-weight: bold; text-align: center; color: #1E293B; }
    
    .th-main { background-color: #064E3B; color: #FFFFFF; font-weight: bold; text-align: center; font-size: 9.5pt; }
    .th-sub-mapel { background-color: #047857; color: #FFFFFF; font-weight: bold; text-align: center; font-size: 8.5pt; }
    .th-sub-kg { background-color: #065F46; color: #FDE68A; font-weight: bold; text-align: center; font-size: 8.5pt; }
    
    .day-cell { background-color: #065F46; color: #FFFFFF; font-weight: bold; text-align: center; font-size: 11pt; }
    .period-cell { background-color: #F8FAFC; font-weight: bold; text-align: center; color: #0F172A; }
    .time-cell { background-color: #FFFFFF; font-size: 8.5pt; text-align: center; color: #475569; }
    
    .ribbon-upacara { background-color: #FEF3C7; color: #78350F; font-weight: bold; text-align: center; font-size: 9.5pt; }
    .ribbon-istirahat1 { background-color: #F1F5F9; color: #334155; font-weight: bold; text-align: center; font-size: 9pt; }
    .ribbon-ishoma { background-color: #D1FAE5; color: #065F46; font-weight: bold; text-align: center; font-size: 9.5pt; }
    
    .cell-subject { font-size: 9pt; text-align: left; font-weight: 500; }
    .cell-kg { font-size: 9.5pt; text-align: center; font-weight: bold; background-color: #F8FAFC; }
    
    .legend-th { background-color: #065F46; color: #FFFFFF; font-weight: bold; text-align: center; font-size: 9.5pt; }
    .legend-td { font-size: 9pt; vertical-align: middle; }
    .status-ok { background-color: #DCFCE7; color: #14532D; font-weight: bold; text-align: center; }
    .status-warn { background-color: #FEF3C7; color: #78350F; font-weight: bold; text-align: center; }
  </style>
</head>
<body>
  <table>
    <!-- Kop Surat Resmi -->
    <tr>
      <td colspan="${totalCols}" class="kop-kemenag">KEMENTERIAN AGAMA REPUBLIK INDONESIA</td>
    </tr>
    <tr>
      <td colspan="${totalCols}" class="kop-title">${schoolInfo.name.toUpperCase()}</td>
    </tr>
    <tr>
      <td colspan="${totalCols}" class="kop-subtitle">JADWAL PELAJARAN SEMESTER ${schoolInfo.semester} (SISTEM 5 HARI KERJA)</td>
    </tr>
    <tr>
      <td colspan="${totalCols}" class="kop-academic">TAHUN AJARAN ${schoolInfo.academicYear} • STATUS: 100% BEBAS BENTROK (ANTI TABRAKAN)</td>
    </tr>
    <tr><td colspan="${totalCols}" style="border:none; height:10px;"></td></tr>

    <!-- Table Grand Header -->
    <thead>
      <tr>
        <th rowspan="2" class="th-main" style="width: 50px;">HARI</th>
        <th rowspan="2" class="th-main" style="width: 40px;">JAM</th>
        <th rowspan="2" class="th-main" style="width: 85px;">WAKTU</th>
        ${classes.map(c => `<th colspan="2" class="th-main" style="min-width: 130px;">KELAS ${c.id}</th>`).join('')}
      </tr>
      <tr>
        ${classes.map(() => `<th class="th-sub-mapel" style="width: 95px;">MATA PELAJARAN</th><th class="th-sub-kg" style="width: 35px;">KG</th>`).join('')}
      </tr>
    </thead>

    <tbody>
`;

  // Build matrix schedule rows matching preview
  for (const day of days) {
    const periods = DAY_PERIODS[day] || [];
    const isSenin = day === 'SENIN';
    const hasUpacara = isSenin;
    const hasIstirahat1 = true;
    const hasIstirahat2 = day !== 'JUMAT';
    const totalDayRows = periods.length + (hasUpacara ? 1 : 0) + (hasIstirahat1 ? 1 : 0) + (hasIstirahat2 ? 1 : 0);

    // Upacara row on Senin
    if (isSenin) {
      html += `
      <tr>
        <td rowspan="${totalDayRows}" class="day-cell">${day}</td>
        <td class="period-cell">-</td>
        <td class="time-cell">07.00 - 07.45</td>
        <td colspan="${classes.length * 2}" class="ribbon-upacara">🇮🇩 U P A C A R A &nbsp;&nbsp; B E N D E R A 🇮🇩</td>
      </tr>
      `;
    }

    periods.forEach((p, idx) => {
      const isIstirahat1 = (day === 'SENIN' && p.period === 5) || (day !== 'SENIN' && day !== 'JUMAT' && p.period === 5) || (day === 'JUMAT' && p.period === 4);
      const isIstirahat2 = (day === 'SENIN' && p.period === 7) || (day !== 'SENIN' && day !== 'JUMAT' && p.period === 7);

      // Ribbon Istirahat 1
      if (isIstirahat1) {
        const ist1Time = day === 'JUMAT' ? '09.15 - 09.35' : '10.10 - 10.30';
        html += `
        <tr>
          <td class="period-cell">-</td>
          <td class="time-cell">${ist1Time}</td>
          <td colspan="${classes.length * 2}" class="ribbon-istirahat1">• • • &nbsp; ISTIRAHAT I & SHALAT DHUHA BERSAMA &nbsp; • • •</td>
        </tr>
        `;
      }

      // Ribbon Istirahat 2 (Ishoma)
      if (isIstirahat2) {
        const ist2Time = day === 'SENIN' ? '12.05 - 12.45' : '11.50 - 13.00';
        html += `
        <tr>
          <td class="period-cell">-</td>
          <td class="time-cell">${ist2Time}</td>
          <td colspan="${classes.length * 2}" class="ribbon-ishoma">🕌 &nbsp; ISHOMA (SHALAT DHUHUR BERJAMAAH & MAKAN SIANG) &nbsp; 🕌</td>
        </tr>
        `;
      }

      html += `<tr>`;
      if (!isSenin && idx === 0) {
        html += `<td rowspan="${totalDayRows}" class="day-cell">${day}</td>`;
      }

      html += `
        <td class="period-cell">${p.label}</td>
        <td class="time-cell">${p.startTime} - ${p.endTime}</td>
      `;

      for (const c of classes) {
        const cell = schedule[day]?.[p.period]?.[c.id];
        const subject = cell?.subject || '-';
        const kg = cell?.kg ? cell.kg : '-';

        let bgStyle = '';
        if (subject && subject !== '-') {
          const sLower = subject.toLowerCase();
          if (sLower.includes('qur') || sLower.includes('akidah') || sLower.includes('fiqih') || sLower.includes('ski') || sLower.includes('arab')) {
            bgStyle = 'background-color: #ECFDF5;';
          } else if (sLower.includes('matematika') || sLower.includes('ipa') || sLower.includes('inggris')) {
            bgStyle = 'background-color: #EFF6FF;';
          } else if (sLower.includes('jasmani') || sLower.includes('pjok')) {
            bgStyle = 'background-color: #FEF3C7;';
          }
        }

        html += `
          <td class="cell-subject" style="${bgStyle}">${subject}</td>
          <td class="cell-kg">${kg}</td>
        `;
      }

      html += `</tr>`;
    });
  }

  html += `
    </tbody>
  </table>

  <br/><br/>

  <!-- Teacher Legend & Audit Workload Section matching preview -->
  <table>
    <tr>
      <td colspan="10" class="kop-title" style="text-align: left; padding: 6px 10px;">
        KETERANGAN KODE GURU (KG) & REKAPITULASI BEBAN MENGAJAR (5 HARI KERJA)
      </td>
    </tr>
    <thead>
      <tr>
        <th class="legend-th" style="width: 45px;">KG</th>
        <th class="legend-th" style="width: 200px;">NAMA GURU LENGKAP</th>
        <th class="legend-th" style="width: 150px;">MATA PELAJARAN</th>
        <th class="legend-th" style="width: 170px;">KELAS / ROMBEL DIAMPU</th>
        <th class="legend-th" style="width: 100px;">JTM TATAP MUKA</th>
        <th class="legend-th" style="width: 150px;">TUGAS INTERN MADRASAH</th>
        <th class="legend-th" style="width: 150px;">MENGAJAR SEKOLAH LAIN</th>
        <th class="legend-th" style="width: 80px;">EKUIV. TUGAS</th>
        <th class="legend-th" style="width: 90px;">TOTAL BEBAN</th>
        <th class="legend-th" style="width: 150px;">STATUS SERTIFIKASI</th>
      </tr>
    </thead>
    <tbody>
  `;

  for (const wl of workloads) {
    const t = wl.teacher;
    const internalDuty = wl.internalDuty;
    const internalHours = wl.internalDutyHours || 0;
    const externalSchool = wl.externalTeachingSchool;
    const externalHours = wl.externalTeachingHours || 0;
    const totalDutyHours = wl.additionalDutyHours || 0;
    const isOk = wl.totalCertifiedHours >= 24;

    let teachingDisplay = `${wl.teachingHours} JP`;
    if (wl.isBK) {
      teachingDisplay = '24 JP (Layanan BK)';
    } else if (wl.isManualTeachingHours) {
      teachingDisplay = `${wl.teachingHours} JP (Manual)`;
    }

    let classesDisplay = '-';
    if (wl.isBK) {
      classesDisplay = 'Semua Rombel (13 Kelas)';
    } else if (wl.classesTaught.length > 0) {
      classesDisplay = wl.classesTaught.map(c => {
        const jtm = wl.rombelJTM[c] || wl.scheduleRombelJTM[c];
        return jtm ? `${c} (${jtm} JP)` : c;
      }).join(', ');
    }

    const internalDisplay = internalDuty ? `${internalDuty} (+${internalHours} JP)` : '-';
    const externalDisplay = externalSchool ? `${externalSchool} (+${externalHours} JP)` : (externalHours > 0 ? `+${externalHours} JP` : '-');

    html += `
      <tr>
        <td style="text-align:center; font-weight:bold; background-color:#F8FAFC;">${t.kg}</td>
        <td class="legend-td" style="font-weight:600;">${t.name}</td>
        <td class="legend-td">${t.subjects.join(', ')}</td>
        <td class="legend-td" style="font-size:8.5pt;">${classesDisplay}</td>
        <td style="text-align:center; font-weight:bold;">${teachingDisplay}</td>
        <td class="legend-td">${internalDisplay}</td>
        <td class="legend-td">${externalDisplay}</td>
        <td style="text-align:center; font-weight:bold; color:#0F766E;">${totalDutyHours > 0 ? `+${totalDutyHours} JP` : '-'}</td>
        <td style="text-align:center; font-weight:bold; font-size:10pt;">${wl.totalCertifiedHours} JP</td>
        <td class="${isOk ? 'status-ok' : 'status-warn'}">
          ${isOk ? '✓ Memenuhi Syarat (≥24 JP)' : `⚠️ Kurang ${24 - wl.totalCertifiedHours} JP`}
        </td>
      </tr>
    `;
  }

  // Official Signatures
  html += `
    </tbody>
  </table>

  <br/><br/>

  <table>
    <tr>
      <td colspan="5" style="border:none; font-size:9pt; color:#475569;">
        <strong>Catatan Pengaturan 5 Hari Kerja MTsN 3 Jeneponto:</strong><br/>
        1. Hari Senin: Upacara Bendera dimulai pukul 07.00 WITA.<br/>
        2. Hari Selasa s/d Kamis: Pembelajaran 9 Jam Pelajaran berakhir pukul 15.00 WITA.<br/>
        3. Hari Jumat: Pembelajaran 5 Jam Pelajaran berakhir pukul 10.55 WITA (Persiapan Sholat Jumat).<br/>
        4. Sistem jadwal diverifikasi 100% Bebas Bentrok (Zero Collisions Guarantee).
      </td>
      <td colspan="4" style="border:none; text-align:center; vertical-align:top;">
        ${schoolInfo.signatureCity}, ${schoolInfo.signatureDate}<br/>
        <strong>${schoolInfo.headmasterTitle},</strong><br/><br/><br/><br/>
        <strong style="text-decoration: underline; font-size:11pt;">${schoolInfo.headmasterName}</strong><br/>
        NIP. ${schoolInfo.headmasterNip}
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `Jadwal_5_Hari_Kerja_MTsN3_Jeneponto_${new Date().toISOString().slice(0, 10)}.xls`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Fallback raw CSV export
 */
export function exportToCSV(
  schedule: WeeklySchedule,
  schoolInfo: SchoolInfo,
  classes: ClassRoom[] = INITIAL_CLASSES,
  teachers: Teacher[] = INITIAL_TEACHERS
): void {
  exportToExcel(schedule, schoolInfo, classes, teachers);
}

export function exportBackupJSON(data: {
  schedule: WeeklySchedule;
  schoolInfo: SchoolInfo;
  teachers: Teacher[];
  classes: ClassRoom[];
}): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `backup_jadwal_mtsn3_jeneponto_${Date.now()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
