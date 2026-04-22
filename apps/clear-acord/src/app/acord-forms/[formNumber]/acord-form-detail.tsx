"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronRight, FileText, CheckCircle2, Download, Loader2 } from "lucide-react";
import { ACORD_FORMS, getSections, useAcordPdf, getTemplateUrls, getFormMapping } from "@clear-acord/acord";
import type { AcordField, AcordFormValues } from "@clear-acord/acord";

/* ── Section display config ───────────────────────────────────── */
interface SectionDisplay {
  id: string;
  label: string;
  group: string;
  page: number;
  fields: AcordField[];
  description: string;
}

/** Human-friendly labels and descriptions for each section key */
const SECTION_META: Record<string, { label: string; description: string }> = {
  header:                 { label: "Header",                          description: "Top of page 1" },
  agency:                 { label: "Agency / Producer Information",   description: "Page 1, agency block" },
  carrier:                { label: "Carrier Information",             description: "Page 1, carrier block" },
  status_of_transaction:  { label: "Status of Transaction",          description: "Page 1, status block" },
  lines_of_business:      { label: "Lines of Business",              description: "Page 1, LOB checkboxes" },
  attachments:            { label: "Attachments",                    description: "Page 1, attachments block" },
  policy_info:            { label: "Policy Information",             description: "Page 1, policy block" },
  applicant_1st_insured:  { label: "Applicant / 1st Named Insured",  description: "Page 1, primary applicant" },
  applicant_2nd_insured:  { label: "2nd Named Insured",              description: "Page 1, second insured" },
  applicant_3rd_insured:  { label: "3rd Named Insured",              description: "Page 1, third insured" },
  contact_primary:        { label: "Contact — Primary",              description: "Page 2, primary contact" },
  contact_secondary:      { label: "Contact — Secondary",            description: "Page 2, secondary contact" },
  premises_info:          { label: "Premises / Primary Location",    description: "Page 2, premises block (primary location)" },
  nature_of_business:     { label: "Nature of Business / Operations",description: "Page 2, nature of business block" },
  additional_interest:    { label: "Additional Interest",            description: "Page 2, additional interest block" },
  general_information:    { label: "General Information / Questions", description: "Page 3, general questions block" },
  remarks:                { label: "Remarks / Comments",             description: "Page 3, remarks" },
  prior_carrier_1:        { label: "Prior Carrier — Year 1",         description: "Page 3, prior carrier year 1" },
  prior_carrier_2:        { label: "Prior Carrier — Year 2",         description: "Page 4, prior carrier year 2" },
  prior_carrier_3:        { label: "Prior Carrier — Year 3",         description: "Page 4, prior carrier year 3" },
  loss_history:           { label: "Loss History",                   description: "Page 4, loss history block (5-year lookback)" },
  signatures:             { label: "General Questions / Signature",  description: "Page 4, general questions and signature block" },
  // ACORD 25 sections
  cgl:                    { label: "Commercial General Liability",  description: "Page 1, CGL coverage block" },
  cgl_limits:             { label: "CGL — Limits",                  description: "Page 1, CGL limits column" },
  auto:                   { label: "Automobile Liability",           description: "Page 1, auto coverage block" },
  auto_limits:            { label: "Auto — Limits",                  description: "Page 1, auto limits column" },
  umbrella:               { label: "Umbrella / Excess Liability",    description: "Page 1, umbrella coverage block" },
  umbrella_limits:        { label: "Umbrella — Limits",              description: "Page 1, umbrella limits column" },
  wc:                     { label: "Workers Compensation",           description: "Page 1, WC coverage block" },
  wc_limits:              { label: "WC — Employer's Liability Limits", description: "Page 1, WC limits column" },
};

/* Fallback form info for forms not in the main registry */
const EXTRA_FORMS: Record<string, { title: string; shortTitle: string; pages: number; totalFields: number; hasMapping: boolean; status: string }> = {
  "25": { title: "Certificate of Liability Insurance", shortTitle: "COI", pages: 1, totalFields: 51, hasMapping: true, status: "validated" },
};

export function AcordFormDetail({ formNumber }: { formNumber: string }) {
  const registryForm = ACORD_FORMS.find((f) => f.formNumber === formNumber);
  const extra = EXTRA_FORMS[formNumber];
  const form = registryForm ?? {
    formNumber,
    title: extra?.title ?? `ACORD ${formNumber}`,
    shortTitle: extra?.shortTitle ?? formNumber,
    pages: extra?.pages ?? 1,
    totalFields: extra?.totalFields ?? 0,
    hasMapping: extra?.hasMapping ?? false,
    hasHtmlBuild: false,
    validated: false,
    status: extra?.status ?? "not-started",
  };
  const mapping = getFormMapping(formNumber);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});

  const handleSampleChange = (fieldId: string, value: string) => {
    setSampleValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  /* PDF generation */
  const templateUrls = getTemplateUrls(formNumber);
  const hasTemplates = templateUrls.length > 0;
  const { generate, generating, progress, error: pdfError } = useAcordPdf({
    mapping: mapping!,
    templateUrls,
  });

  const filledCount = Object.values(sampleValues).filter((v) => v !== "" && v !== "false").length;

  const handleGeneratePdf = () => {
    if (!mapping) return;
    const values: AcordFormValues = {};
    for (const field of mapping.fields) {
      const raw = sampleValues[field.fieldId];
      if (raw === undefined || raw === "") continue;
      if (field.fieldType === "checkbox") {
        values[field.fieldId] = raw === "true";
      } else {
        values[field.fieldId] = raw;
      }
    }
    generate(values);
  };

  /* Build section list from mapping */
  const sections: SectionDisplay[] = useMemo(() => {
    if (!mapping) return [];
    const raw = getSections(mapping);
    return raw.map((s) => {
      const meta = SECTION_META[s.id] ?? { label: s.label, description: "" };
      return {
        id: s.id,
        label: meta.label,
        group: `group: ${s.id}`,
        page: s.page + 1,
        fields: s.fields,
        description: meta.description,
      };
    });
  }, [mapping]);

  /* Stats */
  const totalFields = mapping?.fields.length ?? form.totalFields;
  const requiredFields = mapping?.fields.filter((f) => f.required).length ?? 0;
  const pdfPages = mapping?._meta.pages ?? form.pages;

  return (
    <>
      {/* ── Back nav + header ─────────────────────────────────── */}
      <div className="px-6 py-5">
        <Link
          href="/acord-forms"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to ACORD Forms
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
              <FileText className="h-5 w-5 text-brand-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                ACORD {formNumber} — {form.title}
              </h1>
              <p className="text-sm text-gray-500">
                {mapping?._meta.version ? `Version ${mapping._meta.version}` : ""}{" "}
                {mapping?._meta.status ? `· Status: ${mapping._meta.status}` : ""}
              </p>
            </div>
          </div>

          {/* Generate PDF button */}
          {mapping && hasTemplates && (
            <button
              onClick={handleGeneratePdf}
              disabled={generating || filledCount === 0}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {generating ? "Generating…" : "Generate PDF"}
              {!generating && filledCount > 0 && (
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                  {filledCount} filled
                </span>
              )}
            </button>
          )}
        </div>

        {/* Progress bar */}
        {generating && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{progress.message}</span>
              <span>{progress.percent}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-brand-600 transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* PDF error */}
        {pdfError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {pdfError}
          </div>
        )}
      </div>

      {/* ── Section mapping card ──────────────────────────────── */}
      <div className="mx-6 mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-red-500" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">
              Field Mapping by Section
            </h2>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Click a section to expand fields
          </p>
        </div>

        <div className="grid grid-cols-4 border-b border-gray-100">
          <StatBox label="Sections" value={sections.length || "—"} />
          <StatBox label="Total Fields" value={totalFields} />
          <StatBox label="Required Fields" value={requiredFields} />
          <StatBox label="PDF Pages" value={pdfPages} />
        </div>

        {!mapping ? (
          <div className="py-16 text-center text-sm text-gray-400">
            {form.hasMapping
              ? "Loading field mapping…"
              : "Field mapping not yet available for this form."}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sections.map((section) => (
              <SectionAccordion
                key={section.id}
                section={section}
                expanded={expandedSection === section.id}
                sampleValues={sampleValues}
                onSampleChange={handleSampleChange}
                onToggle={() =>
                  setExpandedSection(
                    expandedSection === section.id ? null : section.id,
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ── Stat box ─────────────────────────────────────────────────── */
function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-6 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

/* ── Section accordion ────────────────────────────────────────── */
function SectionAccordion({
  section,
  expanded,
  sampleValues,
  onSampleChange,
  onToggle,
}: {
  section: SectionDisplay;
  expanded: boolean;
  sampleValues: Record<string, string>;
  onSampleChange: (fieldId: string, value: string) => void;
  onToggle: () => void;
}) {
  const totalCount = section.fields.length;

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-gray-50/60"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{section.label}</p>
          <p className="text-xs text-gray-400">
            Page {section.page} · group: {section.id} · {totalCount} fields
          </p>
        </div>

        {section.description && (
          <span className="hidden rounded border border-gray-200 px-2.5 py-1 text-[11px] text-gray-500 sm:inline-block">
            {section.description}
          </span>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">
            {totalCount}{" "}
            <span className="text-gray-400">/ {totalCount}</span>
          </span>
          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/40 px-6 py-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  <th className="pb-2 pr-3 w-[120px]">Field ID</th>
                  <th className="px-3 pb-2">Label / Meta</th>
                  <th className="px-3 pb-2 w-[90px]">Type</th>
                  <th className="px-3 pb-2 w-[50px]">Req</th>
                  <th className="px-3 pb-2 w-[200px]">Sample Value</th>
                </tr>
              </thead>
              <tbody>
                {section.fields.map((field) => (
                  <FieldRow
                    key={field.fieldId}
                    field={field}
                    sectionDescription={section.description}
                    value={sampleValues[field.fieldId] ?? ""}
                    onChange={onSampleChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Field row inside expanded section ────────────────────────── */
function FieldRow({
  field,
  sectionDescription,
  value,
  onChange,
}: {
  field: AcordField;
  sectionDescription: string;
  value: string;
  onChange: (fieldId: string, value: string) => void;
}) {
  const acronym = field.fieldId.replace(/^A\d+-/, "");

  return (
    <tr className="border-b border-gray-100 last:border-0 align-top">
      <td className="py-3 pr-3 font-mono text-xs text-brand-600">
        {field.fieldId}
      </td>

      <td className="px-3 py-3">
        <p className="text-sm font-semibold text-gray-900">{field.label}</p>
        <p className="mt-0.5 text-[11px] text-gray-400">
          <span className="font-mono">acroName:</span>{" "}
          <span className="font-mono text-gray-500">{acronym}</span>
        </p>
        <p className="text-[11px] text-gray-400">
          source:{" "}
          <span className="font-mono italic text-gray-500">{field.dbField || "—"}</span>
        </p>
        <p className="text-[11px] text-gray-400">
          pdf: {sectionDescription}, {field.label.toLowerCase()}
        </p>
      </td>

      <td className="px-3 py-3">
        <span className="inline-block rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-700">
          {field.fieldType}
        </span>
      </td>

      <td className="px-3 py-3 text-center">
        {field.required ? (
          <span className="text-red-500 text-lg leading-none">•</span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>

      <td className="px-3 py-3">
        {field.fieldType === "checkbox" ? (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value === "true"}
              onChange={(e) => onChange(field.fieldId, e.target.checked ? "true" : "")}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs text-gray-500">{value === "true" ? "Yes" : "No"}</span>
          </label>
        ) : field.fieldType === "select" && field.options?.length ? (
          <select
            value={value}
            onChange={(e) => onChange(field.fieldId, e.target.value)}
            className="h-8 w-full rounded border border-gray-200 bg-white px-2 text-xs text-gray-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-100"
          >
            <option value="">—</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : field.fieldType === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => onChange(field.fieldId, e.target.value)}
            rows={2}
            placeholder={field.label}
            className="w-full rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 placeholder:text-gray-300 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-100"
          />
        ) : (
          <input
            type={field.fieldType === "date" ? "date" : field.fieldType === "number" || field.fieldType === "currency" ? "number" : "text"}
            value={value}
            onChange={(e) => onChange(field.fieldId, e.target.value)}
            placeholder={field.label}
            className="h-8 w-full rounded border border-gray-200 bg-white px-2.5 text-xs text-gray-700 placeholder:text-gray-300 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-100"
          />
        )}
      </td>
    </tr>
  );
}
