import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { CHECKLIST } from '../data/checklist';
import { progress, responseFor } from '../data/inspection';
import { store } from '../data/storage';
import type { Inspection, Photo, Settings } from '../data/types';
import { statusLabels } from '../theme';

const RESULT_LABEL = { pass: 'PASS', fail: 'FAIL', na: 'N/A' } as const;

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

async function photoTags(photos: Photo[], label: string): Promise<string> {
  const tags = await Promise.all(
    photos.map(async (p, i) => {
      const b64 = await store.photoBase64(p);
      const caption = [label && `${label} – photo ${i + 1}`, p.caption].filter(Boolean).join(': ');
      return `<figure><img src="data:image/jpeg;base64,${b64}"/><figcaption>${esc(caption)}<br/><span class="muted">${esc(fmtDateTime(p.takenAt))}</span></figcaption></figure>`;
    }),
  );
  return tags.join('');
}

export async function buildReportHtml(inspection: Inspection, settings: Settings): Promise<string> {
  const { piece, signOff } = inspection;
  const totals = progress(inspection);

  const sections: string[] = [];
  for (const section of CHECKLIST) {
    const rows: string[] = [];
    const photoBlocks: Promise<string>[] = [];
    section.items.forEach((item, idx) => {
      const r = responseFor(inspection, item.id);
      const ref = `${section.title} #${idx + 1}`;
      const result = r.result
        ? `<span class="res ${r.result}">${RESULT_LABEL[r.result]}</span>`
        : '<span class="res open">OPEN</span>';
      rows.push(
        `<tr><td class="num">${idx + 1}</td><td>${esc(item.text)}</td><td class="c">${result}</td><td>${esc(r.note)}${
          r.photos.length ? `<div class="muted">${r.photos.length} photo(s)</div>` : ''
        }</td></tr>`,
      );
      if (r.photos.length) photoBlocks.push(photoTags(r.photos, ref));
    });
    const photos = (await Promise.all(photoBlocks)).join('');
    const p = progress(inspection, section);
    sections.push(`
      <h2>${esc(section.title)} <span class="muted small">${p.pass} pass · ${p.fail} fail · ${p.na} N/A</span></h2>
      <table class="checks">
        <thead><tr><th>#</th><th>Check</th><th>Result</th><th class="notes">Notes</th></tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>
      ${photos ? `<div class="photos">${photos}</div>` : ''}
    `);
  }

  const general = await photoTags(inspection.generalPhotos, 'General');

  const sig = signOff
    ? `<svg viewBox="0 0 ${signOff.signature.width} ${signOff.signature.height}" class="sig">${signOff.signature.paths
        .map(
          (p) =>
            `<path d="${esc(p.d)}" stroke="#0B1F3A" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
        )
        .join('')}</svg>`
    : '';

  return `<!doctype html>
<html><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1B1F24; font-size: 11px; margin: 0; }
  header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #1F3A5F; padding-bottom: 8px; }
  h1 { font-size: 20px; margin: 0; color: #1F3A5F; }
  h2 { font-size: 14px; color: #1F3A5F; margin: 18px 0 6px; border-bottom: 1px solid #D5DAE1; padding-bottom: 3px; page-break-after: avoid; }
  .company { font-size: 13px; font-weight: 700; }
  .muted { color: #5F6B7A; }
  .small { font-size: 10px; font-weight: 400; }
  .status { display: inline-block; padding: 6px 12px; border-radius: 4px; color: #fff; font-weight: 700; font-size: 13px; margin-top: 10px; }
  .status.released { background: #1E8E3E; } .status.rejected { background: #C62828; } .status.draft { background: #B07B00; }
  table { width: 100%; border-collapse: collapse; }
  .info td { padding: 4px 6px; border: 1px solid #D5DAE1; }
  .info td.k { background: #F2F4F7; font-weight: 600; width: 18%; }
  .checks th { background: #1F3A5F; color: #fff; text-align: left; padding: 5px 6px; font-size: 10px; }
  .checks td { padding: 5px 6px; border-bottom: 1px solid #E3E7EC; vertical-align: top; }
  .checks tr { page-break-inside: avoid; }
  .num { width: 22px; color: #5F6B7A; } .c { text-align: center; width: 54px; } .notes { width: 34%; }
  .res { font-weight: 700; font-size: 10px; padding: 2px 5px; border-radius: 3px; color: #fff; }
  .res.pass { background: #1E8E3E; } .res.fail { background: #C62828; } .res.na { background: #6B7280; } .res.open { background: #B07B00; }
  .summary { display: flex; gap: 10px; margin-top: 10px; }
  .summary div { flex: 1; border: 1px solid #D5DAE1; border-radius: 4px; padding: 6px; text-align: center; }
  .summary b { display: block; font-size: 16px; }
  .photos { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
  figure { width: 48%; margin: 0; page-break-inside: avoid; }
  figure img { width: 100%; max-height: 260px; object-fit: contain; background: #F2F4F7; border: 1px solid #D5DAE1; }
  figcaption { font-size: 9px; margin-top: 2px; }
  .signoff { margin-top: 20px; border: 1px solid #D5DAE1; border-radius: 4px; padding: 10px; page-break-inside: avoid; }
  .sig { width: 260px; height: auto; border-bottom: 1px solid #1B1F24; display: block; }
  footer { margin-top: 18px; font-size: 9px; color: #5F6B7A; text-align: center; }
</style></head>
<body>
  <header>
    <div>
      <div class="company">${esc(settings.companyName || 'Precast QA/QC')}</div>
      ${settings.plantLocation ? `<div class="muted">${esc(settings.plantLocation)}</div>` : ''}
      <h1>Pre-Pour Inspection Report</h1>
    </div>
    <div class="muted" style="text-align:right">Report ID<br/>${esc(inspection.id.slice(0, 8).toUpperCase())}</div>
  </header>

  <div class="status ${inspection.status}">${esc(statusLabels[inspection.status].toUpperCase())}</div>

  <h2>Piece Information</h2>
  <table class="info">
    <tr><td class="k">Job #</td><td>${esc(piece.jobNumber)}</td><td class="k">Project</td><td>${esc(piece.projectName)}</td></tr>
    <tr><td class="k">Piece mark</td><td>${esc(piece.pieceMark)}</td><td class="k">Piece type</td><td>${esc(piece.pieceType)}</td></tr>
    <tr><td class="k">Bed / form</td><td>${esc(piece.bed)}</td><td class="k">Pour date</td><td>${esc(piece.pourDate)}</td></tr>
    <tr><td class="k">Shop drawing</td><td>${esc(piece.drawingNumber)}</td><td class="k">Revision</td><td>${esc(piece.drawingRevision)}</td></tr>
  </table>

  <div class="summary">
    <div><b>${totals.total}</b>Checks</div>
    <div><b style="color:#1E8E3E">${totals.pass}</b>Pass</div>
    <div><b style="color:#C62828">${totals.fail}</b>Fail</div>
    <div><b style="color:#6B7280">${totals.na}</b>N/A</div>
    <div><b style="color:#B07B00">${totals.total - totals.answered}</b>Open</div>
  </div>

  ${sections.join('')}

  ${
    inspection.generalNotes || general
      ? `<h2>General Notes & Photos</h2><p>${esc(inspection.generalNotes).replace(/\n/g, '<br/>')}</p><div class="photos">${general}</div>`
      : ''
  }

  <div class="signoff">
    <h2 style="margin-top:0">QC Sign-off</h2>
    ${
      signOff
        ? `<p><b>Decision:</b> ${esc(statusLabels[signOff.decision])}</p>
           ${signOff.comments ? `<p><b>Comments:</b> ${esc(signOff.comments)}</p>` : ''}
           ${sig}
           <p><b>${esc(signOff.inspectorName)}</b>, QC Inspector<br/><span class="muted">Signed ${esc(fmtDateTime(signOff.signedAt))}</span></p>`
        : '<p class="muted">Not signed. This inspection is still in progress.</p>'
    }
  </div>

  <footer>Generated ${esc(fmtDateTime(new Date().toISOString()))}</footer>
</body></html>`;
}

function safeName(s: string): string {
  return s.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '') || 'piece';
}

/** Renders the PDF and opens the share sheet (email, Files, Drive, print, etc.). */
export async function shareReport(inspection: Inspection): Promise<void> {
  const settings = await store.getSettings();
  const html = await buildReportHtml(inspection, settings);
  const { uri } = await Print.printToFileAsync({ html, margins: { left: 36, right: 36, top: 36, bottom: 36 } });

  const name = `PrePour_${safeName(inspection.piece.pieceMark)}_${safeName(inspection.piece.pourDate)}.pdf`;
  const target = new File(Paths.cache, name);
  if (target.exists) target.delete();
  new File(uri).moveSync(target);

  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(target.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: `Pre-pour report ${inspection.piece.pieceMark}`,
  });
}
