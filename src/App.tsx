import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Note, Folder, AppSettings, ToolType, BackgroundPattern, Page, Stroke } from './types/note';
import {
  getStoredNotes,
  saveNotes,
  getStoredFolders,
  saveFolders,
  getStoredSettings,
  saveSettings,
  createNewNote,
  createNewFolder,
  exportNoteAsSbn,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { NotesBrowser } from './components/NotesBrowser';
import { NoteCanvas } from './components/NoteCanvas';
import { Toolbar } from './components/Toolbar';
import { SettingsModal } from './components/SettingsModal';
import { drawBackgroundPattern, getAdjustedColor, getStrokeOptionsForTool, getSvgPathFromStroke } from './utils/canvasHelper';
import { getStroke } from 'perfect-freehand';

export const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(() => getStoredNotes());
  const [folders, setFolders] = useState<Folder[]>(() => getStoredFolders());
  const [settings, setSettings] = useState<AppSettings>(() => getStoredSettings());

  // Navigation state
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Editor drawing state
  const [currentTool, setCurrentTool] = useState<ToolType>('fountain');
  const [currentColor, setCurrentColor] = useState<string>('#0f172a');
  const [currentSize, setCurrentSize] = useState<number>(5);

  // Undo / Redo history for current page: array of Stroke[]
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);

  // Modals
  const [showSettings, setShowSettings] = useState(false);

  // Determine system dark mode preference
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const isDarkMode = useMemo(() => {
    if (settings.theme === 'dark') return true;
    if (settings.theme === 'light') return false;
    return systemPrefersDark;
  }, [settings.theme, systemPrefersDark]);

  // Sync dark class on documentElement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Save notes whenever they change
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  // Save folders whenever they change
  useEffect(() => {
    saveFolders(folders);
  }, [folders]);

  // Save settings whenever they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Active Note & Page
  const activeNote = useMemo(() => {
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  const activePage: Page | null = useMemo(() => {
    if (!activeNote || !activeNote.pages[activePageIndex]) return null;
    return activeNote.pages[activePageIndex];
  }, [activeNote, activePageIndex]);

  // When switching note or page, clear undo/redo
  useEffect(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, [activeNoteId, activePageIndex]);

  // Handle page update (e.g. stroke added or erased)
  const handlePageUpdate = useCallback(
    (updatedPage: Page) => {
      if (!activeNote || !activePage) return;

      // Push previous strokes to undo stack
      setUndoStack((prev) => [...prev, activePage.strokes]);
      setRedoStack([]); // Clear redo

      const updatedPages = [...activeNote.pages];
      updatedPages[activePageIndex] = updatedPage;

      const updatedNote: Note = {
        ...activeNote,
        pages: updatedPages,
        updatedAt: Date.now(),
      };

      setNotes((prevNotes) =>
        prevNotes.map((n) => (n.id === updatedNote.id ? updatedNote : n))
      );
    },
    [activeNote, activePage, activePageIndex]
  );

  // Undo action
  const handleUndo = useCallback(() => {
    if (!activeNote || !activePage || undoStack.length === 0) return;

    const previousStrokes = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [...prev, activePage.strokes]);

    const updatedPages = [...activeNote.pages];
    updatedPages[activePageIndex] = {
      ...activePage,
      strokes: previousStrokes,
    };

    const updatedNote: Note = {
      ...activeNote,
      pages: updatedPages,
      updatedAt: Date.now(),
    };

    setNotes((prevNotes) =>
      prevNotes.map((n) => (n.id === updatedNote.id ? updatedNote : n))
    );
  }, [activeNote, activePage, undoStack, activePageIndex]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (!activeNote || !activePage || redoStack.length === 0) return;

    const nextStrokes = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setUndoStack((prev) => [...prev, activePage.strokes]);

    const updatedPages = [...activeNote.pages];
    updatedPages[activePageIndex] = {
      ...activePage,
      strokes: nextStrokes,
    };

    const updatedNote: Note = {
      ...activeNote,
      pages: updatedPages,
      updatedAt: Date.now(),
    };

    setNotes((prevNotes) =>
      prevNotes.map((n) => (n.id === updatedNote.id ? updatedNote : n))
    );
  }, [activeNote, activePage, redoStack, activePageIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'p' || e.key === 'P') {
        setCurrentTool('fountain');
      } else if (e.key === 'b' || e.key === 'B') {
        setCurrentTool('ballpoint');
      } else if (e.key === 'h' || e.key === 'H') {
        setCurrentTool('highlighter');
      } else if (e.key === 'e' || e.key === 'E') {
        setCurrentTool('eraser');
      } else if (e.key === 's' || e.key === 'S') {
        setCurrentTool('shape');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Note management handlers
  const handleCreateNote = (folderId: string | null) => {
    const newNote = createNewNote('Untitled Note', folderId, settings.defaultPattern);
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setActivePageIndex(0);
  };

  const handleCreateFolder = (name: string, parentId: string | null) => {
    const newFolder = createNewFolder(name, parentId);
    setFolders((prev) => [...prev, newFolder]);
  };

  const handleRenameNote = (noteId: string, newTitle: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, title: newTitle, updatedAt: Date.now() } : n))
    );
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    if (activeNoteId === noteId) {
      setActiveNoteId(null);
    }
  };

  const handleDuplicateNote = (noteId: string) => {
    const original = notes.find((n) => n.id === noteId);
    if (!original) return;
    const duplicated: Note = {
      ...original,
      id: 'note_' + Math.random().toString(36).substring(2, 9),
      title: `${original.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNotes((prev) => [duplicated, ...prev]);
  };

  const handleMoveNote = (noteId: string, targetFolderId: string | null) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, folderId: targetFolderId, updatedAt: Date.now() } : n))
    );
  };

  const handleDeleteFolder = (folderId: string) => {
    // Delete folder and move contained notes to root
    setFolders((prev) => prev.filter((f) => f.id !== folderId && f.parentId !== folderId));
    setNotes((prev) =>
      prev.map((n) => (n.folderId === folderId ? { ...n, folderId: null } : n))
    );
    if (currentFolderId === folderId) {
      setCurrentFolderId(null);
    }
  };

  // Add new page to active note
  const handleAddPage = () => {
    if (!activeNote) return;
    const newPage: Page = {
      id: 'page_' + Math.random().toString(36).substring(2, 9),
      pageNumber: activeNote.pages.length + 1,
      strokes: [],
      backgroundPattern: settings.defaultPattern,
      width: 800,
      height: 1100,
    };

    const updatedPages = [...activeNote.pages, newPage];
    const updatedNote: Note = {
      ...activeNote,
      pages: updatedPages,
      updatedAt: Date.now(),
    };

    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    setActivePageIndex(updatedPages.length - 1);
  };

  // Change background pattern for active page
  const handleSelectPattern = (pattern: BackgroundPattern) => {
    if (!activeNote || !activePage) return;
    const updatedPages = [...activeNote.pages];
    updatedPages[activePageIndex] = {
      ...activePage,
      backgroundPattern: pattern,
    };
    const updatedNote = {
      ...activeNote,
      pages: updatedPages,
      updatedAt: Date.now(),
    };
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
  };

  // Export handlers
  const handleExport = (format: 'png' | 'sbn' | 'svg') => {
    if (!activeNote || !activePage) return;

    if (format === 'sbn') {
      exportNoteAsSbn(activeNote);
      return;
    }

    if (format === 'png') {
      // Render page to an offscreen canvas and trigger download
      const exportCanvas = document.createElement('canvas');
      const dpr = 2; // High-res export
      const width = activePage.width;
      const height = activePage.height;
      exportCanvas.width = width * dpr;
      exportCanvas.height = height * dpr;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      const invertActive = isDarkMode && settings.invertInDarkMode;

      // Draw background
      drawBackgroundPattern(
        ctx,
        width,
        height,
        activePage.backgroundPattern,
        invertActive,
        settings.gridSpacing
      );

      // Render highlighters
      const highlighterStrokes = activePage.strokes.filter((s) => s.tool === 'highlighter');
      const inkStrokes = activePage.strokes.filter((s) => s.tool !== 'highlighter');

      if (highlighterStrokes.length > 0) {
        ctx.save();
        const hlCanvas = document.createElement('canvas');
        hlCanvas.width = width * dpr;
        hlCanvas.height = height * dpr;
        const hlCtx = hlCanvas.getContext('2d');
        if (hlCtx) {
          hlCtx.scale(dpr, dpr);
          for (const stroke of highlighterStrokes) {
            const adj = getAdjustedColor(stroke.color, isDarkMode, invertActive);
            hlCtx.fillStyle = adj;
            if (stroke.points.length >= 2) {
              const outline = getStroke(
                stroke.points,
                getStrokeOptionsForTool('highlighter', stroke.size)
              );
              const path = new Path2D(getSvgPathFromStroke(outline));
              hlCtx.fill(path);
            }
          }
          ctx.globalAlpha = invertActive ? 0.6 : 0.45;
          ctx.globalCompositeOperation = invertActive ? 'screen' : 'multiply';
          ctx.drawImage(hlCanvas, 0, 0, width, height);
        }
        ctx.restore();
      }

      // Render ink strokes
      ctx.save();
      for (const stroke of inkStrokes) {
        const color = getAdjustedColor(stroke.color, isDarkMode, invertActive);
        ctx.fillStyle = color;
        ctx.strokeStyle = color;

        if (stroke.shapeType && stroke.shapeData) {
          const { startX, startY, endX, endY, radius } = stroke.shapeData;
          ctx.lineWidth = stroke.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          if (stroke.shapeType === 'line') {
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          } else if (stroke.shapeType === 'rectangle') {
            ctx.strokeRect(
              Math.min(startX, endX),
              Math.min(startY, endY),
              Math.abs(endX - startX),
              Math.abs(endY - startY)
            );
          } else if (stroke.shapeType === 'circle' && radius) {
            ctx.arc(startX, startY, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (stroke.points.length > 0) {
          const outline = getStroke(
            stroke.points,
            getStrokeOptionsForTool(stroke.tool, stroke.size)
          );
          const path = new Path2D(getSvgPathFromStroke(outline));
          ctx.fill(path);
        }
      }
      ctx.restore();

      // Download PNG
      const link = document.createElement('a');
      link.download = `${activeNote.title}_page_${activePage.pageNumber}.png`;
      link.href = exportCanvas.toDataURL('image/png');
      link.click();
    }
  };

  // Import file handler
  const handleImportNote = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed && parsed.title && Array.isArray(parsed.pages)) {
          const importedNote: Note = {
            ...parsed,
            id: 'note_' + Math.random().toString(36).substring(2, 9),
            updatedAt: Date.now(),
          };
          setNotes((prev) => [importedNote, ...prev]);
          setActiveNoteId(importedNote.id);
          setActivePageIndex(0);
        }
      } catch (err) {
        console.error('Failed to import file', err);
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemoData = () => {
    localStorage.clear();
    setNotes(getStoredNotes());
    setFolders(getStoredFolders());
    setSettings(DEFAULT_SETTINGS);
    setActiveNoteId(null);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--bg)] text-[var(--ink)] select-none">
      {activeNote && activePage ? (
        // Editor View
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Toolbar
            currentTool={currentTool}
            onSelectTool={setCurrentTool}
            currentColor={currentColor}
            onSelectColor={setCurrentColor}
            currentSize={currentSize}
            onSelectSize={setCurrentSize}
            currentPattern={activePage.backgroundPattern}
            onSelectPattern={handleSelectPattern}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => {
              setSettings((prev) => ({
                ...prev,
                theme: isDarkMode ? 'light' : 'dark',
              }));
            }}
            invertInDarkMode={settings.invertInDarkMode}
            onToggleInvert={() => {
              setSettings((prev) => ({
                ...prev,
                invertInDarkMode: !prev.invertInDarkMode,
              }));
            }}
            canUndo={undoStack.length > 0}
            canRedo={redoStack.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            currentPage={activePageIndex + 1}
            totalPages={activeNote.pages.length}
            onPrevPage={() => setActivePageIndex((prev) => Math.max(0, prev - 1))}
            onNextPage={() =>
              setActivePageIndex((prev) => Math.min(activeNote.pages.length - 1, prev + 1))
            }
            onAddPage={handleAddPage}
            onExport={handleExport}
            onOpenSettings={() => setShowSettings(true)}
            onBackToNotes={() => setActiveNoteId(null)}
            title={activeNote.title}
            onTitleChange={(newTitle) => handleRenameNote(activeNote.id, newTitle)}
          />

          <div className="flex-1 overflow-auto bg-[#EFECE6] dark:bg-[#0d0d0f] flex justify-center">
            <NoteCanvas
              page={activePage}
              currentTool={currentTool}
              currentColor={currentColor}
              currentSize={currentSize}
              settings={settings}
              isDarkMode={isDarkMode}
              onPageUpdate={handlePageUpdate}
              canUndo={undoStack.length > 0}
              canRedo={redoStack.length > 0}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
          </div>
        </div>
      ) : (
        // Notes & Folder Browser
        <NotesBrowser
          notes={notes}
          folders={folders}
          currentFolderId={currentFolderId}
          onSelectFolder={setCurrentFolderId}
          onOpenNote={(id) => {
            setActiveNoteId(id);
            setActivePageIndex(0);
          }}
          onCreateNote={handleCreateNote}
          onCreateFolder={handleCreateFolder}
          onRenameNote={handleRenameNote}
          onDeleteNote={handleDeleteNote}
          onDuplicateNote={handleDuplicateNote}
          onMoveNote={handleMoveNote}
          onDeleteFolder={handleDeleteFolder}
          onExportNote={(n) => exportNoteAsSbn(n)}
          onImportNote={handleImportNote}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => {
            setSettings((prev) => ({
              ...prev,
              theme: isDarkMode ? 'light' : 'dark',
            }));
          }}
          onOpenSettings={() => setShowSettings(true)}
          settings={settings}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onResetDemoData={handleResetDemoData}
      />
    </div>
  );
};
export default App;
