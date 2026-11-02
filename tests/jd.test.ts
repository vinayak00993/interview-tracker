import { describe, it, expect } from "vitest";
import { extractJobPosting, htmlToText } from "@/lib/jd";

const JSON_LD = `<html><head><title>Head of Partnerships - Acme Careers</title>
<script type="application/ld+json">{"@type":"JobPosting","title":"Head of Partnerships","hiringOrganization":{"name":"Acme","sameAs":"https://acme.com"},"jobLocation":{"address":{"addressLocality":"Austin","addressRegion":"TX"}},"jobLocationType":"TELECOMMUTE","baseSalary":{"value":{"minValue":180000,"maxValue":240000}},"description":"<p>Lead partnerships.</p>"}</script>
</head><body><h1>Head of Partnerships</h1><p>Join us.</p></body></html>`;

describe("extractJobPosting", () => {
  it("prefers JSON-LD data", () => {
    const r = extractJobPosting(JSON_LD, "https://boards.greenhouse.io/acme/jobs/1");
    expect(r.role).toBe("Head of Partnerships");
    expect(r.company).toBe("Acme");
    expect(r.website).toBe("https://acme.com");
    expect(r.location).toBe("Austin, TX");
    expect(r.remote).toBe(true);
    expect(r.compMin).toBe(180);
    expect(r.compMax).toBe(240);
  });

  it("falls back to title and salary heuristics", () => {
    const html = `<html><head><title>Director of BD | Globex Careers</title><meta property="og:url" content="https://globex.com/careers/123"></head><body>Salary: $150,000 - $200,000 per year. Location: Denver, CO</body></html>`;
    const r = extractJobPosting(html, "https://globex.com/careers/123");
    expect(r.role).toBe("Director of BD");
    expect(r.company).toBe("Globex");
    expect(r.website).toBe("https://globex.com");
    expect(r.compMin).toBe(150);
    expect(r.compMax).toBe(200);
    expect(r.location).toBe("Denver, CO");
  });

  it("does not treat a job board as the company site", () => {
    const r = extractJobPosting("<html><title>Role - Co</title></html>", "https://jobs.lever.co/co/1");
    expect(r.website).toBeUndefined();
  });
});

describe("htmlToText", () => {
  it("strips scripts and decodes entities", () => {
    expect(htmlToText("<script>x</script><p>Tom &amp; Jerry</p>")).toBe("Tom & Jerry");
  });
});
