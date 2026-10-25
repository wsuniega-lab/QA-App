export type ItemResult = 'pass' | 'fail' | 'na';

export type InspectionStatus = 'draft' | 'released' | 'rejected';

export interface Photo {
  id: string;
  /** File name inside the app's photo directory (not an absolute path, which can change between app updates). */
  file: string;
  takenAt: string;
  caption?: string;
}

export interface ItemResponse {
  result: ItemResult | null;
  note: string;
  photos: Photo[];
}

export interface PieceInfo {
  jobNumber: string;
  projectName: string;
  pieceMark: string;
  pieceType: string;
  bed: string;
  pourDate: string;
  drawingNumber: string;
  drawingRevision: string;
}

export interface SignaturePath {
  d: string;
}

export interface SignOff {
  decision: Exclude<InspectionStatus, 'draft'>;
  inspectorName: string;
  signedAt: string;
  comments: string;
  signature: {
    width: number;
    height: number;
    paths: SignaturePath[];
  };
}

export interface Inspection {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: InspectionStatus;
  piece: PieceInfo;
  /** Keyed by checklist item id. */
  responses: Record<string, ItemResponse>;
  generalPhotos: Photo[];
  generalNotes: string;
  signOff: SignOff | null;
}

export interface InspectionSummary {
  id: string;
  status: InspectionStatus;
  jobNumber: string;
  projectName: string;
  pieceMark: string;
  pieceType: string;
  pourDate: string;
  updatedAt: string;
}

export interface Settings {
  companyName: string;
  plantLocation: string;
  defaultInspector: string;
}
