import { notFound } from "next/navigation";
import { ACORD_FORMS } from "@clear-acord/acord";
import { AcordFormDetail } from "./acord-form-detail";

/** Forms that have detail pages (registry + extras like ACORD 25) */
const VALID_FORMS = new Set([
  ...ACORD_FORMS.map((f) => f.formNumber),
  "25",
]);

interface Props {
  params: Promise<{ formNumber: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { formNumber } = await params;
  return { title: VALID_FORMS.has(formNumber) ? `ACORD ${formNumber} | Clear ACORD` : "Not Found" };
}

export default async function AcordFormDetailPage({ params }: Props) {
  const { formNumber } = await params;
  if (!VALID_FORMS.has(formNumber)) notFound();

  return (
    <div className="min-h-full bg-gray-50">
      <AcordFormDetail formNumber={formNumber} />
    </div>
  );
}
