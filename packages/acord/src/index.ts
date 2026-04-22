// ============================================================
// @clear-acord/acord — Main Entry Point
// ============================================================

// --- Types ---
export type {
  AcordFieldType,
  AcordField,
  AcordFormMapping,
  AcordSection,
  AcordFormInfo,
  AcordFormValues,
  AcordFormErrors,
} from "./types";

// --- Hooks ---
export { useAcordPdf } from "./hooks/use-acord-pdf";

// --- PDF Service ---
export {
  generateAcordPDF,
  downloadBlob,
} from "./services/pdf-generator";
export type { PdfProgress, PdfResult, PdfGenerateOptions } from "./services/pdf-generator";

// --- Templates ---
export { ACORD_TEMPLATES, getTemplateUrls } from "./templates";
export type { AcordTemplateConfig } from "./templates";

// --- Registry ---
export {
  ACORD_FORMS,
  getFormInfo,
  getFormsByStatus,
  getAvailableForms,
} from "./registry";

// --- Mappings ---
export { getFormMapping, getAvailableMappings } from "./mappings";

// --- Utilities ---
export {
  getFieldsByPage,
  getSections,
  getSharedFields,
  getFieldsByXfKey,
  createEmptyValues,
  validateRequired,
  getCompletionStats,
} from "./utils";
