// ============================================================
// useAcordPdf — React hook for PDF generation
// Works for any ACORD form — just pass different mapping + templates
// ============================================================

"use client";

import { useState, useCallback } from "react";
import {
  generateAcordPDF,
  downloadBlob,
  type PdfProgress,
  type PdfResult,
} from "../services/pdf-generator";
import type { AcordFormMapping, AcordFormValues } from "../types";

interface UseAcordPdfOptions {
  mapping: AcordFormMapping;
  templateUrls: string[];       // URLs to page template images
  filename?: string;
}

export function useAcordPdf(options: UseAcordPdfOptions) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<PdfProgress>({
    percent: 0,
    message: "",
    detail: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PdfResult | null>(null);

  const generate = useCallback(
    async (values: AcordFormValues) => {
      setGenerating(true);
      setError(null);
      setResult(null);
      setProgress({ percent: 0, message: "Starting...", detail: "" });

      try {
        const res = await generateAcordPDF({
          mapping: options.mapping,
          values,
          templateUrls: options.templateUrls,
          filename: options.filename,
          onProgress: setProgress,
        });

        setResult(res);
        downloadBlob(res.blob, res.filename);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "PDF generation failed";
        console.error("PDF generation failed:", err);
        setError(message);
      } finally {
        setGenerating(false);
      }
    },
    [options.mapping, options.templateUrls, options.filename]
  );

  return { generate, generating, progress, error, result };
}