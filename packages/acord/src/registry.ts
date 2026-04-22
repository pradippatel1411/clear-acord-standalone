// ============================================================
// ACORD Form Registry — metadata for the form library UI
// ============================================================

import type { AcordFormInfo } from "./types";

export const ACORD_FORMS: AcordFormInfo[] = [
  {
    formNumber: "125",
    title: "Commercial Insurance Application",
    shortTitle: "Commercial App",
    pages: 4,
    totalFields: 543,
    hasMapping: true,
    hasHtmlBuild: true,
    validated: true,
    status: "validated",
  },
  {
    formNumber: "126",
    title: "Commercial General Liability Section",
    shortTitle: "CGL",
    pages: 1,
    totalFields: 194,
    hasMapping: true,
    hasHtmlBuild: false,
    validated: true,
    status: "validated",
  },
];

export function getFormInfo(formNumber: string): AcordFormInfo | undefined {
  return ACORD_FORMS.find((f) => f.formNumber === formNumber);
}

export function getFormsByStatus(status: AcordFormInfo["status"]): AcordFormInfo[] {
  return ACORD_FORMS.filter((f) => f.status === status);
}

export function getAvailableForms(): AcordFormInfo[] {
  return ACORD_FORMS.filter((f) => f.hasMapping || f.hasHtmlBuild);
}
