import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { getOpportunityCached } from "@/lib/data/cached";
import { listDocuments } from "@/lib/data/documents";
import { Card, EmptyState, SectionTitle } from "@/components/ui";
import { Markdown } from "@/components/ui/Markdown";
import { DocumentsSent } from "@/components/opportunity/DocumentsSent";

export default async function NotesPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const [opp, library] = await Promise.all([getOpportunityCached(params.id, userId), listDocuments(userId)]);
  if (!opp) notFound();

  const sections = [
    { title: "General notes", value: opp.notes, tone: "paper" as const },
    { title: "Key gaps", value: opp.keyGaps, tone: "accent" as const },
    { title: "Pros and cons", value: opp.prosConsNotes, tone: "paper" as const },
  ].filter((s): s is { title: string; value: string; tone: "paper" | "accent" } => Boolean(s.value));

  return (
    <div className="space-y-8 animate-fade-in-up">
      {sections.length === 0 ? (
        <Card tone="low">
          <EmptyState title="No notes yet." hint="Use Edit in the header to add notes, key gaps, and pros and cons. Markdown works." />
        </Card>
      ) : (
        sections.map((s) => (
          <section key={s.title}>
            <SectionTitle>{s.title}</SectionTitle>
            <Card tone={s.tone}>
              <Markdown>{s.value}</Markdown>
            </Card>
          </section>
        ))
      )}

      {opp.jdText && (
        <section>
          <SectionTitle>Job description</SectionTitle>
          <Card tone="low">
            <details>
              <summary className="text-sm font-serif italic text-ink-700 cursor-pointer">Cached text from the posting, {opp.jdText.length.toLocaleString()} characters</summary>
              <p className="text-xs text-ink-800 whitespace-pre-wrap leading-relaxed mt-3 font-mono">{opp.jdText}</p>
            </details>
          </Card>
        </section>
      )}

      <DocumentsSent
        opportunityId={opp.id}
        sent={opp.documentsSent.map((d) => ({ id: d.id, sentAt: d.sentAt, document: { id: d.document.id, name: d.document.name, type: d.document.type, version: d.document.version } }))}
        library={library.map((d) => ({ id: d.id, name: d.name, type: d.type, version: d.version }))}
      />
    </div>
  );
}
