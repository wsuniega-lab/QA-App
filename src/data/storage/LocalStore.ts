import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { newId } from '../../lib/id';
import type { Inspection, InspectionSummary, Photo, Settings } from '../types';
import type { Store } from './Store';

const DEFAULT_SETTINGS: Settings = { companyName: '', plantLocation: '', defaultInspector: '' };

interface InspectionRow {
  id: string;
  status: Inspection['status'];
  job_number: string;
  project_name: string;
  piece_mark: string;
  piece_type: string;
  pour_date: string;
  updated_at: string;
}

/** Stores inspections in SQLite and photos as JPEG files in the app's document directory. */
export class LocalStore implements Store {
  private db: Promise<SQLite.SQLiteDatabase> | null = null;
  private photoDir = new Directory(Paths.document, 'photos');

  private open(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = (async () => {
        const db = await SQLite.openDatabaseAsync('precast-qa.db');
        await db.execAsync(`
          PRAGMA journal_mode = WAL;
          CREATE TABLE IF NOT EXISTS inspections (
            id TEXT PRIMARY KEY NOT NULL,
            status TEXT NOT NULL,
            job_number TEXT NOT NULL,
            project_name TEXT NOT NULL,
            piece_mark TEXT NOT NULL,
            piece_type TEXT NOT NULL,
            pour_date TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            data TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL
          );
        `);
        if (!this.photoDir.exists) this.photoDir.create({ intermediates: true });
        return db;
      })();
      this.db.catch(() => (this.db = null));
    }
    return this.db;
  }

  async listInspections(): Promise<InspectionSummary[]> {
    const db = await this.open();
    const rows = await db.getAllAsync<InspectionRow>(
      `SELECT id, status, job_number, project_name, piece_mark, piece_type, pour_date, updated_at
       FROM inspections ORDER BY updated_at DESC`,
    );
    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      jobNumber: r.job_number,
      projectName: r.project_name,
      pieceMark: r.piece_mark,
      pieceType: r.piece_type,
      pourDate: r.pour_date,
      updatedAt: r.updated_at,
    }));
  }

  async getInspection(id: string): Promise<Inspection | null> {
    const db = await this.open();
    const row = await db.getFirstAsync<{ data: string }>('SELECT data FROM inspections WHERE id = ?', id);
    return row ? (JSON.parse(row.data) as Inspection) : null;
  }

  async saveInspection(inspection: Inspection): Promise<void> {
    const db = await this.open();
    const p = inspection.piece;
    await db.runAsync(
      `INSERT OR REPLACE INTO inspections
         (id, status, job_number, project_name, piece_mark, piece_type, pour_date, updated_at, data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      inspection.id,
      inspection.status,
      p.jobNumber,
      p.projectName,
      p.pieceMark,
      p.pieceType,
      p.pourDate,
      inspection.updatedAt,
      JSON.stringify(inspection),
    );
  }

  async deleteInspection(id: string): Promise<void> {
    const inspection = await this.getInspection(id);
    if (inspection) {
      const photos = [
        ...inspection.generalPhotos,
        ...Object.values(inspection.responses).flatMap((r) => r.photos),
      ];
      await Promise.all(photos.map((p) => this.deletePhoto(p)));
    }
    const db = await this.open();
    await db.runAsync('DELETE FROM inspections WHERE id = ?', id);
  }

  async addPhoto(sourceUri: string): Promise<Photo> {
    await this.open();
    const id = newId();
    const file = `${id}.jpg`;
    new File(sourceUri).copySync(new File(this.photoDir, file));
    return { id, file, takenAt: new Date().toISOString() };
  }

  async deletePhoto(photo: Photo): Promise<void> {
    const f = new File(this.photoDir, photo.file);
    if (f.exists) f.delete();
  }

  photoUri(photo: Photo): string {
    return new File(this.photoDir, photo.file).uri;
  }

  async photoBase64(photo: Photo): Promise<string> {
    return new File(this.photoDir, photo.file).base64();
  }

  async getSettings(): Promise<Settings> {
    const db = await this.open();
    const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'settings'");
    return row ? { ...DEFAULT_SETTINGS, ...(JSON.parse(row.value) as Partial<Settings>) } : DEFAULT_SETTINGS;
  }

  async saveSettings(settings: Settings): Promise<void> {
    const db = await this.open();
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('settings', ?)",
      JSON.stringify(settings),
    );
  }
}
