import React, { useState } from 'react';
import {
  PenTool,
  Highlighter,
  Eraser,
  Shapes,
  Undo2,
  Redo2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Settings,
  Moon,
  Sun,
  Grid,
  Sparkles,
  ArrowLeft,
  Minus,
} from 'lucide-react';
import { ToolType, BackgroundPattern } from '../types/note';

interface ToolbarProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  currentColor: string;
  onSelectColor: (color: string) => void;
  currentSize: number;
  onSelectSize: (size: number) => void;
  currentPattern: BackgroundPattern;
  onSelectPattern: (pattern: BackgroundPattern) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  invertInDarkMode: boolean;
  onToggleInvert: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onAddPage: () => void;
  onExport: (format: 'png' | 'sbn' | 'svg') => void;
  onOpenSettings: () => void;
  onBackToNotes: () => void;
  title: string;
  onTitleChange: (newTitle: string) => void;
}

const PRESET_COLORS = [
  '#1A1A1A', // Ink black
  '#2563eb', // Blue
  '#E11D48', // Accent Rose/Red
  '#16a34a', // Green
  '#facc15', // Yellow
  '#f97316', // Orange
  '#9333ea', // Purple
  '#06b6d4', // Cyan
  '#ffffff', // White
];

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onSelectTool,
  currentColor,
  onSelectColor,
  currentSize,
  onSelectSize,
  currentPattern,
  onSelectPattern,
  isDarkMode,
  onToggleDarkMode,
  invertInDarkMode,
  onToggleInvert,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onAddPage,
  onExport,
  onOpenSettings,
  onBackToNotes,
  title,
  onTitleChange,
}) => {
  const [showPatternPicker, setShowPatternPicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  return (
    <div className="flex flex-col border-b border-black/8 dark:border-white/8 bg-[var(--bg)]/95 backdrop-blur-md sticky top-0 z-30 shrink-0">
      {/* Top Header Row */}
      <div className="flex items-center justify-between px-4 md:px-8 py-3 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBackToNotes}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold font-display border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-[var(--ink)]"
            title="Back to Notes"
          >
            <div className="w-5 h-5 border border-current rounded-[4px] flex items-center justify-center font-bold text-[10px]">
              S
            </div>
            <ArrowLeft className="w-3.5 h-3.5 opacity-70" />
            <span className="hidden sm:inline">Notes</span>
          </button>

          <div className="h-4 w-px bg-black/10 dark:bg-white/10 hidden sm:block" />

          {/* Editable Note Title */}
          {isEditingTitle ? (
            <input
              type="text"
              defaultValue={title}
              autoFocus
              onBlur={(e) => {
                setIsEditingTitle(false);
                if (e.target.value.trim()) onTitleChange(e.target.value.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                  if (e.currentTarget.value.trim()) onTitleChange(e.currentTarget.value.trim());
                }
              }}
              className="text-base md:text-lg font-bold font-display px-2 py-0.5 rounded-lg border border-[var(--ink)] bg-transparent text-[var(--ink)] outline-hidden max-w-[200px] md:max-w-[340px]"
            />
          ) : (
            <div
              onClick={() => setIsEditingTitle(true)}
              className="text-base md:text-lg font-bold font-display truncate cursor-pointer px-2 py-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--ink)] max-w-[160px] sm:max-w-[260px] md:max-w-[420px]"
              title="Click to rename note"
            >
              {title}
            </div>
          )}
        </div>

        {/* Global Controls & Page Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Undo / Redo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-full opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded-full opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-0.5" />

          {/* Page Navigator */}
          <div className="flex items-center bg-black/4 dark:bg-white/6 border border-black/6 dark:border-white/6 rounded-full px-1.5 py-1">
            <button
              onClick={onPrevPage}
              disabled={currentPage <= 1}
              className="p-1 rounded-full opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-20 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-medium px-2 opacity-80 select-none">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={onNextPage}
              disabled={currentPage >= totalPages}
              className="p-1 rounded-full opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-20 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onAddPage}
              className="p-1 rounded-full ml-1 bg-[var(--ink)] text-[var(--bg)] transition-transform hover:scale-105 active:scale-95"
              title="Add New Page"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-0.5 hidden sm:block" />

          {/* Invert In Dark Mode (Saber Feature) */}
          <button
            onClick={onToggleInvert}
            className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 text-xs font-semibold font-display border ${
              invertInDarkMode
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400'
                : 'border-black/10 dark:border-white/10 opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Invert Notes in Dark Mode: Automatically renders white ink on dark paper"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden lg:inline">Invert Note</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-full opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 rounded-full opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Export Options"
            >
              <Download className="w-4 h-4" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 card shadow-2xl py-2 z-50 text-xs">
                <button
                  onClick={() => {
                    onExport('png');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-black/5 dark:hover:bg-white/5 font-sans"
                >
                  Export Page as PNG
                </button>
                <button
                  onClick={() => {
                    onExport('sbn');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-black/5 dark:hover:bg-white/5 font-sans"
                >
                  Export Saber Note (.sbn)
                </button>
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tool Selector & Attributes Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 md:px-8 py-2 bg-black/2 dark:bg-white/3 border-t border-black/6 dark:border-white/6 gap-2">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {/* Fountain Pen */}
          <button
            onClick={() => onSelectTool('fountain')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-display transition-all ${
              currentTool === 'fountain'
                ? 'bg-[var(--ink)] text-[var(--bg)] shadow-xs'
                : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Fountain Pen: Pressure-sensitive smooth calligraphic stroke"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Fountain</span>
          </button>

          {/* Ballpoint Pen */}
          <button
            onClick={() => onSelectTool('ballpoint')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-display transition-all ${
              currentTool === 'ballpoint'
                ? 'bg-[var(--ink)] text-[var(--bg)] shadow-xs'
                : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Ballpoint Pen: Consistent uniform line width"
          >
            <Minus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ballpoint</span>
          </button>

          {/* Pencil */}
          <button
            onClick={() => onSelectTool('pencil')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-display transition-all ${
              currentTool === 'pencil'
                ? 'bg-[var(--ink)] text-[var(--bg)] shadow-xs'
                : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Pencil: Textured graphite sketching"
          >
            <span className="text-xs">✏️</span>
            <span className="hidden sm:inline">Pencil</span>
          </button>

          {/* Highlighter */}
          <button
            onClick={() => onSelectTool('highlighter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-display transition-all ${
              currentTool === 'highlighter'
                ? 'bg-[var(--ink)] text-[var(--bg)] shadow-xs'
                : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Highlighter: Non-multiplying flat blend for clean equation highlighting"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Highlighter</span>
          </button>

          {/* Shape Pen */}
          <button
            onClick={() => onSelectTool('shape')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-display transition-all ${
              currentTool === 'shape'
                ? 'bg-[var(--ink)] text-[var(--bg)] shadow-xs'
                : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Shape Pen: Automatically straightens lines and snaps circles & rectangles"
          >
            <Shapes className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shape</span>
          </button>

          {/* Eraser */}
          <button
            onClick={() => onSelectTool('eraser')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-display transition-all ${
              currentTool === 'eraser'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            title="Stroke Eraser: Tap or drag to delete strokes"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Eraser</span>
          </button>
        </div>

        {/* Color Palette, Size & Pattern */}
        <div className="flex items-center gap-3">
          {/* Quick Colors */}
          {currentTool !== 'eraser' && (
            <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/6 px-2 py-1 rounded-full border border-black/6 dark:border-white/6">
              {PRESET_COLORS.slice(0, 6).map((color) => (
                <button
                  key={color}
                  onClick={() => onSelectColor(color)}
                  className={`w-4 h-4 rounded-full border border-black/20 dark:border-white/20 transition-transform ${
                    currentColor === color ? 'scale-125 ring-2 ring-[var(--ink)]' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}

              <input
                type="color"
                value={currentColor}
                onChange={(e) => onSelectColor(e.target.value)}
                className="w-4 h-4 rounded-full border-0 p-0 cursor-pointer overflow-hidden bg-transparent"
                title="Custom Color"
              />
            </div>
          )}

          {/* Stroke Size Slider */}
          <div className="flex items-center gap-1.5 text-xs opacity-70 font-mono">
            <span className="text-[10px]">{currentSize}px</span>
            <input
              type="range"
              min={currentTool === 'highlighter' ? 8 : 1}
              max={currentTool === 'highlighter' ? 50 : 24}
              value={currentSize}
              onChange={(e) => onSelectSize(Number(e.target.value))}
              className="w-16 sm:w-20 h-1 bg-black/15 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-[var(--ink)]"
            />
          </div>

          {/* Paper Pattern Selector */}
          <div className="relative">
            <button
              onClick={() => setShowPatternPicker(!showPatternPicker)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-display border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Paper Pattern: Blank, Ruled, Grid, Dotted, Isometric"
            >
              <Grid className="w-3.5 h-3.5 opacity-60" />
              <span className="capitalize hidden md:inline">{currentPattern}</span>
            </button>

            {showPatternPicker && (
              <div className="absolute right-0 mt-2 w-36 card shadow-2xl py-1 z-50 text-xs">
                {(['blank', 'ruled', 'grid', 'dotted', 'isometric'] as BackgroundPattern[]).map((pattern) => (
                  <button
                    key={pattern}
                    onClick={() => {
                      onSelectPattern(pattern);
                      setShowPatternPicker(false);
                    }}
                    className={`w-full text-left px-3.5 py-1.5 capitalize hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between font-sans ${
                      currentPattern === pattern
                        ? 'font-bold text-[var(--accent)]'
                        : 'opacity-80'
                    }`}
                  >
                    <span>{pattern}</span>
                    {currentPattern === pattern && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
