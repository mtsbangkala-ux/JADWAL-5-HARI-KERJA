import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, Wand2, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

export interface NotificationData {
  id: string;
  type: 'conflict' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  details?: string[];
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  timestamp: number;
  autoCloseDuration?: number; // in ms
}

interface NotificationToastProps {
  notifications: NotificationData[];
  onDismiss: (id: string) => void;
}

export function playAlertSound(type: 'conflict' | 'success') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'conflict') {
      // Urgent attention two-tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(466.16, ctx.currentTime); // Bb4
      osc.frequency.setValueAtTime(349.23, ctx.currentTime + 0.12); // F4
      osc.frequency.setValueAtTime(466.16, ctx.currentTime + 0.24); // Bb4
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else {
      // Pleasant light chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08); // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Ignore audio permission or context restrictions
  }
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
}) => {
  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[notifications.length - 1];
    const duration = latest.autoCloseDuration ?? (latest.type === 'conflict' ? 12000 : 5000);

    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(latest.id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [notifications, onDismiss]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-3 print:hidden">
      {notifications.map(n => {
        const isConflict = n.type === 'conflict';
        const isSuccess = n.type === 'success';

        return (
          <div
            key={n.id}
            role="alert"
            className={`pointer-events-auto rounded-xl p-4 shadow-xl border backdrop-blur-md transition-all duration-200 animate-in slide-in-from-top-3 fade-in ${
              isConflict
                ? 'bg-rose-900/95 text-white border-rose-500 shadow-rose-950/40 ring-2 ring-rose-400/40'
                : isSuccess
                ? 'bg-emerald-900/95 text-white border-emerald-500 shadow-emerald-950/30'
                : 'bg-slate-900/95 text-white border-slate-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isConflict
                    ? 'bg-rose-600/90 text-white shadow-inner animate-pulse'
                    : isSuccess
                    ? 'bg-emerald-600/90 text-white shadow-inner'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                {isConflict ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : isSuccess ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Info className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-bold leading-tight">
                    {n.title}
                  </h4>
                  <button
                    onClick={() => onDismiss(n.id)}
                    className="text-white/60 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    aria-label="Tutup notifikasi"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-white/90 mt-1 leading-relaxed">
                  {n.message}
                </p>

                {n.details && n.details.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/15 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 block">
                      Rincian Tabrakan ({n.details.length} Titik):
                    </span>
                    <ul className="text-[11px] text-rose-100/90 space-y-1 max-h-28 overflow-y-auto pr-1 scrollbar-thin">
                      {n.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 font-medium">
                          <span className="text-rose-400 font-bold shrink-0">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                {(n.actionLabel || n.secondaryActionLabel) && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-white/15">
                    {n.actionLabel && n.onAction && (
                      <button
                        onClick={() => {
                          n.onAction?.();
                          onDismiss(n.id);
                        }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                          isConflict
                            ? 'bg-rose-500 hover:bg-rose-600 text-white active:scale-95'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        }`}
                      >
                        {isConflict && <Wand2 className="w-3.5 h-3.5" />}
                        <span>{n.actionLabel}</span>
                      </button>
                    )}

                    {n.secondaryActionLabel && n.onSecondaryAction && (
                      <button
                        onClick={() => {
                          n.onSecondaryAction?.();
                          onDismiss(n.id);
                        }}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{n.secondaryActionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
