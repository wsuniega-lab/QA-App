import { newId } from '../lib/id';
import { ALL_ITEMS, type ChecklistSection } from './checklist';
import type { Inspection, ItemResponse, PieceInfo } from './types';

export const EMPTY_RESPONSE: ItemResponse = { result: null, note: '', photos: [] };

export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function emptyPiece(): PieceInfo {
  return {
    jobNumber: '',
    projectName: '',
    pieceMark: '',
    pieceType: '',
    bed: '',
    pourDate: today(),
    drawingNumber: '',
    drawingRevision: '',
  };
}

export function createInspection(piece: PieceInfo): Inspection {
  const now = new Date().toISOString();
  return {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    status: 'draft',
    piece,
    responses: {},
    generalPhotos: [],
    generalNotes: '',
    signOff: null,
  };
}

export function responseFor(inspection: Inspection, itemId: string): ItemResponse {
  return inspection.responses[itemId] ?? EMPTY_RESPONSE;
}

export interface Progress {
  total: number;
  answered: number;
  pass: number;
  fail: number;
  na: number;
}

export function progress(inspection: Inspection, section?: ChecklistSection): Progress {
  const items = section ? section.items : ALL_ITEMS;
  const p: Progress = { total: items.length, answered: 0, pass: 0, fail: 0, na: 0 };
  for (const item of items) {
    const r = inspection.responses[item.id]?.result;
    if (!r) continue;
    p.answered++;
    p[r]++;
  }
  return p;
}

export function photoCount(inspection: Inspection): number {
  return (
    inspection.generalPhotos.length +
    Object.values(inspection.responses).reduce((n, r) => n + r.photos.length, 0)
  );
}

/** Reasons the piece cannot be released to pour yet. Empty means it can. */
export function releaseBlockers(inspection: Inspection): string[] {
  const p = progress(inspection);
  const blockers: string[] = [];
  if (p.answered < p.total) blockers.push(`${p.total - p.answered} checklist item(s) not answered`);
  if (p.fail > 0) blockers.push(`${p.fail} item(s) failed; correct and re-check them before release`);
  if (!inspection.piece.pieceMark.trim()) blockers.push('Piece mark is missing');
  return blockers;
}

export function pieceTitle(piece: Pick<PieceInfo, 'pieceMark' | 'pieceType'>): string {
  const mark = piece.pieceMark.trim() || 'Unmarked piece';
  return piece.pieceType ? `${mark} · ${piece.pieceType}` : mark;
}
