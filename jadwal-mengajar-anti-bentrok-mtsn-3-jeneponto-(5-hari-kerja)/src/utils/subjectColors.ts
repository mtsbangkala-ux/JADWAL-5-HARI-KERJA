export interface SubjectColorStyle {
  bg: string;
  border: string;
  text: string;
  badgeBg: string;
  badgeText: string;
}

export function getSubjectStyle(subject: string): SubjectColorStyle {
  const s = (subject || '').toLowerCase().trim();

  if (s.includes('matematika')) {
    return {
      bg: 'bg-amber-50 hover:bg-amber-100',
      border: 'border-amber-300',
      text: 'text-amber-950 font-medium',
      badgeBg: 'bg-amber-700',
      badgeText: 'text-white',
    };
  }
  if (s.includes('ipa') || s.includes('ilmu pengetahuan alam')) {
    return {
      bg: 'bg-purple-50 hover:bg-purple-100',
      border: 'border-purple-300',
      text: 'text-purple-950 font-medium',
      badgeBg: 'bg-purple-700',
      badgeText: 'text-white',
    };
  }
  if (s.includes('bahasa indonesia')) {
    return {
      bg: 'bg-blue-50 hover:bg-blue-100',
      border: 'border-blue-300',
      text: 'text-blue-950 font-medium',
      badgeBg: 'bg-blue-700',
      badgeText: 'text-white',
    };
  }
  if (s.includes('bahasa inggris')) {
    return {
      bg: 'bg-indigo-50 hover:bg-indigo-100',
      border: 'border-indigo-300',
      text: 'text-indigo-950 font-medium',
      badgeBg: 'bg-indigo-700',
      badgeText: 'text-white',
    };
  }
  if (s.includes('bahasa arab')) {
    return {
      bg: 'bg-sky-50 hover:bg-sky-100',
      border: 'border-sky-300',
      text: 'text-sky-950 font-medium',
      badgeBg: 'bg-sky-700',
      badgeText: 'text-white',
    };
  }
  if (s.includes('ips') || s.includes('ilmu pengetahuan sosial')) {
    return {
      bg: 'bg-orange-50 hover:bg-orange-100',
      border: 'border-orange-300',
      text: 'text-orange-950 font-medium',
      badgeBg: 'bg-orange-700',
      badgeText: 'text-white',
    };
  }
  if (s.includes('hadis') || s.includes('hadits') || s.includes("qur'an")) {
    return {
      bg: 'bg-emerald-50 hover:bg-emerald-100',
      border: 'border-emerald-300',
      text: 'text-emerald-950 font-medium',
      badgeBg: 'bg-emerald-700',
      badgeText: 'text-white',
    };
  }
  if (s.includes('aqidah') || s.includes('akidah')) {
    return {
      bg: 'bg-teal-50 hover:bg-teal-100',
      border: 'border-teal-300',
      text: 'text-teal-950 font-medium',
      badgeBg: 'bg-teal-700',
      badgeText: 'text-white',
    };
  }
  if (s.includes('fiqh') || s.includes('fiqhi')) {
    return {
      bg: 'bg-green-50 hover:bg-green-100',
      border: 'border-green-300',
      text: 'text-green-950 font-medium',
      badgeBg: 'bg-green-700',
      badgeText: 'text-white',
    };
  }
  if (s.includes('ski') || s.includes('sejarah')) {
    return {
      bg: 'bg-cyan-50 hover:bg-cyan-100',
      border: 'border-cyan-300',
      text: 'text-cyan-950 font-medium',
      badgeBg: 'bg-cyan-700',
      badgeText: 'text-white',
    };
  }
  if (s.includes('penjaskes') || s.includes('pjok') || s.includes('kokur')) {
    return {
      bg: 'bg-lime-50 hover:bg-lime-100',
      border: 'border-lime-300',
      text: 'text-lime-950 font-medium',
      badgeBg: 'bg-lime-800',
      badgeText: 'text-white',
    };
  }
  if (s.includes('seni')) {
    return {
      bg: 'bg-pink-50 hover:bg-pink-100',
      border: 'border-pink-300',
      text: 'text-pink-950 font-medium',
      badgeBg: 'bg-pink-700',
      badgeText: 'text-white',
    };
  }
  if (s.includes('pkn') || s.includes('pancasila')) {
    return {
      bg: 'bg-stone-100 hover:bg-stone-200',
      border: 'border-stone-300',
      text: 'text-stone-900 font-medium',
      badgeBg: 'bg-stone-700',
      badgeText: 'text-white',
    };
  }
  if (s.includes('informatika') || s.includes('koding')) {
    return {
      bg: 'bg-violet-50 hover:bg-violet-100',
      border: 'border-violet-300',
      text: 'text-violet-950 font-medium',
      badgeBg: 'bg-violet-700',
      badgeText: 'text-white',
    };
  }
  if (s.includes('btq')) {
    return {
      bg: 'bg-yellow-50 hover:bg-yellow-100',
      border: 'border-yellow-300',
      text: 'text-yellow-950 font-medium',
      badgeBg: 'bg-yellow-700',
      badgeText: 'text-white',
    };
  }

  return {
    bg: 'bg-slate-50 hover:bg-slate-100',
    border: 'border-slate-200',
    text: 'text-slate-800',
    badgeBg: 'bg-slate-600',
    badgeText: 'text-white',
  };
}
