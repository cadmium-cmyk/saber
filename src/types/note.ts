export type ToolType = 'fountain' | 'ballpoint' | 'pencil' | 'highlighter' | 'eraser' | 'shape';

export type BackgroundPattern = 'blank' | 'ruled' | 'grid' | 'dotted' | 'isometric';

export interface Stroke {
  id: string;
  tool: ToolType;
  points: number[][]; // [x, y, pressure]
  color: string;
  size: number;
  shapeType?: 'line' | 'rectangle' | 'circle';
  shapeData?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    radius?: number;
  };
  createdAt: number;
}

export interface Page {
  id: string;
  pageNumber: number;
  strokes: Stroke[];
  backgroundPattern: BackgroundPattern;
  backgroundColor?: string;
  width: number;
  height: number;
}

export interface Note {
  id: string;
  title: string;
  folderId: string | null;
  pages: Page[];
  createdAt: number;
  updatedAt: number;
  preview?: string;
  pinned?: boolean;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  color?: string;
  createdAt: number;
}

export interface AppSettings {
  theme: 'system' | 'light' | 'dark';
  invertInDarkMode: boolean;
  defaultPattern: BackgroundPattern;
  gridSpacing: number; // e.g. 28px
  simulatePressure: boolean;
  hapticFeedback: boolean;
  autoSaveDelay: number;
}
