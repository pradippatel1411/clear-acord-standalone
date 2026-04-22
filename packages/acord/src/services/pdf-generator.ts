// ============================================================
// ACORD PDF Generator — works for all 10 forms
// Takes: mapping JSON + form values + template page images
// Produces: filled PDF blob
//
// Template images are JPEG/PNG of each blank ACORD page.
// Field values are stamped at OCR coordinates from the mapping.
//
// Supports:
//  - Text/number/date/textarea → stamp text at OCR position
//  - Checkbox → stamp "X" at OCR position
//  - Select with pdfCheckboxMap → resolve dropdown value to
//    hidden pdfOnly checkbox field, stamp "X" at its OCR position
//  - pdfOnly fields → stamped in PDF but never rendered in UI
// ============================================================

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { AcordFormMapping, AcordField, AcordFormValues } from "../types";

// ---- Types ----

export interface PdfProgress {
  percent: number;
  message: string;
  detail: string;
}

export interface PdfResult {
  blob: Blob;
  filename: string;
  pages: number;
  fields: number;
}

export interface PdfGenerateOptions {
  mapping: AcordFormMapping;
  values: AcordFormValues;
  templateUrls: string[];          // URLs to page template images (1 per page)
  filename?: string;               // Output filename
  onProgress?: (progress: PdfProgress) => void;
}

// ---- Constants ----

// OCR coordinate space (from project instructions)
const OCR_WIDTH = 952;
const OCR_HEIGHT = 1260;

// Standard US letter in points
const PDF_WIDTH = 612;
const PDF_HEIGHT = 792;

// Checkbox marker
const CHECK_MARK = "X";

// ---- Main generator function ----

export async function generateAcordPDF(
  options: PdfGenerateOptions
): Promise<PdfResult> {
  const { mapping, values, templateUrls, onProgress } = options;

  const filename =
    options.filename ??
    `${mapping._meta.form.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;

  const report = (percent: number, message: string, detail = "") => {
    onProgress?.({ percent, message, detail });
  };

  report(5, "Creating PDF document...");

  // 1. Create PDF document
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 2. Load template pages (supports PDF templates and image templates)
  report(10, "Loading template pages...");
  const pages = [];

  // Check if we have a single PDF template (may contain multiple pages)
  const hasPdfTemplate = templateUrls.length === 1 && templateUrls[0].toLowerCase().endsWith(".pdf");

  if (hasPdfTemplate) {
    // ── PDF template: copy all pages from the existing PDF ──
    report(20, "Loading PDF template...");
    const templateBytes = await fetch(templateUrls[0]).then((r) => r.arrayBuffer());
    const templateDoc = await PDFDocument.load(templateBytes);
    const pageCount = templateDoc.getPageCount();
    const pageIndices = Array.from({ length: pageCount }, (_, i) => i);
    const copiedPages = await pdfDoc.copyPages(templateDoc, pageIndices);
    for (const copiedPage of copiedPages) {
      pdfDoc.addPage(copiedPage);
      pages.push(pdfDoc.getPage(pdfDoc.getPageCount() - 1));
    }
    report(45, `Loaded ${pageCount} pages from PDF template`);
  } else {
    // ── Image templates: embed each image as a page background ──
    const pageImages = [];

    for (let i = 0; i < templateUrls.length; i++) {
      const url = templateUrls[i];
      report(
        10 + ((i + 1) / templateUrls.length) * 30,
        "Loading template pages...",
        `Page ${i + 1} of ${templateUrls.length}`
      );

      const imageBytes = await fetch(url).then((r) => r.arrayBuffer());

      let image;
      if (url.toLowerCase().endsWith(".png")) {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }

      pageImages.push(image);
    }

    report(45, "Creating pages...");

    for (let i = 0; i < pageImages.length; i++) {
      const page = pdfDoc.addPage([PDF_WIDTH, PDF_HEIGHT]);
      page.drawImage(pageImages[i], {
        x: 0,
        y: 0,
        width: PDF_WIDTH,
        height: PDF_HEIGHT,
      });
      pages.push(page);
    }
  }

  // 4. Build field lookup for pdfCheckboxMap resolution
  const fieldById = new Map<string, AcordField>();
  for (const field of mapping.fields) {
    fieldById.set(field.fieldId, field);
  }

  // 5. Group fields by page
  const fieldsByPage = new Map<number, AcordField[]>();
  for (const field of mapping.fields) {
    const pageNum = field.ocrCoords?.page ?? 0;
    if (!fieldsByPage.has(pageNum)) fieldsByPage.set(pageNum, []);
    fieldsByPage.get(pageNum)!.push(field);
  }

  // 6. Stamp field values onto pages
  let stampedCount = 0;
  const totalFields = mapping.fields.length;

  // Collect select→checkbox stamps to apply after the main loop
  const checkboxStamps: { fieldId: string; pageNum: number }[] = [];

  for (const [pageNum, fields] of fieldsByPage.entries()) {
    if (pageNum >= pages.length) continue;
    const page = pages[pageNum];

    for (const field of fields) {
      // Skip pdfOnly fields here — they get stamped via pdfCheckboxMap
      if ((field as any).pdfOnly) {
        stampedCount++;
        continue;
      }

      const value = values[field.fieldId];
      if (value === null || value === undefined || value === "" || value === false) {
        stampedCount++;
        continue;
      }

      // ---- Select fields with pdfCheckboxMap ----
      if (field.fieldType === "select" && (field as any).pdfCheckboxMap) {
        const cbMap = (field as any).pdfCheckboxMap as Record<string, string>;
        const targetFieldId = cbMap[String(value)];
        if (targetFieldId) {
          checkboxStamps.push({ fieldId: targetFieldId, pageNum });
        }
        stampedCount++;
        continue;
      }

      if (!field.ocrCoords) {
        stampedCount++;
        continue;
      }

      // Convert OCR coords to PDF coords (use actual page size for PDF templates)
      const { width: pageW, height: pageH } = page.getSize();
      const pdfX = (field.ocrCoords.x / OCR_WIDTH) * pageW;
      const pdfY = pageH - (field.ocrCoords.y / OCR_HEIGHT) * pageH;
      const fontSize = field.ocrCoords.fontSize ?? 7;

      if (field.fieldType === "checkbox") {
        // Stamp "X" for checked checkboxes
        if (value === true || value === "true" || value === "X" || value === "x") {
          page.drawText(CHECK_MARK, {
            x: pdfX + 2,
            y: pdfY - fontSize,
            size: fontSize + 1,
            font: fontBold,
            color: rgb(0, 0, 0),
          });
        }
      } else {
        // Stamp text value — sanitize newlines and special chars
        const textValue = String(value)
          .replace(/\r\n/g, " ")
          .replace(/\n/g, " ")
          .replace(/\r/g, " ")
          .replace(/\t/g, " ")
          .replace(/[^\x20-\x7E]/g, "");  // Remove any non-printable ASCII
        const maxWidth = field.ocrCoords.width
          ? (field.ocrCoords.width / OCR_WIDTH) * pageW
          : 200;

        // Truncate text if it would overflow
        let displayText = textValue;
        const textWidth = font.widthOfTextAtSize(displayText, fontSize);
        if (textWidth > maxWidth) {
          // Simple truncation — cut characters until it fits
          while (
            font.widthOfTextAtSize(displayText + "...", fontSize) > maxWidth &&
            displayText.length > 0
          ) {
            displayText = displayText.slice(0, -1);
          }
          if (displayText.length < textValue.length) {
            displayText += "...";
          }
        }

        page.drawText(displayText, {
          x: pdfX,
          y: pdfY - fontSize,
          size: fontSize,
          font: font,
          color: rgb(0, 0, 0),
        });
      }

      stampedCount++;
      if (stampedCount % 20 === 0) {
        report(
          50 + (stampedCount / totalFields) * 40,
          "Stamping fields...",
          `${stampedCount} of ${totalFields}`
        );
      }
    }
  }

  // 7. Stamp select-driven checkboxes (pdfCheckboxMap targets)
  for (const stamp of checkboxStamps) {
    const targetField = fieldById.get(stamp.fieldId);
    if (!targetField?.ocrCoords) continue;

    const pageNum = targetField.ocrCoords.page ?? stamp.pageNum;
    if (pageNum >= pages.length) continue;

    const page = pages[pageNum];
    const { width: cbPageW, height: cbPageH } = page.getSize();
    const pdfX = (targetField.ocrCoords.x / OCR_WIDTH) * cbPageW;
    const pdfY = cbPageH - (targetField.ocrCoords.y / OCR_HEIGHT) * cbPageH;
    const fontSize = targetField.ocrCoords.fontSize ?? 6;

    page.drawText(CHECK_MARK, {
      x: pdfX + 2,
      y: pdfY - fontSize,
      size: fontSize + 1,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
  }

  // 8. Save PDF
  report(92, "Saving PDF...");
  const pdfBytes = await pdfDoc.save();

  report(98, "Creating download...");
  const blob = new Blob([pdfBytes.slice().buffer], { type: "application/pdf" });

  report(100, "Complete!", `${stampedCount} fields stamped`);

  return {
    blob,
    filename,
    pages: pages.length,
    fields: stampedCount,
  };
}

// ---- Download helper ----

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
} 