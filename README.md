# QA-App: Precast Pre-Pour Inspection

QA/QC inspection app for precast concrete. Use it to run pre-pour checks on a piece, take photos as evidence, sign off, and share a PDF report.

Built with Expo (React Native) for iPhone and Android.

## What it does

- **Inspections by piece**: job number, project, piece mark, piece type, bed/form, pour date, shop drawing and revision.
- **Pre-pour checklist** in five sections:
  - Forms & Dimensions
  - Concrete Cover
  - Reinforcing & Strand
  - Embeds & Inserts
  - Mix & Pour Readiness

  Each item is marked **Pass / Fail / N/A** and can have notes (measurements, deficiencies) and any number of photos.
- **Photos** from the camera or photo library, attached to a checklist item or to the inspection as a whole. Tap a photo to view it full screen, add a caption, or delete it.
- **QC sign-off**: the inspector chooses **Release to pour** or **Reject** and signs on screen.
  - Release is only allowed when every item is answered and nothing is failed.
  - Rejecting requires a reason.
  - A signed inspection is locked. It can be reopened, which clears the signature.
- **PDF report** with piece info, a pass/fail summary, every check with notes, photos with captions and timestamps, and the signature. It opens the share sheet so you can email it, save it to Files or Drive, or print it.
- **Works with no signal.** In this trial version everything is stored on the phone.

## Try it on your phone

You need a computer with [Node.js](https://nodejs.org) (LTS) and the **Expo Go** app on your phone (App Store / Google Play).

```bash
npm install
npx expo start
```

Scan the QR code with the phone camera (iPhone) or the Expo Go app (Android). The phone and computer must be on the same Wi-Fi; if they aren't, run `npx expo start --tunnel`.

### Install it as a real app on Android (no computer needed afterward)

[EAS Build](https://docs.expo.dev/build/introduction/) builds an installable `.apk` in the cloud. You need a free account at [expo.dev](https://expo.dev).

```bash
npx eas-cli@latest login
npm run build:apk
```

The first run asks to create the Expo project; answer **Yes**. If it asks about an Android keystore, also answer **Yes** so EAS generates one.

When the build finishes (about 10–20 minutes) you get a link and a QR code:

1. Open the link on your phone and download the `.apk`.
2. Tap it to install. Android asks once to allow installs from your browser; allow it.

For iPhone you need an Apple Developer account. Build with `npx eas-cli@latest build --platform ios` and distribute through TestFlight.

## Trial storage → cloud later

All reads and writes go through one interface, `src/data/storage/Store.ts`. The trial uses `LocalStore`, which keeps inspections in SQLite and photos as JPEGs in the app's private folder.

**Deleting the app deletes its data**, so share the PDF of anything you need to keep.

To move to team cloud sync (e.g. Supabase):

1. Create a `CloudStore` class that implements `Store`, saving inspections to a database table and photos to file storage.
2. Return it from `src/data/storage/index.ts`.
3. Add sign-in for inspectors.

No screens need to change. Record ids are already UUIDs, so existing on-device inspections can be uploaded as-is.

## Customizing the checklist

Edit `src/data/checklist.ts`. Each item has an `id`, the `text` shown to the inspector, and an optional `hint` (e.g. "Record measured cover").

Never reuse an id for a different check. Saved inspections reference items by id.

## Project layout

```
src/
  app/                       screens (Expo Router)
    index.tsx                inspection list, search, status filter
    new.tsx                  new inspection (piece info)
    settings.tsx             company name, plant, default inspector
    inspection/[id]/
      index.tsx              overview: sections, general photos, sign-off, PDF
      [section].tsx          checklist section: pass/fail/N/A, notes, photos
      info.tsx               edit piece info
      signoff.tsx            decision + signature
  components/                PhotoStrip, SignaturePad, PieceInfoForm, UI parts
  data/
    checklist.ts             checklist template
    inspection.ts            progress, release rules
    storage/                 Store interface + LocalStore (on device)
  report/pdf.ts              PDF report
```

## Development

```bash
npm run typecheck
npm run lint
```
