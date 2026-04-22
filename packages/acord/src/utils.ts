// ============================================================
// Utility functions for ACORD form processing
// ============================================================

import type { AcordFormMapping, AcordField, AcordSection, AcordFormValues } from "./types";

/**
 * Group mapping fields into sections organized by page.
 */
export function getFieldsByPage(mapping: AcordFormMapping): Map<number, AcordField[]> {
  const pages = new Map<number, AcordField[]>();
  for (const field of mapping.fields) {
    const page = field.ocrCoords?.page ?? 0;
    if (!pages.has(page)) pages.set(page, []);
    pages.get(page)!.push(field);
  }
  return pages;
}

/**
 * Group mapping fields into named sections.
 */
export function getSections(mapping: AcordFormMapping): AcordSection[] {
  const sectionMap = new Map<string, AcordField[]>();

  for (const field of mapping.fields) {
    const key = field.section || "other";
    if (!sectionMap.has(key)) sectionMap.set(key, []);
    sectionMap.get(key)!.push(field);
  }

  return Array.from(sectionMap.entries()).map(([id, fields]) => ({
    id,
    label: id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    page: fields[0]?.ocrCoords?.page ?? 0,
    fields,
  }));
}

/**
 * Get all shared fields (XF keys) from a mapping.
 * These are fields that flow between ACORD 125 and supplements.
 */
export function getSharedFields(mapping: AcordFormMapping): AcordField[] {
  return mapping.fields.filter((f) => f.shared && f.xfKey);
}

/**
 * Get all fields for a specific XF key across mappings.
 * Used to pre-fill supplement forms from ACORD 125 data.
 */
export function getFieldsByXfKey(
  mapping: AcordFormMapping,
  xfKey: string
): AcordField[] {
  return mapping.fields.filter((f) => f.xfKey === xfKey);
}

/**
 * Initialize empty form values for all fields in a mapping.
 */
export function createEmptyValues(mapping: AcordFormMapping): AcordFormValues {
  const values: AcordFormValues = {};
  for (const field of mapping.fields) {
    if (field.fieldType === "checkbox") {
      values[field.fieldId] = false;
    } else {
      values[field.fieldId] = "";
    }
  }
  return values;
}

/**
 * Validate required fields. Returns error map.
 */
export function validateRequired(
  mapping: AcordFormMapping,
  values: AcordFormValues
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of mapping.fields) {
    if (!field.required) continue;

    const val = values[field.fieldId];
    if (val === null || val === undefined || val === "" || val === false) {
      errors[field.fieldId] = `${field.label} is required`;
    }
  }

  return errors;
}

/**
 * Count filled vs total fields (for progress tracking).
 */
export function getCompletionStats(
  mapping: AcordFormMapping,
  values: AcordFormValues
): { filled: number; total: number; required: number; requiredFilled: number } {
  let filled = 0;
  let required = 0;
  let requiredFilled = 0;

  for (const field of mapping.fields) {
    const val = values[field.fieldId];
    const isFilled = val !== null && val !== undefined && val !== "" && val !== false;

    if (isFilled) filled++;
    if (field.required) {
      required++;
      if (isFilled) requiredFilled++;
    }
  }

  return { filled, total: mapping.fields.length, required, requiredFilled };
}