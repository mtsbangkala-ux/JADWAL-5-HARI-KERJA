// Logo Presets and SVG Data URIs for Madrasah Kop Surat (Logo Kiri & Kanan)

export interface LogoPreset {
  id: string;
  name: string;
  description: string;
  category: 'kemenag' | 'madrasah' | 'kemdikbud' | 'nasional';
  dataUrl: string;
}

// Crisp Vector SVG for Kemenag RI (Ikhlas Beramal)
export const SVG_KEMENAG_RI = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="kgGreen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065f46"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <linearGradient id="kgGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <!-- Outer Pentagon Shield -->
  <polygon points="60,6 112,44 94,110 26,110 8,44" fill="url(#kgGreen)" stroke="#047857" stroke-width="2"/>
  <polygon points="60,11 107,46 91,105 29,105 13,46" fill="none" stroke="url(#kgGold)" stroke-width="2.5"/>
  
  <!-- Golden Sunburst Rays -->
  <circle cx="60" cy="60" r="34" fill="#047857" stroke="url(#kgGold)" stroke-width="1.5"/>
  <path d="M60,28 L60,36 M60,84 L60,92 M28,60 L36,60 M84,60 L92,60 M37,37 L43,43 M77,77 L83,83 M37,83 L43,77 M77,37 L83,43" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
  
  <!-- Holy Book / Kitab Suci -->
  <path d="M42,65 Q51,60 60,65 Q69,60 78,65 L78,50 Q69,45 60,50 Q51,45 42,50 Z" fill="#ffffff" stroke="#d97706" stroke-width="1.5"/>
  <path d="M60,50 L60,65" stroke="#d97706" stroke-width="1.5"/>
  
  <!-- Scales of Justice (Timbangan) -->
  <line x1="60" y1="40" x2="60" y2="78" stroke="#fef08a" stroke-width="2"/>
  <line x1="45" y1="46" x2="75" y2="46" stroke="#fef08a" stroke-width="2"/>
  <polygon points="45,46 41,53 49,53" fill="none" stroke="#fef08a" stroke-width="1.2"/>
  <polygon points="75,46 71,53 79,53" fill="none" stroke="#fef08a" stroke-width="1.2"/>
  
  <!-- Golden Star -->
  <polygon points="60,20 63,27 70,27 64,31 66,38 60,34 54,38 56,31 50,27 57,27" fill="#fde047"/>
  
  <!-- Ribbon IKHLAS BERAMAL -->
  <path d="M30,96 Q60,90 90,96 L86,103 Q60,98 34,103 Z" fill="#fef08a" stroke="#d97706" stroke-width="1"/>
  <text x="60" y="99" font-size="5.2" font-family="Arial, sans-serif" font-weight="900" fill="#065f46" text-anchor="middle" letter-spacing="0.5">IKHLAS BERAMAL</text>
  <text x="60" y="116" font-size="6" font-family="Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">KEMENAG RI</text>
</svg>
`)}`;

// Crisp Vector SVG for MTsN 3 Jeneponto
export const SVG_MTSN3_JENEPONTO = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="mtsBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#047857"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>
    <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <!-- Outer Circular Ring -->
  <circle cx="60" cy="60" r="54" fill="url(#mtsBg)" stroke="#f59e0b" stroke-width="3"/>
  <circle cx="60" cy="60" r="48" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="3 2"/>
  
  <!-- Madrasah Dome & Minaret -->
  <path d="M40,78 L80,78 L80,68 Q60,50 40,68 Z" fill="#065f46" stroke="#fef08a" stroke-width="1.5"/>
  <path d="M60,42 Q68,52 68,64 L52,64 Q52,52 60,42 Z" fill="#10b981" stroke="#ffffff" stroke-width="1.5"/>
  
  <!-- Crescent & Star -->
  <circle cx="60" cy="36" r="5" fill="#fde047"/>
  <circle cx="62" cy="35" r="4.2" fill="url(#mtsBg)"/>
  
  <!-- Open Book of Knowledge -->
  <path d="M44,74 Q52,70 60,74 Q68,70 76,74 L76,84 Q68,80 60,84 Q52,80 44,84 Z" fill="#ffffff" stroke="#d97706" stroke-width="1.5"/>
  <line x1="60" y1="74" x2="60" y2="84" stroke="#d97706" stroke-width="1.2"/>
  
  <!-- Badge Text Circular Header -->
  <path id="curveTop" d="M22,60 A38,38 0 0,1 98,60" fill="none"/>
  <text font-size="6.2" font-family="Arial, sans-serif" font-weight="900" fill="#fef08a" letter-spacing="1">
    <textPath href="#curveTop" startOffset="50%" text-anchor="middle">
      MTsN 3 JENEPONTO
    </textPath>
  </text>
  
  <path id="curveBottom" d="M98,60 A38,38 0 0,1 22,60" fill="none"/>
  <text font-size="5.5" font-family="Arial, sans-serif" font-weight="bold" fill="#ffffff" letter-spacing="0.5">
    <textPath href="#curveBottom" startOffset="50%" text-anchor="middle">
      MANDIRI BERPRESTASI
    </textPath>
  </text>
  
  <!-- Center Star -->
  <polygon points="60,65 62,69 66,69 63,72 64,76 60,73 56,76 57,72 54,69 58,69" fill="#f59e0b"/>
</svg>
`)}`;

// Crisp Vector SVG for Tut Wuri Handayani
export const SVG_TUT_WURI_HANDAYANI = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <polygon points="60,8 112,45 92,108 28,108 8,45" fill="#1e3a8a" stroke="#fbbf24" stroke-width="3"/>
  <polygon points="60,14 106,47 88,103 32,103 14,47" fill="#0284c7"/>
  <!-- Blencong / Torch Flame -->
  <path d="M60,26 Q72,42 60,56 Q48,42 60,26 Z" fill="#ef4444" stroke="#fde047" stroke-width="1.5"/>
  <path d="M60,34 Q66,44 60,52 Q54,44 60,34 Z" fill="#fbbf24"/>
  <!-- Wings of Garuda -->
  <path d="M60,56 Q78,54 90,70 Q75,76 60,66 Q45,76 30,70 Q42,54 60,56 Z" fill="#fef08a" stroke="#b45309" stroke-width="1.2"/>
  <!-- Open Book -->
  <path d="M42,80 Q51,76 60,80 Q69,76 78,80 L78,92 Q69,88 60,92 Q51,88 42,92 Z" fill="#ffffff" stroke="#0369a1" stroke-width="1.5"/>
  <line x1="60" y1="80" x2="60" y2="92" stroke="#0369a1" stroke-width="1.5"/>
  <text x="60" y="102" font-size="5" font-family="Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">TUT WURI HANDAYANI</text>
</svg>
`)}`;

// Crisp Vector SVG for Garuda Pancasila
export const SVG_GARUDA_PANCASILA = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="54" fill="#78350f" stroke="#f59e0b" stroke-width="2"/>
  <!-- Golden Eagle Wings -->
  <path d="M60,30 Q92,20 106,60 Q86,64 60,50 Q34,64 14,60 Q28,20 60,30 Z" fill="#f59e0b" stroke="#fde047" stroke-width="1.5"/>
  <!-- Head -->
  <circle cx="60" cy="24" r="8" fill="#f59e0b"/>
  <path d="M60,20 L68,24 L60,27 Z" fill="#fde047"/>
  <!-- Center Shield -->
  <polygon points="60,45 76,55 76,75 60,88 44,75 44,55" fill="#dc2626" stroke="#fef08a" stroke-width="2"/>
  <line x1="60" y1="45" x2="60" y2="88" stroke="#fef08a" stroke-width="1.5"/>
  <line x1="44" y1="65" x2="76" y2="65" stroke="#fef08a" stroke-width="1.5"/>
  <circle cx="60" cy="65" r="4" fill="#fde047"/>
  <!-- Ribbon BHINNEKA TUNGGAL IKA -->
  <path d="M34,96 Q60,90 86,96 L84,103 Q60,98 36,103 Z" fill="#ffffff" stroke="#d97706" stroke-width="1"/>
  <text x="60" y="100" font-size="4.5" font-family="Arial, sans-serif" font-weight="900" fill="#000000" text-anchor="middle">BHINNEKA TUNGGAL IKA</text>
</svg>
`)}`;

export const LOGO_PRESETS_LEFT: LogoPreset[] = [
  {
    id: 'kemenag_ri',
    name: 'Kemenag RI (Ikhlas Beramal)',
    description: 'Logo resmi Kementerian Agama Republik Indonesia',
    category: 'kemenag',
    dataUrl: SVG_KEMENAG_RI,
  },
  {
    id: 'garuda',
    name: 'Garuda Pancasila',
    description: 'Lambang Negara Republik Indonesia',
    category: 'nasional',
    dataUrl: SVG_GARUDA_PANCASILA,
  },
  {
    id: 'kemdikbud',
    name: 'Tut Wuri Handayani',
    description: 'Logo Pendidikan Nasional Indonesia',
    category: 'kemdikbud',
    dataUrl: SVG_TUT_WURI_HANDAYANI,
  },
];

export const LOGO_PRESETS_RIGHT: LogoPreset[] = [
  {
    id: 'mtsn3_jeneponto',
    name: 'MTsN 3 Jeneponto',
    description: 'Logo Resmi MTs Negeri 3 Jeneponto',
    category: 'madrasah',
    dataUrl: SVG_MTSN3_JENEPONTO,
  },
  {
    id: 'kemenag_right',
    name: 'Kemenag RI',
    description: 'Logo Kementerian Agama RI',
    category: 'kemenag',
    dataUrl: SVG_KEMENAG_RI,
  },
  {
    id: 'garuda_right',
    name: 'Garuda Pancasila',
    description: 'Lambang Garuda Pancasila',
    category: 'nasional',
    dataUrl: SVG_GARUDA_PANCASILA,
  },
];

// Crisp Vector SVG for Headmaster Official Digital Signature Barcode
export const SVG_BARCODE_HEADMASTER_SIGNATURE = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 110" width="280" height="110">
  <rect width="280" height="110" fill="#ffffff" rx="8" stroke="#047857" stroke-width="2"/>
  <rect x="4" y="4" width="272" height="102" fill="none" rx="6" stroke="#047857" stroke-width="1.2" stroke-dasharray="5 3"/>
  
  <!-- Barcode Pattern Left -->
  <g transform="translate(12, 16)">
    <rect x="0" y="0" width="3.5" height="58" fill="#0f172a"/>
    <rect x="5" y="0" width="2" height="58" fill="#0f172a"/>
    <rect x="9" y="0" width="5.5" height="58" fill="#0f172a"/>
    <rect x="16" y="0" width="2" height="58" fill="#0f172a"/>
    <rect x="20" y="0" width="4.5" height="58" fill="#0f172a"/>
    <rect x="26" y="0" width="2" height="58" fill="#0f172a"/>
    <rect x="30" y="0" width="6" height="58" fill="#0f172a"/>
    <rect x="38" y="0" width="3" height="58" fill="#0f172a"/>
    <rect x="43" y="0" width="2" height="58" fill="#0f172a"/>
    <rect x="47" y="0" width="5" height="58" fill="#0f172a"/>
    <rect x="54" y="0" width="2" height="58" fill="#0f172a"/>
    <rect x="58" y="0" width="4" height="58" fill="#0f172a"/>
    <rect x="64" y="0" width="2" height="58" fill="#0f172a"/>
    <rect x="68" y="0" width="5" height="58" fill="#0f172a"/>
    <text x="36" y="70" font-size="7.5" font-family="monospace" font-weight="bold" fill="#0f172a" text-anchor="middle">MTsN3-JEP-TTD-2026</text>
  </g>

  <!-- Right Text & Validation Badge -->
  <g transform="translate(100, 14)">
    <rect x="0" y="0" width="168" height="18" fill="#047857" rx="3"/>
    <text x="84" y="12.5" font-size="8.5" font-family="Arial, sans-serif" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">TANDA TANGAN DIGITAL SAH</text>
    
    <text x="0" y="33" font-size="9" font-family="Arial, sans-serif" font-weight="800" fill="#065f46">KEPALA MTsN 3 JENEPONTO</text>
    <text x="0" y="46" font-size="7.5" font-family="Arial, sans-serif" font-weight="bold" fill="#1e293b">Dokumen Resmi Terverifikasi</text>
    <text x="0" y="58" font-size="7" font-family="Arial, sans-serif" fill="#475569">Sistem Otomatis Kurikulum</text>
    
    <!-- Green Check Circle Badge -->
    <circle cx="148" cy="42" r="11" fill="#10b981"/>
    <path d="M142,42 L146,46 L154,38" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Bottom Verification Banner -->
  <rect x="8" y="86" width="264" height="16" fill="#f1f5f9" rx="3"/>
  <text x="140" y="97" font-size="7" font-family="Arial, sans-serif" font-weight="bold" fill="#334155" text-anchor="middle">Terdaftar secara elektronik pada Database MTsN 3 Jeneponto</text>
</svg>
`)}`;
