
export interface WeightLog {
  id: string;
  date: number;
  weight: number;
  unit: 'kg' | 'lbs';
  photoId?: string;
  bmi?: number;
}

export interface PhotoEntry {
  id: string;
  blob: Blob;
  timestamp: number;
}

export interface AppSettings {
  height: number; // in cm
  targetWeight: number;
  unit: 'kg' | 'lbs';
  ghostOpacity: number;
  localOnly: boolean;
  optimizedStorage: boolean;
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  CAMERA = 'camera',
  LOGS = 'logs',
  GALLERY = 'gallery',
  SETTINGS = 'settings'
}

export interface Milestone {
  id: string;
  label: string;
  achieved: boolean;
  target: number;
}
