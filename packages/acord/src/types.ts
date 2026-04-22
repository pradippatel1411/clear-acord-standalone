// ============================================================
// ACORD Form Types — shared across all 10 form types
// Matches the unified-schema.md from Kevin's mapping work
// ============================================================

// ---- Field Types ----
export type AcordFieldType =
  | "text"
  | "textarea"
  | "date"
  | "currency"
  | "number"
  | "checkbox"
  | "select"
  | "signature"
  | "phone"
  | "weburl"
  | "zip"
  | "email";

export type ViewFilter = "visible" | "hidden" | "all";

// ---- Single Field Definition (from mapping JSON) ----
export interface AcordField {
  fieldId: string;            // e.g. "A125-001" or "A126-SH-R1-CLASS"
  xfKey: string | null;       // Cross-form key e.g. "PRODUCER.AGENCY_NAME"
  section: string;            // Section name e.g. "header", "policy_info"
  label: string;              // Human-readable label
  fieldType: AcordFieldType;  // Input type
  required: boolean;
  shared: boolean;            // Shared across forms via XF key?
  sourceForm: string | null;  // If shared, which form owns it (e.g. "125")

  // OCR coordinates (952x1260 pixel space)
  ocrCoords?: {
    page: number;
    x: number;
    y: number;
    width: number;
    fontSize: number;
  };

  // PDF coordinates (612x792 point space)
  pdfCoords?: {
    x: number;
    y: number;
    maxWidth: number;
    fontSize: number;
  };

  // For table fields
  tableRef?: {
    table: string;
    row: number;
    column: string;
  };

  // For select/dropdown fields
  options?: string[];

  // Max length for text inputs
  maxLength?: number;

  // Help text shown below the field
  helpText?: string;

  // When true, field shows a lock icon instead of hide/show — cannot be hidden by user
  lockField?: boolean;

  // Checkbox display style: "checkbox" (default) or "pilltoggle"
  checkboxUI?: "checkbox" | "pilltoggle";
  dbField:string; // Database field name for this form field
  // Conditional visibility — field only renders when the referenced field has the specified value
  conditionalOn?: {
    fieldId: string;
    value: string | boolean | number;
  };
}

// ---- Form Mapping (entire form definition) ----
export interface AcordFormMapping {
  _meta: {
    form: string;              // e.g. "ACORD 125"
    formNumber: string;        // e.g. "125"
    version: string;           // e.g. "2016/03"
    title: string;             // e.g. "Commercial Insurance Application"
    pages: number;             // e.g. 4
    coordinateSpace: string;   // e.g. "952x1260"
    totalOcrFields: number;
    sharedFields: number;
    generatedDate: string;
    status: string;
  };
  fields: AcordField[];
}

// ---- Section definition (for rendering groups of fields) ----
export interface AcordSection {
  id: string;                 // e.g. "header", "policy_info", "lob"
  label: string;              // e.g. "Header", "Policy Information"
  page: number;               // Which page this section is on (0-indexed)
  fields: AcordField[];       // Fields in this section
}

// ---- Form Registry Entry ----
export interface AcordFormInfo {
  formNumber: string;          // "125", "126", etc.
  title: string;               // "Commercial Insurance Application"
  shortTitle: string;          // "Commercial App"
  pages: number;
  totalFields: number;
  hasMapping: boolean;         // Has OCR coordinate mapping
  hasHtmlBuild: boolean;       // Has HTML form build
  validated: boolean;          // Mapping validated against test PDF
  status: "validated" | "mapped" | "html-only" | "not-started";
}

// ---- Form Values (field ID → value) ----
export type AcordFormValues = Record<string, string | boolean | number | null>;

// ---- Form Errors (field ID → error message) ----
export type AcordFormErrors = Record<string, string>;

// ---- Renderer Props ----
export interface FormRendererProps {
  mapping: AcordFormMapping;
  values: AcordFormValues;
  onChange: (fieldId: string, value: string | boolean | number | null) => void;
  errors?: AcordFormErrors;
  readOnly?: boolean;
  page?: number;               // Show specific page only (0-indexed)
  highlightRequired?: boolean;
}