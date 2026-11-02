import type { Metadata } from "next";
import { requireUserId } from "@/lib/session";
import { listDocuments } from "@/lib/data/documents";
import { DocumentsLibrary } from "@/components/documents/DocumentsLibrary";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const userId = await requireUserId();
  const documents = await listDocuments(userId);
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 animate-fade-in-up">
      <DocumentsLibrary documents={documents} />
    </div>
  );
}
