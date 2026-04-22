import { AcordFormsLibrary } from "./acord-forms-library";

export const metadata = {
  title: "ACORD Forms | Clear ACORD",
};

export default function AcordFormsPage() {
  return (
    <div className="min-h-full bg-gray-50">
      <AcordFormsLibrary />
    </div>
  );
}
