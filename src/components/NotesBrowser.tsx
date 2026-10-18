import React, { useState } from 'react';
import {
  Folder as FolderIcon,
  Plus,
  Search,
  MoreVertical,
  Clock,
  Trash2,
  Edit2,
  FolderPlus,
  FolderInput,
  Download,
  Moon,
  Sun,
  Settings as SettingsIcon,
  ChevronRight,
  FilePlus2,
  Copy,
  Layers,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Note, Folder, AppSettings } from '../types/note';
import { getSvgPathFromStroke, getStrokeOptionsForTool } from '../utils/canvasHelper';
import { getStroke } from 'perfect-freehand';

interface NotesBrowserProps {
  notes: Note[];
  folders: Folder[];
  currentFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onOpenNote: (noteId: string) => void;
  onCreateNote: (folderId: string | null) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onRenameNote: (noteId: string, newTitle: string) => void;
  onDeleteNote: (noteId: string) => void;
  onDuplicateNote: (noteId: string) => void;
  onMoveNote: (noteId: string, targetFolderId: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
  onExportNote: (note: Note) => void;
  onImportNote: (file: File) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
  settings: AppSettings;
}

export const NotesBrowser: React.FC<NotesBrowserProps> = ({
  notes,
  folders,
  currentFolderId,
  onSelectFolder,
  onOpenNote,
  onCreateNote,
  onCreateFolder,
  onRenameNote,
  onDeleteNote,
  onDuplicateNote,
  onMoveNote,
  onDeleteFolder,
  onExportNote,
  onImportNote,
  isDarkMode,
  onToggleDarkMode,
  onOpenSettings,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recents' | 'folder'>('all');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [activeMenuNoteId, setActiveMenuNoteId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [movingNoteId, setMovingNoteId] = useState<string | null>(null);

  // Filter notes by current folder and search
  const displayedNotes = notes.filter((n) => {
    if (searchQuery.trim()) {
      return n.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (activeTab === 'recents') {
      return true; // We will sort by updatedAt
    }
    return n.folderId === currentFolderId;
  });

  const sortedNotes = activeTab === 'recents'
    ? [...displayedNotes].sort((a, b) => b.updatedAt - a.updatedAt)
    : [...displayedNotes].sort((a, b) => b.updatedAt - a.updatedAt);

  // Subfolders of current folder
  const currentSubfolders = folders.filter((f) => f.parentId === currentFolderId);
  const currentFolder = folders.find((f) => f.id === currentFolderId);

  // Folder breadcrumb path
  const getBreadcrumbs = () => {
    const crumbs: { id: string | null; name: string }[] = [{ id: null, name: 'Home' }];
    let curr = currentFolder;
    const path: { id: string | null; name: string }[] = [];
    while (curr) {
      path.unshift({ id: curr.id, name: curr.name });
      curr = folders.find((f) => f.id === curr?.parentId);
    }
    return [...crumbs, ...path];
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), currentFolderId);
      setNewFolderName('');
      setShowNewFolderModal(false);
    }
  };

  const renderNoteThumbnail = (note: Note) => {
    const firstPage = note.pages[0];
    if (!firstPage || firstPage.strokes.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#f0f0f0] dark:bg-[#202024] text-stone-400">
          <FilePlus2 className="w-7 h-7 opacity-30" />
        </div>
      );
    }

    const strokesToRender = firstPage.strokes.slice(0, 20);

    return (
      <svg
        viewBox={`0 0 ${firstPage.width} ${firstPage.height}`}
        className="w-full h-full pointer-events-none select-none bg-white dark:bg-[#1a1a1c]"
      >
        {strokesToRender.map((stroke, i) => {
          if (stroke.shapeType && stroke.shapeData) {
            const { startX, startY, endX, endY, radius } = stroke.shapeData;
            if (stroke.shapeType === 'line') {
              return (
                <line
                  key={i}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={isDarkMode ? '#ffffff' : stroke.color}
                  strokeWidth={stroke.size * 1.5}
                  strokeLinecap="round"
                />
              );
            } else if (stroke.shapeType === 'circle' && radius) {
              return (
                <circle
                  key={i}
                  cx={startX}
                  cy={startY}
                  r={radius}
                  fill="none"
                  stroke={isDarkMode ? '#ffffff' : stroke.color}
                  strokeWidth={stroke.size * 1.5}
                />
              );
            } else if (stroke.shapeType === 'rectangle') {
              return (
                <rect
                  key={i}
                  x={Math.min(startX, endX)}
                  y={Math.min(startY, endY)}
                  width={Math.abs(endX - startX)}
                  height={Math.abs(endY - startY)}
                  fill="none"
                  stroke={isDarkMode ? '#ffffff' : stroke.color}
                  strokeWidth={stroke.size * 1.5}
                />
              );
            }
          }

          if (stroke.points.length >= 2) {
            const outline = getStroke(
              stroke.points,
              getStrokeOptionsForTool(stroke.tool, stroke.size)
            );
            const pathData = getSvgPathFromStroke(outline);
            return (
              <path
                key={i}
                d={pathData}
                fill={
                  stroke.tool === 'highlighter'
                    ? '#facc15'
                    : isDarkMode && (stroke.color === '#0f172a' || stroke.color === 'black')
                    ? '#ffffff'
                    : stroke.color
                }
                opacity={stroke.tool === 'highlighter' ? 0.6 : 1}
              />
            );
          }
          return null;
        })}
      </svg>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg)] text-[var(--ink)] overflow-hidden">
      {/* Variation 1 Header */}
      <header className="border-b border-black/8 dark:border-white/8 px-6 md:px-12 py-4 md:py-5 flex justify-between items-center bg-[var(--bg)]/95 backdrop-blur-md sticky top-0 z-30 shrink-0">
        <div
          className="flex items-center gap-3.5 cursor-pointer select-none"
          onClick={() => {
            onSelectFolder(null);
            setActiveTab('all');
          }}
        >
          <div className="w-10 h-10 border-2 border-[var(--ink)] rounded-[10px] flex items-center justify-center font-bold text-lg font-display tracking-tight shadow-xs">
            S
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight font-display leading-tight m-0">
              Saber
            </h1>
            <span className="label opacity-50 text-[9px] -mt-0.5 hidden sm:inline">
              Handwriting Notes
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Bar */}
          <div className="relative hidden sm:block w-44 md:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 opacity-40" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs bg-black/4 dark:bg-white/6 border border-black/6 dark:border-white/6 focus:outline-hidden focus:border-[var(--ink)] placeholder-black/40 dark:placeholder-white/40"
            />
          </div>

          {/* Import note button */}
          <label
            className="cursor-pointer p-2 rounded-full text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Import Note (.sbn / JSON)"
          >
            <input
              type="file"
              accept=".sbn,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportNote(file);
              }}
            />
            <Download className="w-4 h-4 rotate-180 opacity-75 hover:opacity-100" />
          </label>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-full text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 opacity-75" />}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-full text-[var(--ink)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4 opacity-75 hover:opacity-100" />
          </button>

          {/* Primary Action Button */}
          <button
            className="btn-primary ml-1"
            onClick={() => onCreateNote(currentFolderId)}
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </header>

      {/* Variation 1 Grid Layout */}
      <div className="grid md:grid-cols-[250px_1fr] flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="sidebar p-6 md:p-8 border-r border-black/8 dark:border-white/8 overflow-y-auto hidden md:flex md:flex-col justify-between bg-[var(--bg)]/50">
          <div>
            <div className="label mb-4 opacity-60">Navigation</div>
            <ul className="p-0 m-0 list-none space-y-1 text-sm font-sans">
              <li>
                <button
                  onClick={() => {
                    onSelectFolder(null);
                    setActiveTab('all');
                    setSearchQuery('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                    activeTab === 'all' && currentFolderId === null
                      ? 'font-bold bg-black/6 dark:bg-white/8 text-[var(--ink)]'
                      : 'opacity-70 hover:opacity-100 hover:bg-black/3 dark:hover:bg-white/4'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4" />
                    <span>All Notes</span>
                  </div>
                  <span className="text-xs font-mono opacity-50">{notes.length}</span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => {
                    setActiveTab('recents');
                    setSearchQuery('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                    activeTab === 'recents'
                      ? 'font-bold bg-black/6 dark:bg-white/8 text-[var(--ink)]'
                      : 'opacity-70 hover:opacity-100 hover:bg-black/3 dark:hover:bg-white/4'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4" />
                    <span>Recent Notes</span>
                  </div>
                </button>
              </li>
            </ul>

            {/* Folders Section in Sidebar */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <div className="label opacity-60">Folders</div>
                <button
                  onClick={() => setShowNewFolderModal(true)}
                  className="opacity-60 hover:opacity-100 p-1 rounded-md text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-opacity"
                  title="Create Folder"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <ul className="p-0 m-0 list-none space-y-1 text-xs font-sans">
                {folders.map((folder) => {
                  const count = notes.filter((n) => n.folderId === folder.id).length;
                  const isCurrent = currentFolderId === folder.id && activeTab === 'folder';

                  return (
                    <li key={folder.id}>
                      <button
                        onClick={() => {
                          onSelectFolder(folder.id);
                          setActiveTab('folder');
                          setSearchQuery('');
                        }}
                        className={`group w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                          isCurrent
                            ? 'font-bold bg-black/6 dark:bg-white/8 text-[var(--ink)]'
                            : 'opacity-70 hover:opacity-100 hover:bg-black/3 dark:hover:bg-white/4'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FolderIcon
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: folder.color || 'var(--ink)' }}
                          />
                          <span className="truncate">{folder.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-mono opacity-40 text-[10px]">{count}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete folder "${folder.name}"?`)) {
                                onDeleteFolder(folder.id);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 rounded transition-opacity"
                            title="Delete Folder"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </button>
                    </li>
                  );
                })}

                {folders.length === 0 && (
                  <li
                    onClick={() => setShowNewFolderModal(true)}
                    className="px-3 py-2 rounded-xl border border-dashed border-black/10 dark:border-white/10 text-center opacity-50 hover:opacity-100 cursor-pointer"
                  >
                    + Add Folder
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-6 border-t border-black/8 dark:border-white/8">
            <button
              onClick={onOpenSettings}
              className="w-full text-left px-3 py-2 rounded-xl opacity-70 hover:opacity-100 hover:bg-black/3 dark:hover:bg-white/4 flex items-center gap-2 text-xs transition-colors"
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Settings & Preferences</span>
            </button>

            {settings.invertInDarkMode && (
              <div className="mt-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium">Invert in dark mode active</span>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="main-content p-6 md:p-12 overflow-y-auto">
          {/* Breadcrumbs or Folder Title */}
          <div className="flex items-center justify-between mb-6">
            <nav className="flex items-center gap-1.5 text-xs text-stone-500">
              {getBreadcrumbs().map((crumb, idx, arr) => (
                <React.Fragment key={crumb.id || 'root'}>
                  <button
                    onClick={() => {
                      onSelectFolder(crumb.id);
                      setActiveTab('all');
                    }}
                    className={`hover:opacity-100 transition-opacity ${
                      idx === arr.length - 1 ? 'font-bold text-[var(--ink)]' : 'opacity-60'
                    }`}
                  >
                    {crumb.name}
                  </button>
                  {idx < arr.length - 1 && (
                    <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </nav>

            <span className="text-xs opacity-50 font-mono">
              {sortedNotes.length} {sortedNotes.length === 1 ? 'Note' : 'Notes'}
            </span>
          </div>

          {/* Variation 1 Section Label */}
          <h2 className="label mb-6 opacity-60">
            {searchQuery
              ? `Search Results for "${searchQuery}"`
              : activeTab === 'recents'
              ? 'Recent Notes'
              : currentFolder
              ? currentFolder.name
              : 'Recent Notes'}
          </h2>

          {/* Cards Grid (3 Columns from design variation) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Note Cards */}
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => onOpenNote(note.id)}
                className="card group relative cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Container */}
                  <div className="h-[150px] bg-[#f0f0f0] dark:bg-[#202024] mb-4 rounded-2xl overflow-hidden relative border border-black/4 dark:border-white/4">
                    {renderNoteThumbnail(note)}
                  </div>

                  {/* Note Title & Rename */}
                  {editingNoteId === note.id ? (
                    <input
                      type="text"
                      value={editingTitle}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => {
                        if (editingTitle.trim()) onRenameNote(note.id, editingTitle.trim());
                        setEditingNoteId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (editingTitle.trim()) onRenameNote(note.id, editingTitle.trim());
                          setEditingNoteId(null);
                        }
                      }}
                      className="text-base font-bold font-display px-2 py-1 w-full rounded-lg border border-[var(--ink)] bg-transparent text-[var(--ink)] outline-hidden"
                    />
                  ) : (
                    <h3 className="m-0 text-base font-bold font-display truncate text-[var(--ink)]">
                      {note.title}
                    </h3>
                  )}
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-black/5 dark:border-white/5">
                  <p className="text-xs opacity-60 m-0 font-sans">
                    {new Date(note.updatedAt).toLocaleDateString()}
                    <span className="mx-1.5 opacity-40">•</span>
                    {note.pages.length} {note.pages.length === 1 ? 'page' : 'pages'}
                  </p>

                  {/* Context Action Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuNoteId(activeMenuNoteId === note.id ? null : note.id);
                      }}
                      className="p-1 rounded-full opacity-40 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {activeMenuNoteId === note.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 bottom-full mb-1 w-44 bg-white dark:bg-[#1f1f23] rounded-2xl shadow-2xl border border-black/8 dark:border-white/8 py-1.5 z-50 text-xs"
                      >
                        <button
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setEditingTitle(note.title);
                            setActiveMenuNoteId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                        >
                          <Edit2 className="w-3.5 h-3.5 opacity-60" />
                          <span>Rename</span>
                        </button>

                        <button
                          onClick={() => {
                            onDuplicateNote(note.id);
                            setActiveMenuNoteId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5 opacity-60" />
                          <span>Duplicate</span>
                        </button>

                        <button
                          onClick={() => {
                            onExportNote(note);
                            setActiveMenuNoteId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5 opacity-60" />
                          <span>Export .sbn</span>
                        </button>

                        <button
                          onClick={() => {
                            setMovingNoteId(note.id);
                            setActiveMenuNoteId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                        >
                          <FolderInput className="w-3.5 h-3.5 opacity-60" />
                          <span>Move to...</span>
                        </button>

                        <div className="border-t border-black/5 dark:border-white/5 my-1" />

                        <button
                          onClick={() => {
                            onDeleteNote(note.id);
                            setActiveMenuNoteId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Variation 1: "+ Create New" Dashed Card */}
            <div
              onClick={() => onCreateNote(currentFolderId)}
              className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-[1.5rem] min-h-[240px] flex flex-col items-center justify-center cursor-pointer hover:border-black/30 dark:hover:border-white/30 hover:bg-black/2 dark:hover:bg-white/2 transition-all group p-6"
            >
              <div className="w-12 h-12 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 opacity-70 group-hover:opacity-100" />
              </div>
              <p className="m-0 text-sm font-semibold font-display opacity-80 group-hover:opacity-100">
                + Create New
              </p>
              <span className="text-[11px] opacity-40 font-sans mt-1">
                Start a fresh handwritten note
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateFolderSubmit}
            className="w-full max-w-sm card shadow-2xl space-y-4"
          >
            <h3 className="font-bold text-lg font-display m-0">Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-black/4 dark:bg-white/6 border border-black/8 dark:border-white/8 outline-hidden focus:border-[var(--ink)]"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewFolderModal(false)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium opacity-60 hover:opacity-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="btn-primary"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Move Note Modal */}
      {movingNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm card shadow-2xl space-y-4">
            <h3 className="font-bold text-lg font-display m-0">Move Note</h3>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              <button
                onClick={() => {
                  onMoveNote(movingNoteId, null);
                  setMovingNoteId(null);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
              >
                <FolderIcon className="w-4 h-4 opacity-40" />
                <span>Home / Root</span>
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    onMoveNote(movingNoteId, f.id);
                    setMovingNoteId(null);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                >
                  <FolderIcon className="w-4 h-4" style={{ color: f.color || 'var(--ink)' }} />
                  <span>{f.name}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setMovingNoteId(null)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium opacity-60 hover:opacity-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
