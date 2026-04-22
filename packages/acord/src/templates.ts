// ============================================================
// Template URL config for all ACORD forms
// Templates served from Next.js public/acord-templates/
// ============================================================

export interface AcordTemplateConfig {
  formNumber: string;
  pageUrls: string[];
}

const BASE = "/acord-templates";

export const ACORD_TEMPLATES: Record<string, AcordTemplateConfig> = {
  "25": {
    formNumber: "25",
    pageUrls: [`${BASE}/acord25_2016.pdf`],
  },
  "125": {
    formNumber: "125",
    pageUrls: [`${BASE}/acord125_2016.pdf`],
  },
  "126": {
    formNumber: "126",
    pageUrls: [`${BASE}/acord126_2016.pdf`],
  },
};

export function getTemplateUrls(formNumber: string): string[] {
  return ACORD_TEMPLATES[formNumber]?.pageUrls ?? [];
}
