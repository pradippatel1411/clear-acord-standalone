// ============================================================
// Centralized mapping loader — single source of truth
// ============================================================

import type { AcordFormMapping } from "./types";

import acord25_2016 from "../mappings/acord25_2016.json";
import acord125 from "../mappings/acord125.json";
import acord126 from "../mappings/acord126.json";

const MAPPING_REGISTRY: Record<string, AcordFormMapping> = {
  "25":      acord25_2016 as unknown as AcordFormMapping,
  "25-2016": acord25_2016 as unknown as AcordFormMapping,
  "125":     acord125 as unknown as AcordFormMapping,
  "126":     acord126 as unknown as AcordFormMapping,
};

export function getFormMapping(
  formNumber: string,
  edition?: string,
): AcordFormMapping | null {
  if (edition) {
    return MAPPING_REGISTRY[`${formNumber}-${edition}`] ?? MAPPING_REGISTRY[formNumber] ?? null;
  }
  return MAPPING_REGISTRY[formNumber] ?? null;
}

export function getAvailableMappings(): string[] {
  return [...new Set(Object.keys(MAPPING_REGISTRY).filter((k) => !k.includes("-")))];
}
