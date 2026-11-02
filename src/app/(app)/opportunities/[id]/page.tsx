import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { getOpportunityCached } from "@/lib/data/cached";
import { formatComp, formatLocation, humanize, WARMTH_BADGE } from "@/lib/pipeline";
import { formatDate } from "@/lib/format";
import { parseStoredDate } from "@/lib/time";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import { Markdown } from "@/components/ui/Markdown";
import { FollowUpControl } from "@/components/opportunity/FollowUpControl";

function headlineOf(content: string): string | null {
  try {
    const parsed = JSON.parse(content) as { headline?: unknown };
    return typeof parsed.headline === "string" ? parsed.headline : null;
  } catch {
    return null;
  }
}

export default async function OverviewPage({ params }: { params: { id: string } }) {
  const userId = await requireUserId();
  const opp = await getOpportunityCached(params.id, userId);
  if (!opp) notFound();

  const next = opp.interviews
    .filter((i) => i.status === "scheduled")
    .sort((a, b) => (a.dateTime ?? "").localeCompare(b.dateTime ?? ""))[0];
  const completed = opp.interviews.filter((i) => i.status === "completed").length;
  const latestPrep = opp.preps[0];
  const latestHeadline = latestPrep ? headlineOf(latestPrep.content) : null;
  const comp = formatComp(opp.compMin, opp.compMax);
  const applied = parseStoredDate(opp.appliedDate);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="manuscript-label mb-1">Compensation</p>
          {comp ? (
            <>
              <p className="manuscript-display text-xl text-ink-900">{comp}</p>
              <p className="text-xs text-ink-600 mt-1">Base range, in thousands</p>
            </>
          ) : (
            <p className="text-sm font-serif italic text-ink-600">Not recorded yet</p>
          )}
        </Card>
        <Card>
          <p className="manuscript-label mb-1">Fit and priority</p>
          <div className="flex items-center gap-3 flex-wrap">
            {opp.fitScore != null ? (
              <span className="manuscript-display text-xl text-terracotta">{opp.fitScore}%</span>
            ) : (
              <span className="text-sm font-serif italic text-ink-600">No score</span>
            )}
            {opp.tier && <Badge className="bg-vellum-high text-ink-700">Tier {opp.tier}</Badge>}
            <Badge className={opp.priority === "high" ? "bg-terracotta/10 text-terracotta" : "bg-vellum-high text-ink-700"}>{opp.priority}</Badge>
          </div>
          <p className="text-xs text-ink-600 mt-1">Your own read on the match</p>
        </Card>
        <Card>
          <p className="manuscript-label mb-1">Where and when</p>
          <p className="text-sm text-ink-900 font-medium">
            {formatLocation(opp.location, opp.remote) || "Location not set"}
          </p>
          <p className="text-xs text-ink-600 mt-1">
            {applied ? `Applied ${formatDate(opp.appliedDate)}` : "Not applied yet"}
            {completed > 0 ? ` · ${completed} round${completed > 1 ? "s" : ""} done` : ""}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {opp.keyGaps && (
            <section>
              <SectionTitle>Gaps to address</SectionTitle>
              <Card tone="accent">
                <Markdown>{opp.keyGaps}</Markdown>
              </Card>
            </section>
          )}

          <section>
            <SectionTitle
              action={
                <Link href={`/opportunities/${opp.id}/notes`} className="text-[10px] font-semibold uppercase tracking-label text-terracotta hover:underline">
                  All notes
                </Link>
              }
            >
              Notes
            </SectionTitle>
            {opp.notes ? (
              <Card>
                <Markdown>{opp.notes}</Markdown>
              </Card>
            ) : (
              <Card tone="low">
                <EmptyState title="No notes yet." hint="Use Edit in the header to add why this role matters and what you know so far." />
              </Card>
            )}
          </section>

          {opp.prosConsNotes && (
            <section>
              <SectionTitle>Pros and cons</SectionTitle>
              <Card>
                <Markdown>{opp.prosConsNotes}</Markdown>
              </Card>
            </section>
          )}
        </div>

        <div className="lg:col-span-2 space-y-8">
          <section>
            <SectionTitle
              action={
                <Link href={`/opportunities/${opp.id}/interviews`} className="text-[10px] font-semibold uppercase tracking-label text-terracotta hover:underline">
                  Interviews
                </Link>
              }
            >
              Next up
            </SectionTitle>
            {next ? (
              <Card tone="accent">
                <p className="font-serif text-lg text-ink-900 leading-tight">{next.round}</p>
                {next.dateTime && <p className="text-[11px] font-semibold uppercase tracking-label text-terracotta mt-1.5">{formatDate(next.dateTime, "full")}</p>}
                <p className="text-xs text-ink-700 mt-2">
                  {humanize(next.format)}
                  {next.durationMin ? ` · ${next.durationMin} min` : ""}
                  {next.interviewerName ? ` · ${next.interviewerName}` : ""}
                </p>
                <Link href={`/opportunities/${opp.id}/prep?interview=${next.id}`} className="inline-block mt-3 text-[11px] font-semibold uppercase tracking-label text-terracotta hover:underline">
                  Prep for this round
                </Link>
              </Card>
            ) : (
              <Card tone="low">
                <p className="text-sm font-serif italic text-ink-700">No interview scheduled.</p>
                <Link href={`/opportunities/${opp.id}/interviews`} className="inline-block mt-2 text-[11px] font-semibold uppercase tracking-label text-terracotta hover:underline">
                  Add a round
                </Link>
              </Card>
            )}
          </section>

          <section>
            <SectionTitle>Follow-up</SectionTitle>
            <FollowUpControl opportunityId={opp.id} followUpAt={opp.followUpAt} />
          </section>

          {latestPrep && (
            <section>
              <SectionTitle
                action={
                  <Link href={`/opportunities/${opp.id}/prep`} className="text-[10px] font-semibold uppercase tracking-label text-terracotta hover:underline">
                    Open prep
                  </Link>
                }
              >
                Latest prep
              </SectionTitle>
              <Card>
                <p className="text-sm font-serif text-ink-900 leading-relaxed">{latestHeadline || "A prep sheet is ready."}</p>
                <p className="text-[10px] uppercase tracking-label text-ink-600 mt-2">Generated {formatDate(latestPrep.createdAt)}</p>
              </Card>
            </section>
          )}

          {opp.opportunityContacts.length > 0 && (
            <section>
              <SectionTitle
                action={
                  <Link href={`/opportunities/${opp.id}/contacts`} className="text-[10px] font-semibold uppercase tracking-label text-terracotta hover:underline">
                    All contacts
                  </Link>
                }
              >
                Key contacts
              </SectionTitle>
              <Card>
                <ul className="divide-y divide-vellum-high">
                  {opp.opportunityContacts.map(({ id, role, contact }) => (
                    <li key={id} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-ink-900 font-medium truncate">{contact.name}</p>
                        <p className="text-xs text-ink-600 truncate">
                          {contact.title}
                          {contact.title && contact.company ? " · " : ""}
                          {contact.company}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {role && <Badge className="bg-terracotta/10 text-terracotta">{humanize(role)}</Badge>}
                        {contact.warmth && <Badge className={WARMTH_BADGE[contact.warmth] ?? "bg-vellum-high text-ink-700"}>{contact.warmth}</Badge>}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}

          {opp.offer && (
            <section>
              <SectionTitle
                action={
                  <Link href="/dashboard/offers" className="text-[10px] font-semibold uppercase tracking-label text-terracotta hover:underline">
                    Compare offers
                  </Link>
                }
              >
                Offer
              </SectionTitle>
              <Card tone="sage">
                <p className="manuscript-display text-xl text-ink-900">{opp.offer.baseComp ? `$${opp.offer.baseComp}K base` : "Offer on file"}</p>
                <p className="text-xs text-ink-700 mt-1">
                  {[
                    opp.offer.signOnBonus ? `$${opp.offer.signOnBonus}K sign-on` : null,
                    opp.offer.equityValue ? `$${opp.offer.equityValue}K equity` : null,
                    opp.offer.expiryDate ? `expires ${opp.offer.expiryDate}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Details on the offers page"}
                </p>
                {opp.offer.aiSummary && <p className="text-sm font-serif italic text-ink-700 mt-2">{opp.offer.aiSummary}</p>}
              </Card>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
