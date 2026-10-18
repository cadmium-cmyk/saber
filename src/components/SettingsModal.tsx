import React from 'react';
import { X, Moon, Sun, Sparkles, Grid, Sliders, Info, RotateCcw } from 'lucide-react';
import { AppSettings, BackgroundPattern } from '../types/note';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetDemoData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetDemoData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md card shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/8 dark:border-white/8 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-[var(--ink)] rounded-[8px] flex items-center justify-center font-bold text-sm font-display">
              S
            </div>
            <h2 className="text-lg font-bold font-display text-[var(--ink)] m-0">
              Saber Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Setting Groups */}
        <div className="space-y-5 text-xs font-sans">
          {/* Appearance */}
          <div className="space-y-3">
            <div className="label opacity-60">Appearance & Theme</div>

            {/* Theme mode buttons */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/3 dark:bg-white/4 border border-black/6 dark:border-white/6">
              <span className="font-medium text-[var(--ink)]">Theme</span>
              <div className="flex items-center bg-black/6 dark:bg-white/8 p-0.5 rounded-full">
                {(['light', 'dark', 'system'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => onUpdateSettings({ ...settings, theme: mode })}
                    className={`px-3 py-1 rounded-full capitalize font-display text-xs font-semibold transition-all ${
                      settings.theme === mode
                        ? 'bg-[var(--ink)] text-[var(--bg)] shadow-xs'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Invert Notes in Dark Mode (Saber Highlight Feature) */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-bold font-display text-[var(--ink)] text-sm">
                    Invert notes in dark mode
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.invertInDarkMode}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, invertInDarkMode: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] opacity-70 leading-relaxed m-0">
                Saber's signature feature: write with white ink on dark paper in low light.
                Images, text, and highlighter colors maintain optimal legibility and contrast.
              </p>
            </div>
          </div>

          {/* Paper & Grid */}
          <div className="space-y-3">
            <div className="label opacity-60">Paper & Grid</div>

            {/* Default pattern */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/3 dark:bg-white/4 border border-black/6 dark:border-white/6">
              <span className="font-medium text-[var(--ink)]">Default Paper Pattern</span>
              <select
                value={settings.defaultPattern}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    defaultPattern: e.target.value as BackgroundPattern,
                  })
                }
                className="bg-white dark:bg-[#202024] border border-black/10 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-[var(--ink)] font-semibold font-display"
              >
                <option value="ruled">Ruled (Lined)</option>
                <option value="grid">Grid (Graph)</option>
                <option value="dotted">Dotted</option>
                <option value="isometric">Isometric</option>
                <option value="blank">Blank</option>
              </select>
            </div>

            {/* Grid Spacing */}
            <div className="p-3.5 rounded-2xl bg-black/3 dark:bg-white/4 border border-black/6 dark:border-white/6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[var(--ink)]">Grid / Line Spacing</span>
                <span className="font-mono opacity-60">{settings.gridSpacing} px</span>
              </div>
              <input
                type="range"
                min="20"
                max="48"
                step="2"
                value={settings.gridSpacing}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, gridSpacing: Number(e.target.value) })
                }
                className="w-full h-1 bg-black/15 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--ink)]"
              />
            </div>

            {/* Simulated Pressure */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/3 dark:bg-white/4 border border-black/6 dark:border-white/6">
              <div>
                <div className="font-medium text-[var(--ink)]">
                  Simulate Pen Pressure
                </div>
                <div className="text-[10px] opacity-50">
                  Calculates natural stroke width variations using velocity
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.simulatePressure}
                onChange={(e) =>
                  onUpdateSettings({ ...settings, simulatePressure: e.target.checked })
                }
                className="w-4 h-4 accent-[var(--ink)] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* About Saber */}
          <div className="pt-3 border-t border-black/8 dark:border-white/8 space-y-3">
            <div className="flex items-center justify-between opacity-60">
              <span className="label">Saber Web Version</span>
              <span className="font-mono font-bold">v1.36.1</span>
            </div>

            <button
              onClick={() => {
                if (confirm('Reset to demo notes? Any unsaved local edits will be replaced with fresh demo notes.')) {
                  onResetDemoData();
                  onClose();
                }
              }}
              className="w-full py-2.5 px-4 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-2 font-display text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 opacity-60" />
              <span>Reset to Sample Notes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
