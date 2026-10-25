import type { Inspection, InspectionSummary, Photo, Settings } from '../types';

/**
 * Everything the app reads or writes goes through this interface. The trial
 * build uses `LocalStore` (SQLite + files on the phone). A cloud version
 * (e.g. Supabase) only needs to implement the same methods and be returned
 * from `storage/index.ts`; no screen code has to change.
 */
export interface Store {
  listInspections(): Promise<InspectionSummary[]>;
  getInspection(id: string): Promise<Inspection | null>;
  saveInspection(inspection: Inspection): Promise<void>;
  deleteInspection(id: string): Promise<void>;

  /** Copies a captured image into permanent storage and returns its record. */
  addPhoto(sourceUri: string): Promise<Photo>;
  deletePhoto(photo: Photo): Promise<void>;
  /** A URI that `<Image>` can display. */
  photoUri(photo: Photo): string;
  photoBase64(photo: Photo): Promise<string>;

  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}
