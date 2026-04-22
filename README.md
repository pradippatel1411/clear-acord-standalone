# Clear ACORD Forms — Standalone Library

A standalone Next.js project for filling ACORD insurance forms and generating filled PDFs. Built for collaboration — no backend, no database, no login, no persistence. Changes made here port back to the main Insurance Platform monorepo 1:1 because the architecture and file paths match.

## Architecture

```
clear-acord-standalone/
├── apps/
│   └── clear-acord/                ← Next.js 15 app (port 3003)
│       ├── src/app/acord-forms/    ← Library list + form detail pages
│       └── public/acord-templates/ ← Blank PDF templates
├── packages/
│   ├── acord/                      ← Form mappings, renderer, PDF generator
│   │   ├── mappings/*.json         ← Field coordinate / dbField mappings
│   │   ├── templates/              ← Blank PDF templates (source of truth)
│   │   └── src/
│   │       ├── components/         ← FormRenderer, FieldInput, sections
│   │       ├── services/           ← pdf-generator
│   │       └── types.ts, utils.ts, registry.ts
│   └── ui/                         ← Shared UI primitives
└── pnpm-workspace.yaml
```

Same shape as the main monorepo — `packages/acord`, `packages/ui`, and one app under `apps/`. No database, no tRPC, no login. Fill the form in the browser → click **Generate PDF** → download.

## Prerequisites

- Node.js **20 or newer** — https://nodejs.org
- pnpm **10** — install once with: `npm install -g pnpm`

## Run locally

```bash
pnpm install
pnpm dev
```

Open http://localhost:3003/acord-forms

## What's included

- **List page** (`/acord-forms`) — grid of available forms
- **Form page** (`/acord-forms/126/new`) — fill ACORD 126 (Commercial General Liability)
- **Generate PDF** — stamps filled values onto the blank template and downloads

Currently shipped form: **ACORD 126**. Add more forms following the same pattern — see `packages/acord/src/components/acord126/` as the template.

## Key files for making changes

| Task | File |
|---|---|
| Add a field to a form | `packages/acord/mappings/acord126.json` |
| Change field layout | `packages/acord/src/components/acord126/policy-info-section.tsx` |
| Add a new section | `packages/acord/src/components/acord126/form-renderer.tsx` |
| Change PDF stamping | `packages/acord/src/services/pdf-generator.ts` |

## How PDF generation works

The project supports two template strategies:

1. **Image templates (`.jpg`)** — each page is a JPG of the blank form. Values are stamped at OCR coordinates (`ocrCoords.x`, `y`) using `pdf-lib`.
2. **PDF templates (`.pdf`)** — e.g. ACORD 126. The blank PDF is loaded, its pages copied into the output, values stamped on top. Supports checkbox maps (`pdfCheckboxMap`) where a `select` field stamps "X" at one of several possible positions.

See `packages/acord/src/services/pdf-generator.ts` for the implementation.

## Port back to main monorepo

Since file paths and package shapes mirror the main repo:

- `packages/acord/*` → copies directly to `insurance-platform/packages/acord/`
- `apps/clear-acord/src/app/acord-forms/126/*` → copies to `insurance-platform/apps/agency-ops/src/app/(dashboard)/acord/126/`

Rename `@clear-acord/*` imports to `@insurance-platform/*` during the port. The full monorepo adds Save/Edit/Delete buttons backed by tRPC + Prisma — those are intentionally not in this standalone.

## Not included (to keep standalone simple)

- Prisma / Postgres
- tRPC / API layer
- NextAuth / login
- Save / Edit / Delete flows (no persistence)
- All other forms except ACORD 126
