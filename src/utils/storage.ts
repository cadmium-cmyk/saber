import { Note, Folder, AppSettings, Page, Stroke } from '../types/note';

const NOTES_KEY = 'saber_notes_v1';
const FOLDERS_KEY = 'saber_folders_v1';
const SETTINGS_KEY = 'saber_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  invertInDarkMode: true,
  defaultPattern: 'ruled',
  gridSpacing: 30,
  simulatePressure: true,
  hapticFeedback: true,
  autoSaveDelay: 1000,
};

function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// Generate realistic handwriting strokes for seed notes
function createSampleStrokes(): Stroke[] {
  const strokes: Stroke[] = [];

  // "Welcome to Saber!" title with Fountain Pen (smooth, pressure variation)
  // Letter "S"
  strokes.push({
    id: generateId(),
    tool: 'fountain',
    color: '#0f172a',
    size: 7,
    points: [
      [140, 110, 0.4], [130, 105, 0.5], [115, 108, 0.6], [105, 120, 0.7],
      [105, 135, 0.8], [115, 145, 0.7], [130, 155, 0.6], [138, 168, 0.7],
      [135, 182, 0.8], [120, 192, 0.7], [102, 188, 0.5]
    ],
    createdAt: Date.now() - 50000,
  });

  // "aber"
  strokes.push({
    id: generateId(),
    tool: 'fountain',
    color: '#0f172a',
    size: 5,
    points: [
      [155, 150, 0.5], [165, 145, 0.6], [175, 155, 0.7], [165, 175, 0.6],
      [152, 165, 0.5], [162, 148, 0.6], [175, 178, 0.7], [185, 185, 0.4]
    ],
    createdAt: Date.now() - 48000,
  });

  // Underline with Fountain pen
  strokes.push({
    id: generateId(),
    tool: 'fountain',
    color: '#3b82f6', // Saber Blue
    size: 4,
    points: [
      [95, 205, 0.3], [140, 207, 0.7], [220, 206, 0.8], [300, 204, 0.5], [330, 202, 0.3]
    ],
    createdAt: Date.now() - 45000,
  });

  // Highlighter stroke across the title
  strokes.push({
    id: generateId(),
    tool: 'highlighter',
    color: '#facc15', // Yellow
    size: 14,
    points: [
      [90, 155, 1], [180, 155, 1], [270, 153, 1], [340, 152, 1]
    ],
    createdAt: Date.now() - 40000,
  });

  // Another overlapping highlighter stroke (proving no dark overlap mud)
  strokes.push({
    id: generateId(),
    tool: 'highlighter',
    color: '#facc15',
    size: 14,
    points: [
      [120, 148, 1], [200, 150, 1], [290, 154, 1]
    ],
    createdAt: Date.now() - 39000,
  });

  // Text explanation: "Try inverting dark mode in the toolbar!"
  strokes.push({
    id: generateId(),
    tool: 'ballpoint',
    color: '#0f172a',
    size: 3,
    points: [
      [100, 260, 0.5], [115, 260, 0.5], [108, 260, 0.5], [108, 280, 0.5] // T
    ],
    createdAt: Date.now() - 30000,
  });

  // A neat hand-drawn geometric rectangle using shape tool
  strokes.push({
    id: generateId(),
    tool: 'shape',
    color: '#10b981', // Emerald
    size: 3,
    shapeType: 'rectangle',
    shapeData: {
      startX: 95,
      startY: 320,
      endX: 360,
      endY: 420,
    },
    points: [],
    createdAt: Date.now() - 25000,
  });

  // Circle shape inside
  strokes.push({
    id: generateId(),
    tool: 'shape',
    color: '#8b5cf6', // Violet
    size: 3,
    shapeType: 'circle',
    shapeData: {
      startX: 480,
      startY: 370,
      endX: 540,
      endY: 370,
      radius: 55,
    },
    points: [],
    createdAt: Date.now() - 20000,
  });

  // Cute handwriting scribble
  strokes.push({
    id: generateId(),
    tool: 'pencil',
    color: '#475569',
    size: 2.5,
    points: [
      [120, 360, 0.6], [140, 370, 0.5], [160, 360, 0.6], [180, 370, 0.7],
      [200, 360, 0.5], [220, 370, 0.6], [240, 360, 0.5]
    ],
    createdAt: Date.now() - 15000,
  });

  return strokes;
}

const SEED_NOTES: Note[] = [
  {
    id: 'note_welcome',
    title: 'Welcome to Saber ⚡',
    folderId: null,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 3600000,
    pinned: true,
    pages: [
      {
        id: 'page_w1',
        pageNumber: 1,
        strokes: createSampleStrokes(),
        backgroundPattern: 'ruled',
        width: 800,
        height: 1100,
      },
      {
        id: 'page_w2',
        pageNumber: 2,
        strokes: [
          {
            id: generateId(),
            tool: 'fountain',
            color: '#0f172a',
            size: 6,
            points: [
              [120, 120, 0.5], [140, 115, 0.7], [160, 125, 0.6], [180, 118, 0.8]
            ],
            createdAt: Date.now() - 10000,
          },
          {
            id: generateId(),
            tool: 'highlighter',
            color: '#38bdf8', // Cyan
            size: 16,
            points: [
              [100, 120, 1], [220, 120, 1], [300, 120, 1]
            ],
            createdAt: Date.now() - 9000,
          }
        ],
        backgroundPattern: 'grid',
        width: 800,
        height: 1100,
      }
    ],
  },
  {
    id: 'note_math',
    title: 'Calculus & Physics Notes',
    folderId: 'folder_lectures',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 7200000,
    pinned: false,
    pages: [
      {
        id: 'page_m1',
        pageNumber: 1,
        strokes: [
          // Integral symbol
          {
            id: generateId(),
            tool: 'fountain',
            color: '#dc2626',
            size: 5,
            points: [
              [150, 160, 0.4], [140, 150, 0.7], [130, 160, 0.8], [132, 200, 0.6],
              [135, 240, 0.8], [125, 250, 0.7], [115, 245, 0.4]
            ],
            createdAt: Date.now() - 20000,
          },
          // f(x) dx
          {
            id: generateId(),
            tool: 'fountain',
            color: '#0f172a',
            size: 4,
            points: [
              [160, 190, 0.6], [170, 185, 0.6], [165, 215, 0.5], [155, 195, 0.7], [175, 195, 0.7]
            ],
            createdAt: Date.now() - 19000,
          },
          // Grid sketch axis
          {
            id: generateId(),
            tool: 'shape',
            color: '#0284c7',
            size: 2,
            shapeType: 'line',
            shapeData: { startX: 100, startY: 450, endX: 450, endY: 450 },
            points: [],
            createdAt: Date.now() - 18000,
          },
          {
            id: generateId(),
            tool: 'shape',
            color: '#0284c7',
            size: 2,
            shapeType: 'line',
            shapeData: { startX: 150, startY: 550, endX: 150, endY: 350 },
            points: [],
            createdAt: Date.now() - 17000,
          }
        ],
        backgroundPattern: 'grid',
        width: 800,
        height: 1100,
      }
    ],
  }
];

const SEED_FOLDERS: Folder[] = [
  {
    id: 'folder_lectures',
    name: 'Lectures',
    parentId: null,
    color: '#3b82f6',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'folder_sketches',
    name: 'Sketches & Ideas',
    parentId: null,
    color: '#10b981',
    createdAt: Date.now() - 86400000 * 2,
  }
];

export function getStoredNotes(): Note[] {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) {
      localStorage.setItem(NOTES_KEY, JSON.stringify(SEED_NOTES));
      return SEED_NOTES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load notes from localStorage', err);
    return SEED_NOTES;
  }
}

export function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (err) {
    console.error('Failed to save notes', err);
  }
}

export function getStoredFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    if (!raw) {
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(SEED_FOLDERS));
      return SEED_FOLDERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load folders from localStorage', err);
    return SEED_FOLDERS;
  }
}

export function saveFolders(folders: Folder[]): void {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  } catch (err) {
    console.error('Failed to save folders', err);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

export function createNewNote(title = 'Untitled Note', folderId: string | null = null, pattern = 'ruled'): Note {
  const newNote: Note = {
    id: 'note_' + generateId(),
    title,
    folderId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pages: [
      {
        id: 'page_' + generateId(),
        pageNumber: 1,
        strokes: [],
        backgroundPattern: pattern as any,
        width: 800,
        height: 1100,
      }
    ],
  };

  const current = getStoredNotes();
  const updated = [newNote, ...current];
  saveNotes(updated);
  return newNote;
}

export function createNewFolder(name: string, parentId: string | null = null, color = '#3b82f6'): Folder {
  const newFolder: Folder = {
    id: 'folder_' + generateId(),
    name,
    parentId,
    color,
    createdAt: Date.now(),
  };

  const current = getStoredFolders();
  const updated = [...current, newFolder];
  saveFolders(updated);
  return newFolder;
}

export function exportNoteAsSbn(note: Note): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(note, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `${note.title.replace(/[/\\?%*:|"<>]/g, '_')}.sbn`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
