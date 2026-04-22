"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, ChevronRight } from "lucide-react";
import { ACORD_FORMS } from "@clear-acord/acord";
import type { AcordFormInfo } from "@clear-acord/acord";


/* ── Only show forms that have mapping / PDF generation done ──── */
const ACORD_25_INFO: AcordFormInfo = {
  formNumber: "25",
  title: "Certificate of Liability Insurance",
  shortTitle: "COI",
  pages: 1,
  totalFields: 45,
  hasMapping: true,
  hasHtmlBuild: false,
  validated: true,
  status: "validated",
};

const AVAILABLE_FORMS: AcordFormInfo[] = [
  ACORD_25_INFO,
  ...ACORD_FORMS.filter((f) => f.formNumber === "125" || f.formNumber === "126"),
];

/* ── Status badge colour map ──────────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  validated:   "bg-green-50 text-green-700",
  mapped:      "bg-amber-50 text-amber-700",
  "html-only": "bg-blue-50 text-blue-700",
  "not-started": "bg-gray-100 text-gray-500",
};

/* ── LOB labels for each form ─────────────────────────────────── */
const LOB_MAP: Record<string, string> = {
  "25":  "All LOB",
  "125": "All LOB",
  "126": "GL",
};

export function AcordFormsLibrary() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return AVAILABLE_FORMS;
    const q = search.toLowerCase();
    return AVAILABLE_FORMS.filter(
      (f) =>
        f.formNumber.includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.shortTitle.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold text-gray-900">
            Applications &amp; ACORD Forms
          </h1>
          <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            Library
          </span>
        </div>
      </div>

      {/* ── Table Card ─────────────────────────────────────────── */}
      <div className="mx-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Sub-header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-brand-600" />
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-900">
              ACORD Form Library
            </h2>
            <span className="text-xs text-gray-400">
              {filtered.length} forms
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search forms…"
              className="h-9 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="py-3 pl-6 pr-3 w-[80px]">Form</th>
                <th className="px-3 py-3 w-[100px]">Name</th>
                <th className="px-3 py-3">Title</th>
                <th className="px-3 py-3 w-[120px]">Fields</th>
                <th className="px-3 py-3 w-[100px]">Status</th>
                <th className="px-3 py-3 w-[80px]">LOB</th>
                <th className="px-3 py-3 w-[80px]">Pages</th>
                <th className="py-3 pl-3 pr-6 w-[40px]"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((form) => (
                <FormRow key={form.formNumber} form={form} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                    No forms match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ── Table row ────────────────────────────────────────────────── */
function FormRow({ form }: { form: AcordFormInfo }) {
  const router = useRouter();
  const statusColor = STATUS_COLORS[form.status] ?? STATUS_COLORS["not-started"];

  return (
    <tr
      onClick={() => router.push(`/acord-forms/${form.formNumber}`)}
      className="group cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50/80"
    >
      <td className="py-3.5 pl-6 pr-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="font-semibold text-gray-900">{form.formNumber}</span>
        </div>
      </td>
      <td className="px-3 py-3.5 text-gray-600">{form.shortTitle}</td>
      <td className="px-3 py-3.5 text-gray-700">{form.title}</td>
      <td className="px-3 py-3.5">
        <span className="font-mono text-gray-600">
          {form.totalFields}
        </span>
      </td>
      <td className="px-3 py-3.5">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColor}`}
        >
          {form.status === "html-only" ? "HTML Only" : form.status}
        </span>
      </td>
      <td className="px-3 py-3.5 text-gray-500">
        {LOB_MAP[form.formNumber] ?? "—"}
      </td>
      <td className="px-3 py-3.5 text-gray-500">{form.pages}</td>
      <td className="py-3.5 pl-3 pr-6">
        <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-brand-600" />
      </td>
    </tr>
  );
}
