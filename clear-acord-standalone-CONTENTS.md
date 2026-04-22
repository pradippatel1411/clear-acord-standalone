# clear-acord-standalone.zip — Project Summary

**Archive:** `clear-acord-standalone.zip` (~1.58 MB)

## What's Working

A standalone ACORD Forms application with the following functionality:

- **Forms Library view** — lists all supported ACORD forms
- **Form Detail view** — user enters details into the selected ACORD form
- **PDF generation** — generates a filled ACORD PDF from the entered details, ready for download

## Supported ACORD Forms

| Form       | Name                                      |
|------------|-------------------------------------------|
| ACORD 25   | Certificate of Liability Insurance        |
| ACORD 101  | Additional Remarks Schedule               |
| ACORD 125  | Commercial Insurance Application          |
| ACORD 126  | Commercial General Liability Section      |

Each form: open from the library → fill in details → generate PDF. End-to-end flow is working for all four forms.

## How to Run

```bash
pnpm install
pnpm dev     # opens at http://localhost:3003
```

(Requires Node.js 20+ and pnpm. `node_modules` and build output are not included in the zip — `pnpm install` restores them.)
